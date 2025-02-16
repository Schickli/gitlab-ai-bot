# Gitlab AI Changelog Bot

This Gitlab bot is designed to help you to never forget you changelog entry again by automatically creating a changelog entry for your merge request.

## How to use

Create a `.env` file with the environment variables specified in the `config.js`.
The `GITLAB_SECRET` is the secret token you have to set in your Gitlab webhook.
While creating the Gitlab Webhook select "Comments" as the trigger and set the URL to your deployed bot. It should look like this `https://your-bot-or-ngrok-url.com/changelog`.
If you are running the bot locally you can use `ngrok http 3000` to create a tunnel to your local machine. To start the application run `npm run start`.
