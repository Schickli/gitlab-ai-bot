import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod/v4';
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

    this.quizPrompt = `
    Based on these code changes from a pull request, generate quiz questions that are strictly relevant and insightful. 
    Only generate questions if the changes are significant; minor or trivial changes should not produce any quiz. 
    Additionally, ensure each question focuses on a different and unique part of the code without overlapping sections.

    Focus on these aspects:
    - Understanding the core functionality and logic
    - Identifying potential issues or edge cases
    - Evaluating best practices and architectural decisions

    For each question, include:
    - A clear quiz question referencing the specific file and line range it pertains to.
    - Exactly 3 distinct multiple-choice options (a, b, c) with one correct answer.

    Format the questions in Gitlab-flavoured Markdown and ensure they are challenging for a senior developer.

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
        model: this.openai('gpt-4.1'),
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