import { createApp, config } from './app.js';

const start = async () => {
  const fastify = createApp();
  
  try {
    await fastify.listen({ 
      port: config.app.port, 
      host: config.app.host 
    });
    console.log(`🚀 Fastify server running on http://${config.app.host}:${config.app.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();