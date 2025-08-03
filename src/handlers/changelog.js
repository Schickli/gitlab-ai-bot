import GitLabService from '../services/gitlab.js';
import OpenAIService from '../services/openai.js';
import { config } from '../config/index.js';

class ChangelogHandler {
  constructor() {
    this.gitlabService = new GitLabService();
    this.openaiService = new OpenAIService();
  }

  async handleChangelogUpdate(payload) {
    const mergeRequest = payload.merge_request;
    const projectId = payload.project.id;

    if (!mergeRequest) {
      await this.gitlabService.postCommentReply(
        mergeRequest.iid, 
        'There are no changes to create a changelog on ❌', 
        payload.object_attributes.discussion_id, 
        projectId
      );
      return;
    }

    try {
      const ticketNumber = this._getTicketNumberFromMR(mergeRequest.description);
      const diff = await this.gitlabService.getMergeRequestChanges(mergeRequest.iid, projectId);

      if (this._changelogAlreadyExists(diff)) {
        await this.gitlabService.postCommentReply(
          mergeRequest.iid, 
          'Changelog already exists in this MR ✅', 
          payload.object_attributes.discussion_id, 
          projectId
        );
        return;
      }

      const codeDiffString = this._createDiffString(diff);
      const changelog = await this.openaiService.generateChangelog(codeDiffString);
      
      let finalChangelog = changelog;
      if (ticketNumber !== '') {
        finalChangelog = changelog + ' (' + ticketNumber + ')';
      }

      await this.gitlabService.updateChangelog(mergeRequest.source_branch, finalChangelog, projectId);
      
      await this.gitlabService.postCommentReply(
        mergeRequest.iid, 
        'Updating of changelog was successful ✅', 
        payload.object_attributes.discussion_id, 
        projectId
      );
    } catch (error) {
      await this.gitlabService.postCommentReply(
        mergeRequest.iid, 
        'Error generating or updating changelog ❌', 
        payload.object_attributes.discussion_id, 
        projectId
      );
      throw error;
    }
  }

  async handleChangelogReminder(mergeRequest, projectId) {
    try {
      const diff = await this.gitlabService.getMergeRequestChanges(mergeRequest.iid, projectId);

      if (this._changelogAlreadyExists(diff)) {
        return;
      }

      await this.gitlabService.postComment(
        mergeRequest.iid,
        'You are missing a changelog! 🚀 Remember to add it manually or use `!changelog` in a comment to automatically update the changelog with AI!',
        projectId
      );
    } catch (error) {
      console.error('Error handling changelog reminder:', error);
      throw error;
    }
  }

  _getTicketNumberFromMR(description) {
    const jiraTicketMatch = description.match(config.jira.format);
    if (!jiraTicketMatch) {
      console.info('No JIRA ticket found in description');
      return '';
    }

    return jiraTicketMatch[0];
  }

  _changelogAlreadyExists(diff) {
    const changelogChanges = diff.find(change =>
      change.new_path.toLowerCase().includes('changelog.md')
    );

    return !!changelogChanges;
  }

  _createDiffString(diff) {
    const codeDiff = diff.filter(change =>
      !change.new_path.toLowerCase().includes('changelog.md') &&
      !change.new_path.toLowerCase().includes('docs')
    );

    const diffString = codeDiff.map(change => {
      return `File: ${change.new_path}\n${change.diff}`;
    }).join('\n');

    return diffString;
  }
}

export default ChangelogHandler;