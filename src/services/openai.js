import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
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

    this.quizPrompt = `Based on these code changes from a pull request, generate quiz questions to test understanding of the code. 
    Focus on:
    - Understanding what the code does
    - Logic and functionality
    - Potential issues or edge cases
    - Best practices

    For each question, identify the specific file and line range the question relates to.
    Generate 3-5 multiple choice questions with exactly 3 options (a, b, c).

    If the question is simple, leave it out. The questions should be challenging and require a good understanding of the code. 
    If the code is simple or short do not force a question.

    The questions should be in markdown format that follow the Gitlab flavour.
    IMPORTANT: The a) b) c) options should each be on a new line for better readability.
    
    These are the changes: `;

    this.quizSchema = z.object({
      questions: z.array(z.object({
        question: z.string().describe('The quiz question about the code'),
        answers: z.object({
          a: z.string().describe('Answer option A'),
          b: z.string().describe('Answer option B'),
          c: z.string().describe('Answer option C')
        }),
        correctAnswer: z.enum(['A', 'B', 'C']).describe('The correct answer (A, B, or C)'),
        gitInfo: z.object({
          file: z.string().describe('The file path this question relates to'),
          lineStart: z.number().describe('Starting line number'),
          lineEnd: z.number().optional().describe('Ending line number (optional)')
        })
      }))
    });
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

  async generateQuiz(codeDiff) {
    try {
      const { object } = await generateObject({
        model: this.openai('gpt-4o'),
        prompt: this.quizPrompt + codeDiff,
        schema: this.quizSchema,
      });

      return object.questions;
    } catch (error) {
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
}

export default OpenAIService;