import Fastify from "fastify";
import { GITLAB_SECRET } from "./config.js";
import { handleChangelogUpdate, handleChangelogReminder } from "./handlers.js";
import { postCommentReply } from "./gitlabService.js";

const fastify = Fastify({ logger: true });

fastify.addHook("preHandler", async (request, reply) => {
  const signature = request.headers["x-gitlab-token"];

  if (!signature || signature !== GITLAB_SECRET) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

fastify.post("/webhook", async (request, reply) => {
  const payload = request.body;
  const projectId = payload.project.id;

  // Handle comment events (changelog creation)
  if (payload.event_type === "note") {
    if (payload.object_attributes.noteable_type !== "MergeRequest") {
      return reply.send({ success: false, message: "Comment is not on a merge request" });
    }

    if (!payload.object_attributes.note.includes("!changelog") || payload.object_attributes.note.includes("🚀")) {
      return reply.send({ success: false });
    }

    await handleChangelogUpdate(payload);
    postCommentReply(payload.merge_request.iid, "Updating of changelog was successful ✅", payload.object_attributes.discussion_id, projectId);

    return reply.send({ success: true, message: "Changelog updated successfully" });
  }

  // Handle merge request events (changelog reminders)
  if (payload.event_type === "merge_request") {
    const { object_attributes: mr } = payload;

    if (mr.state !== "opened" || mr.draft) {
      return reply.send({ success: false, message: "MR is not open or still in draft" });
    }

    await handleChangelogReminder(mr);

    return reply.send({ success: true, message: "Changelog reminder posted" });
  }

  // Handle unsupported event types
  return reply.send({ success: false, message: "Unsupported event type" });
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