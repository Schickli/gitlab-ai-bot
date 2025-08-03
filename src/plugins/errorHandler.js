import fp from 'fastify-plugin';

async function errorHandlerPlugin(fastify, options) {
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    
    if (error.validation) {
      reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation
      });
      return;
    }
    
    if (error.statusCode) {
      reply.status(error.statusCode).send({
        error: error.message || 'An error occurred'
      });
      return;
    }
    
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: 'Route not found'
    });
  });
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler-plugin'
});