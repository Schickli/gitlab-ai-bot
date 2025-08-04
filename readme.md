# GitLab AI Bot

This GitLab bot is designed to help you never forget your changelog entry again by automatically creating a changelog entry for your merge request.

## How to Use

Create a `.env` file with the environment variables specified in `src/config/index.js`. The required environment variables are:

- `GITLAB_SECRET` - The secret token you have to set in your GitLab webhook
- `GITLAB_API_URL` - Your GitLab API URL
- `GITLAB_ACCESS_TOKEN` - Your GitLab access token
- `OPENAI_API_KEY` - Your OpenAI API key
- `PORT` - Server port (optional, defaults to 3000)
- `HOST` - Server host (optional, defaults to 0.0.0.0)
- `CHANGELOG_LOCATION` - Changelog file location (optional, defaults to docs/changelog.md)

You need to create two webhooks in your GitLab project, pointing to the endpoints `/changelog` and `/quiz`.

### Changelog Configuration

The webhook should use the URL: `https://your-bot-or-ngrok-url.com/changelog`

1. **Changelog Reminder**: Select "Merge Requests" as the trigger. This runs when you create a new merge request that's not a draft and posts a reminder comment to add a changelog entry.
   ![reminder comment](assets/image.png)

2. **Changelog Creation**: Select "Comments" as the trigger. This runs when a comment containing `!changelog` is created on a merge request. The bot will generate a changelog entry using AI based on the changes made and attempt to parse the issue number from the merge request description.

### Quiz Configuration

The webhook should use the URL: `https://your-bot-or-ngrok-url.com/quiz`

1. **Quiz Prompt**: Select "Merge Requests" and "Comments" as the trigger. When you open a merge request, a comment with the prompt to use `!quiz` appears.
2. **Questions**: After typing `!quiz`, we generate a few multiple-choice questions about the code. The comments will be next to the code and can be answered with a, b, or c. This triggers another event and we check your answer and give you feedback.

### Running the Bot

If you are running the bot locally, you can use `ngrok http 3000` or `bun expose` to create a tunnel to your local machine. To start the application, run `bun start`.

## Todo

- [ ] Add more context with Jira Ticket information
- [ ] Instead of creating a commit for the changelog entry, create a comment on the merge request with a suggested changelog entry
- [x] Add support for quiz questions
  - [x] Add support for quoting code directly in the question
  - [x] Add all questions immediately instead of one by one
  - [ ] Improve storing of questions (currently only in memory, should be stored in a database for persistence)
- [ ] Test the bot with more complex merge requests (real code repositories, not just the example repository)
