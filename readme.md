# Gitlab AI Changelog Bot

This Gitlab bot is designed to help you to never forget you changelog entry again by automatically creating a changelog entry for your merge request.

## How to use

Create a `.env` file with the environment variables specified in the `config.js`.
The `GITLAB_SECRET` is the secret token you have to set in your Gitlab webhook.

You have to create two webhooks in your Gitlab project.

### Changelog Reminder Webhook

While creating the Gitlab Webhook select "Merge Requests" as the trigger and set the URL to your deployed bot. It should look like this `https://your-bot-or-ngrok-url.com/changelog-reminder`.

This triggers a webhook that runs once when you create a new merge request thats not a draft. It will create a comment on the merge request with a reminder to add a changelog entry.
![reminder comment](assets/image.png)

### Changlog Creation Webhook

While creating the Gitlab Webhook select "Comments" as the trigger and set the URL to your deployed bot. It should look like this `https://your-bot-or-ngrok-url.com/changelog`.

This triggers a webhook that runs when a comment is created on a merge request. If the comment includes `!changelog` the bot will create a changelog entry for the merge request based on the changes you made. He will use GPT-4o-mini to generate the changelog entry. The bot will also try to parse out the issue number from the Merge Request description and add it at the end of the entry.

### Running the bot

If you are running the bot locally you can use `ngrok http 3000` to create a tunnel to your local machine. To start the application run `npm run start`.

## Todo

- [] Add more context with Jira Ticket information
- [] Test the bot with bigger Merge Requests
