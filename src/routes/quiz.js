import QuizHandler from '../handlers/quiz.js';

async function quizRoutes(fastify, options) {
  const quizHandler = new QuizHandler();

  fastify.post('/quiz', async (request, reply) => {
    const payload = request.body;
    const projectId = payload.project.id;

    try {
      if (payload.event_type === 'note') {
        return await handleNoteEvent(payload, quizHandler, reply);
      }

      if (payload.event_type === 'merge_request') {
        return await handleMergeRequestEvent(payload, quizHandler, reply, projectId);
      }

      return reply.send({ 
        success: false, 
        message: 'Unsupported event type' 
      });
    } catch (error) {
      request.log.error('Error handling quiz webhook:', error);
      throw error;
    }
  });
}

async function handleNoteEvent(payload, quizHandler, reply) {
  if (payload.object_attributes.noteable_type !== 'MergeRequest') {
    return reply.send({ 
      success: false, 
      message: 'Comment is not on a merge request' 
    });
  }

  const comment = payload.object_attributes.note.toLowerCase();
  
  if (comment.includes('!quiz') && !comment.includes('🧠')) {
    await quizHandler.handleQuizGeneration(payload);
    return reply.send({ 
      success: true, 
      message: 'Quiz generated successfully' 
    });
  }

  if (['a', 'b', 'c'].some(letter => comment.trim() === letter)) {
    await quizHandler.handleQuizAnswer(payload);
    return reply.send({ 
      success: true, 
      message: 'Quiz answer processed' 
    });
  }

  return reply.send({ success: false });
}

async function handleMergeRequestEvent(payload, quizHandler, reply, projectId) {
  const { object_attributes: mr } = payload;

  if (mr.state !== 'opened' || mr.draft) {
    return reply.send({ 
      success: false, 
      message: 'MR is not open or still in draft' 
    });
  }

  await quizHandler.handleQuizReminder(mr, projectId);

  return reply.send({ 
    success: true, 
    message: 'Quiz reminder posted' 
  });
}

export default quizRoutes;