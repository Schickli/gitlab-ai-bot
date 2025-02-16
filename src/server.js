const Fastify = require("fastify");
const { GITLAB_SECRET } = require("./config");
const { handleChangelogUpdate, handleChangelogReminder } = require("./handlers");
const { postCommentReply } = require("./gitlabService");

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

  if (!payload.object_attributes.note.includes("!changelog") || payload.object_attributes.note.includes("🚀")) {
    return reply.send({ success: false });
  }

  await handleChangelogUpdate(payload);
  postCommentReply(payload.merge_request.iid, "Updating of changelog was successful ✅", payload.object_attributes.discussion_id);

  reply.send({ success: true });
});

fastify.post("/changelog-reminder", async (request, reply) => {
  const payload = request.body;

  if (payload.event_type !== "merge_request") {
    return reply.send({ success: false, message: "Not a merge request event" });
  }

  const { object_attributes: mr } = payload;

  if (mr.state !== "opened" || mr.draft) {
    return reply.send({ success: false, message: "MR is not open or still in draft" });
  }

  await handleChangelogReminder(mr);

  reply.send({ success: true, message: "Changelog reminder posted" });
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