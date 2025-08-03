import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from '../config/index.js';

class OpenAIService {
  constructor() {
    this.openai = createOpenAI({
      apiKey: config.openai.apiKey,
    });
    
    this.prompt = `Please create a changelog entry based on these changes from the pullrequest. 
    Use one of the prefixes: (whichever suits you best) (ALWAYS USE ONE OF THESE PREFIXES AND INCLUDE THE - and **):
    - **Added**: Changelog entry here.
    - **Fixed**: Changelog entry here.
    - **Changed**: Changelog entry here.


    Do not write too long changelogs. Keep them so short that they fit on one line if possible. Keep at a high level and DO NOT mention specific features or code. Just analyse the architecture and system changes. Reply with the changelog entry and nothing else!

    These are the changes: `;
  }

  async generateChangelog(codeDiff) {
    try {
      const { text } = await generateText({
        model: this.openai('gpt-4o-mini-2024-07-18'),
        prompt: this.prompt + codeDiff,
      });

      return text;
    } catch (error) {
      throw new Error(`Failed to generate changelog: ${error.message}`);
    }
  }
}

export default OpenAIService;