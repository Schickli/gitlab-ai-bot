const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

const { OPENAI_API_KEY } = require("./config");

const openai = createOpenAI({
    apiKey: OPENAI_API_KEY,
})

const prompt = 
    `Please create a changelog entry based on these changes from the pullrequest. 
    Use one of the prefixes: (whichever suits you best)
    - **Added**: Changelog entry here.
    - **Fixed**: Changelog entry here.
    - **Changed**: Changelog entry here.


    Do not write too long changelogs. Keep them so short that they fit on one line if possible. Keep at a high level and DO NOT mention specific features or code. Just analyse the architecture and system changes. Reply with the changelog entry and nothing else!

    These are the changes: `;

async function promptChangelog(codeDiff) {
    const { text } = await generateText({
        model: openai('gpt-4o-mini-2024-07-18'),
        prompt: prompt + codeDiff,
        onError({ error }) {
            console.error(error);
            return { text: null, error: true };
        },
    });

    return { text: text, error: false };
}

module.exports = { promptChangelog };