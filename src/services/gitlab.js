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

  // https://docs.gitlab.com/api/discussions/#create-a-new-thread-in-the-merge-request-diff
  async postCommentOnLine(mrIid, comment, projectId, filePath, lineNumber, oldPath = null, oldLine = null) {
    try {
      // Get the latest merge request version to retrieve SHAs
      const versionsRes = await axios.get(
        `${this.apiUrl}/projects/${projectId}/merge_requests/${mrIid}/versions`,
        {
          headers: { 'PRIVATE-TOKEN': this.accessToken },
        }
      );
      const latestVersion = versionsRes.data[0];
      if (!latestVersion) throw new Error('Could not fetch MR versions');

      const position = {
        position_type: 'text',
        base_sha: latestVersion.base_commit_sha,
        head_sha: latestVersion.head_commit_sha,
        start_sha: latestVersion.start_commit_sha,
        new_path: filePath,
        old_path: oldPath || filePath,
      };

      // Added line (green): only new_line
      if (lineNumber && !oldLine) {
        position.new_line = lineNumber;
      }

      // Removed line (red): only old_line
      else if (!lineNumber && oldLine) {
        position.old_line = oldLine;
      }

      // Unchanged line: both new_line and old_line
      else if (lineNumber && oldLine) {
        position.new_line = lineNumber;
        position.old_line = oldLine;
      }

      await axios.post(
        `${this.apiUrl}/projects/${projectId}/merge_requests/${mrIid}/discussions`,
        {
          body: comment,
          position,
        },
        {
          headers: { 'PRIVATE-TOKEN': this.accessToken },
        }
      );
    } catch (error) {
      console.warn(`Failed to post comment on line, falling back to regular comment: ${error.message}`);
      await this.postComment(mrIid, comment, projectId);
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