import axios from "axios";
import { GITLAB_API_URL, GITLAB_ACCESS_TOKEN, GITLAB_PROJECT_ID, CHANGELOG_LOCATION } from "./config.js";

async function getMergeRequestChanges(mriid, projectId) {
  try {
    const response = await axios.get(
      `${GITLAB_API_URL}/projects/${projectId}/merge_requests/${mriid}/diffs`,
      {
        headers: { "PRIVATE-TOKEN": GITLAB_ACCESS_TOKEN },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching merge request changes:", error.response?.data || error.message);
    return null;
  }
}

async function postCommentReply(mriid, comment, discussion_id, projectId) {
  try {
    await axios.post(
      `${GITLAB_API_URL}/projects/${projectId}/merge_requests/${mriid}/discussions/${discussion_id}/notes`,
      { body: comment },
      {
        headers: { "PRIVATE-TOKEN": GITLAB_ACCESS_TOKEN },
      }
    );

  } catch (error) {
    console.error("Error posting comment reply:", error.response?.data || error.message);
  }
}

async function postComment(mriid, comment, projectId) {
  try {
    await axios.post(
      `${GITLAB_API_URL}/projects/${projectId}/merge_requests/${mriid}/notes`,
      { body: comment },
      {
        headers: { "PRIVATE-TOKEN": GITLAB_ACCESS_TOKEN },
      }
    );

  } catch (error) {
    console.error("Error posting comment:", error.response?.data || error.message);
  }
}

async function suggestEditChangelog(branch, changelog, projectId) {
  try {
    const filePath = encodeURIComponent(CHANGELOG_LOCATION);
    let content;
    
    try {
      const response = await axios.get(
        `${GITLAB_API_URL}/projects/${projectId}/repository/files/${filePath}/raw`,
        {
          headers: { "PRIVATE-TOKEN": GITLAB_ACCESS_TOKEN },
          params: { ref: 'main' }
        }
      );
      content = response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("Changelog file not found, creating a new one.");
        content = "# Changelog\n\n[Unreleased]\n";
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
    
    const commitMessage = "chore: update changelog";
    
    await axios.post(
      `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/repository/commits`,
      {
        branch: branch,
        commit_message: commitMessage,
        actions: [
          {
            action: "update",
            file_path: CHANGELOG_LOCATION,
            content: updatedContent
          }
        ]
      },
      {
        headers: { "PRIVATE-TOKEN": GITLAB_ACCESS_TOKEN }
      }
    );

    return true;
  } catch (error) {
    console.error("Error suggesting changelog edit:", error.response?.data || error.message);
    return false;
  }
}

export { getMergeRequestChanges, postCommentReply, suggestEditChangelog, postComment };