const Fastify = require("fastify");
const { GITLAB_SECRET } = require("./config");
const { handleChangelogUpdate } = require("./handlers");

const fastify = Fastify({ logger: true });

fastify.addHook("preHandler", async (request, reply) => {
  const signature = request.headers["x-gitlab-token"];
  if (!signature || signature !== GITLAB_SECRET) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

fastify.post("/changelog", async (request, reply) => {
  const payload = request.body;

  if (payload.event_type !== "note") {
    return reply.send({ success: false, message: "Not a comment event" });
  }

  if (payload.object_attributes.noteable_type !== "MergeRequest") {
    return reply.send({ success: false, message: "Comment is not on a merge request" });
  }

  if (!payload.object_attributes.note.includes("!changelog")) {
    return reply.send({ success: false, message: "Comment does not contain !changelog" });
  }

  await handleChangelogUpdate(payload);
  postCommentReply(mergeRequest.iid, "Updating of changelog was successful ✅", payload.object_attributes.discussion_id);

  reply.send({ success: true });
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Fastify server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();