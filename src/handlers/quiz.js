import GitLabService from '../services/gitlab.js';
import OpenAIService from '../services/openai.js';

class QuizHandler {
  constructor() {
    this.gitlabService = new GitLabService();
    this.openaiService = new OpenAIService();
    this.activeQuizzes = new Map();
  }

  async handleQuizGeneration(payload) {
    const mergeRequest = payload.merge_request;
    const projectId = payload.project.id;

    if (!mergeRequest) {
      await this.gitlabService.postCommentReply(
        mergeRequest.iid, 
        'There are no changes to create a quiz on ❌', 
        payload.object_attributes.discussion_id, 
        projectId
      );
      return;
    }

    try {
      const diff = await this.gitlabService.getMergeRequestChanges(mergeRequest.iid, projectId);
      const codeDiffString = this._createDiffString(diff);
      
      const quizQuestions = await this.openaiService.generateQuiz(codeDiffString);
      
      this.activeQuizzes.set(`${projectId}-${mergeRequest.iid}`, {
        questions: quizQuestions,
        currentQuestion: 0,
        score: 0
      });

      await this._postQuizQuestion(mergeRequest.iid, projectId, quizQuestions[0], 1, payload.object_attributes.discussion_id);
      
    } catch (error) {
      await this.gitlabService.postCommentReply(
        mergeRequest.iid, 
        'Error generating quiz ❌', 
        payload.object_attributes.discussion_id, 
        projectId
      );
      throw error;
    }
  }

  async handleQuizAnswer(payload) {
    const mergeRequest = payload.merge_request;
    const projectId = payload.project.id;
    const comment = payload.object_attributes.note.trim().toLowerCase();
    
    const quizKey = `${projectId}-${mergeRequest.iid}`;
    const quiz = this.activeQuizzes.get(quizKey);
    
    if (!quiz) {
      return;
    }

    const currentQuestion = quiz.questions[quiz.currentQuestion];
    const userAnswer = comment.replace(/[^abc]/g, '');
    
    if (!['a', 'b', 'c'].includes(userAnswer)) {
      await this.gitlabService.postCommentReply(
        mergeRequest.iid,
        'Please answer with a, b, or c',
        payload.object_attributes.discussion_id,
        projectId
      );
      return;
    }

    const isCorrect = userAnswer === currentQuestion.correctAnswer.toLowerCase();
    
    if (isCorrect) {
      quiz.score++;
    }

    quiz.currentQuestion++;
    
    let responseMessage = isCorrect ? 
      `✅ Correct! The answer is ${currentQuestion.correctAnswer.toUpperCase()}` : 
      `❌ Wrong! The correct answer is ${currentQuestion.correctAnswer.toUpperCase()}`;

    if (quiz.currentQuestion < quiz.questions.length) {
      responseMessage += `\n\nScore: ${quiz.score}/${quiz.currentQuestion}`;
      await this.gitlabService.postCommentReply(
        mergeRequest.iid,
        responseMessage,
        payload.object_attributes.discussion_id,
        projectId
      );
      
      await this._postQuizQuestion(
        mergeRequest.iid, 
        projectId, 
        quiz.questions[quiz.currentQuestion], 
        quiz.currentQuestion + 1
      );
    } else {
      responseMessage += `\n\n🎉 Quiz completed! Final score: ${quiz.score}/${quiz.questions.length}`;
      await this.gitlabService.postCommentReply(
        mergeRequest.iid,
        responseMessage,
        payload.object_attributes.discussion_id,
        projectId
      );
      
      this.activeQuizzes.delete(quizKey);
    }
  }

  async handleQuizReminder(mergeRequest, projectId) {
    try {
      await this.gitlabService.postComment(
        mergeRequest.iid,
        'Want to test your knowledge of this code? 🧠 Use `!quiz` in a comment to generate quiz questions based on your changes!',
        projectId
      );
    } catch (error) {
      console.error('Error handling quiz reminder:', error);
      throw error;
    }
  }

  async _postQuizQuestion(mergeRequestIid, projectId, question, questionNumber, discussionId = null) {
    const questionText = `**Question ${questionNumber}:**\n${question.question}\n\na) ${question.answers.a}\nb) ${question.answers.b}\nc) ${question.answers.c}\n\nReply with a, b, or c`;
    
    if (question.gitInfo && question.gitInfo.file) {
      await this.gitlabService.postCommentOnLine(
        mergeRequestIid,
        questionText,
        projectId,
        question.gitInfo.file,
        question.gitInfo.lineStart
      );
    } else if (discussionId) {
      await this.gitlabService.postCommentReply(
        mergeRequestIid,
        questionText,
        discussionId,
        projectId
      );
    } else {
      await this.gitlabService.postComment(
        mergeRequestIid,
        questionText,
        projectId
      );
    }
  }

  _createDiffString(diff) {
    const codeDiff = diff.filter(change =>
      !change.new_path.toLowerCase().includes('changelog.md') &&
      !change.new_path.toLowerCase().includes('docs')
    );

    const diffString = codeDiff.map(change => {
      return `File: ${change.new_path}\n${change.diff}`;
    }).join('\n');

    return diffString;
  }
}

export default QuizHandler;