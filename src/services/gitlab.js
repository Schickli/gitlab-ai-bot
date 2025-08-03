import axios from 'axios';
import { config } from '../config/index.js';

class GitLabService {
  constructor() {
    this.apiUrl = config.gitlab.apiUrl;
    this.accessToken = config.gitlab.accessToken;
    this.changelogLocation = config.changelog.location;
  }

  async getMergeRequestChanges(mrIid, projectId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/projects/${projectId}/merge_requests/${mrIid}/diffs`,
        {
          headers: { 'PRIVATE-TOKEN': this.accessToken },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch merge request changes: ${error.response?.data?.message || error.message}`);
    }
  }

  async postCommentReply(mrIid, comment, discussionId, projectId) {
    try {
      await axios.post(
        `${this.apiUrl}/projects/${projectId}/merge_requests/${mrIid}/discussions/${discussionId}/notes`,
        { body: comment },
        {
          headers: { 'PRIVATE-TOKEN': this.accessToken },
        }
      );
    } catch (error) {
      throw new Error(`Failed to post comment reply: ${error.response?.data?.message || error.message}`);
    }
  }

  async postComment(mrIid, comment, projectId) {
    try {
      await axios.post(
        `${this.apiUrl}/projects/${projectId}/merge_requests/${mrIid}/notes`,
        { body: comment },
        {
          headers: { 'PRIVATE-TOKEN': this.accessToken },
        }
      );
    } catch (error) {
      throw new Error(`Failed to post comment: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateChangelog(branch, changelog, projectId) {
    try {
      const filePath = encodeURIComponent(this.changelogLocation);
      let content;
      
      try {
        const response = await axios.get(
          `${this.apiUrl}/projects/${projectId}/repository/files/${filePath}/raw`,
          {
            headers: { 'PRIVATE-TOKEN': this.accessToken },
            params: { ref: 'main' }
          }
        );
        content = response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Changelog file not found, creating a new one.');
          content = '# Changelog\n\n[Unreleased]\n';
        } else {
          throw error;
        }
      }

      const unreleasedIndex = content.toLowerCase().indexOf('[unreleased]');
      if (unreleasedIndex === -1) {
        throw new Error('Could not find [unreleased] section in changelog');
      }
      
      const positionOfNewEntry = content.indexOf('\n', unreleasedIndex) + 1;
      const updatedContent = content.slice(0, positionOfNewEntry) + `${changelog}\n` + content.slice(positionOfNewEntry);
      
      const commitMessage = 'chore: update changelog';
      
      await axios.post(
        `${this.apiUrl}/projects/${projectId}/repository/commits`,
        {
          branch: branch,
          commit_message: commitMessage,
          actions: [
            {
              action: 'update',
              file_path: this.changelogLocation,
              content: updatedContent
            }
          ]
        },
        {
          headers: { 'PRIVATE-TOKEN': this.accessToken }
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to update changelog: ${error.response?.data?.message || error.message}`);
    }
  }
}

export default GitLabService;