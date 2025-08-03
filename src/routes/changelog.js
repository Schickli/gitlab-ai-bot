import ChangelogHandler from '../handlers/changelog.js';

async function changelogRoutes(fastify, options) {
  const changelogHandler = new ChangelogHandler();

  fastify.post('/changelog', async (request, reply) => {
    const payload = request.body;
    const projectId = payload.project.id;

    try {
      if (payload.event_type === 'note') {
        return await handleNoteEvent(payload, changelogHandler, reply);
      }

      if (payload.event_type === 'merge_request') {
        return await handleMergeRequestEvent(payload, changelogHandler, reply, projectId);
      }

      return reply.send({ 
        success: false, 
        message: 'Unsupported event type' 
      });
    } catch (error) {
      request.log.error('Error handling webhook:', error);
      throw error;
    }
  });

  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

async function handleNoteEvent(payload, changelogHandler, reply) {
  if (payload.object_attributes.noteable_type !== 'MergeRequest') {
    return reply.send({ 
      success: false, 
      message: 'Comment is not on a merge request' 
    });
  }

  if (!payload.object_attributes.note.includes('!changelog') || 
      payload.object_attributes.note.includes('🚀')) {
    return reply.send({ success: false });
  }

  await changelogHandler.handleChangelogUpdate(payload);

  return reply.send({ 
    success: true, 
    message: 'Changelog updated successfully' 
  });
}

async function handleMergeRequestEvent(payload, changelogHandler, reply, projectId) {
  const { object_attributes: mr } = payload;

  if (mr.state !== 'opened' || mr.draft) {
    return reply.send({ 
      success: false, 
      message: 'MR is not open or still in draft' 
    });
  }

  await changelogHandler.handleChangelogReminder(mr, projectId);

  return reply.send({ 
    success: true, 
    message: 'Changelog reminder posted' 
  });
}

export default changelogRoutes;