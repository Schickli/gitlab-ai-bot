import { JIRA_FORMAT } from "./config.js";
import { getMergeRequestChanges, postCommentReply, suggestEditChangelog, postComment } from "./gitlabService.js";
import { promptChangelog } from "./openAi.js";

async function handleChangelogUpdate(payload) {
  const mergeRequest = payload.merge_request;
  const projectId = payload.project.id;

  if (!mergeRequest) {
    postCommentReply(mergeRequest.iid, "There are no changes to create a changelog on ❌", payload.object_attributes.discussion_id, projectId);
    return;
  }

  const ticketNumber = getTicketNumberFromMR(mergeRequest.description);

  const diff = await getMergeRequestChanges(mergeRequest.iid, projectId)

  if (changelogAlreadyExists(diff)) {
    postCommentReply(mergeRequest.iid, "Changelog already exists in this MR ✅", payload.object_attributes.discussion_id, projectId);
    return;
  }

  let codeDiffString = createDiffString(diff);

  // TODO: get Jira ticket description for better prompt

  const response = await promptChangelog(codeDiffString)
  if (response.error) {
    postCommentReply(mergeRequest.iid, "Error generating changelog ❌", payload.object_attributes.discussion_id, projectId);
    return;
  }

  let changelog = response.text;
  if(ticketNumber !== "") {
    changelog = changelog + " (" + ticketNumber + ")";
  }

  const result = await suggestEditChangelog(mergeRequest.source_branch, changelog);
  if (!result) {
    postCommentReply(mergeRequest.iid, "Error suggesting changelog edit ❌", payload.object_attributes.discussion_id, projectId);
    return;
  }
}

function getTicketNumberFromMR(desc) {
  const jiraTicketMatch = desc.match(JIRA_FORMAT);
  if (!jiraTicketMatch) {
    console.info("No JIRA ticket found in description");
    return "";
  }

  return jiraTicketMatch[0];
}

function changelogAlreadyExists(diff) {
  const changelogChanges = diff.find(change =>
    change.new_path.toLowerCase().includes('changelog.md')
  );

  if (changelogChanges) {
    return true;
  }

  return false;
}

function createDiffString(diff) {
  let codeDiff = diff.filter(change =>
    !change.new_path.toLowerCase().includes('changelog.md') &&
    !change.new_path.toLowerCase().includes('docs')
  );


  // TODO: Find a way to handle (too) large diffs

  const diffString = codeDiff.map(change => {
    return `File: ${change.new_path}\n${change.diff}`;
  }).join("\n");

  return diffString;
}


async function handleChangelogReminder(mergeRequest) {
  const diff = await getMergeRequestChanges(mergeRequest.iid, projectId)

  if (changelogAlreadyExists(diff)) {
    return;
  }

  await postComment(
    mergeRequest.iid,
    "You are missing a changelog! 🚀 Remember to add it manually or use `!changelog` in a comment to automatically update the changelog with AI!",
    projectId
  );
}

export { handleChangelogUpdate, handleChangelogReminder };