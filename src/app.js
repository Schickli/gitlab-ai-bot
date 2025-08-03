import Fastify from 'fastify';
import { config, validateConfig } from './config/index.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/errorHandler.js';
import changelogRoutes from './routes/changelog.js';

export function createApp(options = {}) {
  validateConfig();
  
  const fastify = Fastify({
    logger: true,
    ...options
  });

  fastify.register(errorHandlerPlugin);
  fastify.register(authPlugin);
  fastify.register(changelogRoutes);

  return fastify;
}

export { config };