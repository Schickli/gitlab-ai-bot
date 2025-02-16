const { getMergeRequestChanges, postCommentReply, suggestEditChangelog } = require("./gitlabService");
const { promptChangelog } = require("./openAi");

async function handleChangelogUpdate(payload) {
  const mergeRequest = payload.merge_request;
  if (!mergeRequest) {
    postCommentReply(mergeRequest.iid, "There are no changes to create a changelog on ❌", payload.object_attributes.discussion_id);
    return;
  }

  const ticketNumber = getTicketNumberFromMR(mergeRequest.description);

  const diff = await getMergeRequestChanges(mergeRequest.iid)

  if (changelogAlreadExists(diff)) {
    postCommentReply(mergeRequest.iid, "Changelog already exists in this MR ✅", payload.object_attributes.discussion_id);
    return;
  }

  let codeDiffString = createDiffString(diff);

  // TODO: get Jira ticket description for better prompt

  const response = await promptChangelog(codeDiffString)
  if (response.error) {
    postCommentReply(mergeRequest.iid, "Error generating changelog ❌", payload.object_attributes.discussion_id);
    return;
  }

  const changelog = response.text + " (" + ticketNumber + ")";

  const result = await suggestEditChangelog(mergeRequest.source_branch, changelog);
  if (!result) {
    postCommentReply(mergeRequest.iid, "Error suggesting changelog edit ❌", payload.object_attributes.discussion_id);
    return;
  }
}

function getTicketNumberFromMR(desc) {
  const jiraTicketMatch = desc.match(/PBUZIOT-\d{5}/);
  if (!jiraTicketMatch) {
    console.info("No JIRA ticket found in description");
    return "";
  }

  return jiraTicketMatch[0];
}

function changelogAlreadExists(diff) {
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

module.exports = { handleChangelogUpdate };