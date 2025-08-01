export const GITLAB_SECRET = process.env.GITLAB_SECRET; // Whatever you set in the GitLab webhook settings
export const GITLAB_API_URL = process.env.GITLAB_API_URL; // e.g., "https://gitlab.com/api/v4"
export const GITLAB_ACCESS_TOKEN = process.env.GITLAB_ACCESS_TOKEN; // Your GitLab personal/bot access token with API scope
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Your OpenAI API key from https://platform.openai.com/account/api-keys
export const CHANGELOG_LOCATION = "docs/changelog.md"; // Path to your changelog file in the repository
export const JIRA_FORMAT = "/PBUZIOT-\d{5}/"; // Example: PBUZIOT-12345