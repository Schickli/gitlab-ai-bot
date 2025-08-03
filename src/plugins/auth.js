import fp from 'fastify-plugin';
import { config } from '../config/index.js';

async function authPlugin(fastify, options) {
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url === '/health') {
      return;
    }
    
    const signature = request.headers['x-gitlab-token'];

    if (!signature || signature !== config.gitlab.secret) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export default fp(authPlugin, {
  name: 'auth-plugin'
});