import Fastify from "fastify";
import { randomUUID } from "node:crypto";

const app = Fastify({ logger: true });

// In-memory data so the demo runs without a database.
const users = new Map([
  ["alice-token", { id: "u_alice", name: "alice" }],
  ["bob-token", { id: "u_bob", name: "bob" }],
]);

const projects = new Map();
const tasks = new Map();

function seed() {
  const p = { id: "p_1", ownerId: "u_alice", name: "Website relaunch", archived: false };
  projects.set(p.id, p);
  tasks.set("t_1", { id: "t_1", projectId: p.id, title: "Draft landing copy", done: false });
}
seed();

async function authenticate(req, reply) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const user = token && users.get(token);
  if (!user) return reply.code(401).send({ error: "unauthorized" });
  req.user = user;
}

function loadOwnedProject(req, reply) {
  const project = projects.get(req.params.id);
  if (!project) {
    reply.code(404).send({ error: "not_found" });
    return null;
  }
  if (project.ownerId !== req.user.id) {
    reply.code(403).send({ error: "forbidden" });
    return null;
  }
  return project;
}

app.get("/health", async () => ({ ok: true }));

app.get("/projects", { preHandler: authenticate }, async (req) => {
  return [...projects.values()].filter((p) => p.ownerId === req.user.id);
});

app.post("/projects", { preHandler: authenticate }, async (req, reply) => {
  const name = req.body?.name?.trim();
  if (!name) return reply.code(400).send({ error: "name_required" });
  const project = { id: `p_${randomUUID().slice(0, 8)}`, ownerId: req.user.id, name, archived: false };
  projects.set(project.id, project);
  return reply.code(201).send(project);
});

app.get("/projects/:id", { preHandler: authenticate }, async (req, reply) => {
  const project = loadOwnedProject(req, reply);
  if (!project) return reply;
  return project;
});

app.patch("/projects/:id", { preHandler: authenticate }, async (req, reply) => {
  const project = loadOwnedProject(req, reply);
  if (!project) return reply;
  const { name, archived } = req.body ?? {};
  if (name !== undefined) project.name = String(name).trim();
  if (archived !== undefined) project.archived = Boolean(archived);
  return project;
});

app.delete("/projects/:id", async (req, reply) => {
  const project = projects.get(req.params.id);
  if (!project) return reply.code(404).send({ error: "not_found" });
  for (const task of tasks.values()) {
    if (task.projectId === project.id) tasks.delete(task.id);
  }
  projects.delete(project.id);
  return reply.code(204).send();
});

app.get("/projects/:id/tasks", { preHandler: authenticate }, async (req, reply) => {
  const project = loadOwnedProject(req, reply);
  if (!project) return reply;
  return [...tasks.values()].filter((t) => t.projectId === project.id);
});

app.post("/projects/:id/tasks", { preHandler: authenticate }, async (req, reply) => {
  const project = loadOwnedProject(req, reply);
  if (!project) return reply;
  const title = req.body?.title?.trim();
  if (!title) return reply.code(400).send({ error: "title_required" });
  const task = { id: `t_${randomUUID().slice(0, 8)}`, projectId: project.id, title, done: false };
  tasks.set(task.id, task);
  return reply.code(201).send(task);
});

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
