"use strict";
const http = require("node:http");
const os = require("node:os");

function reply(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Served-By": os.hostname(),
  });
  res.end(JSON.stringify(body) + "\n");
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > 16 * 1024) {
        if (!tooLarge) reject(Object.assign(new Error("Request body too large"), {status: 413}));
        tooLarge = true;
        return; // Keep consuming, but never retain an oversized body.
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(Object.assign(new Error("Invalid JSON"), {status: 400})); }
    });
    req.on("error", reject);
  });
}

// Accepting the pool as an argument lets tests check HTTP behavior without a database.
function createServer(pool, log = console.log) {
  const server = http.createServer(async (req, res) => {
    const started = Date.now();
    const path = (req.url || "/").split("?")[0];
    res.on("finish", () => log(JSON.stringify({
      event: "request", method: req.method, path,
      status: res.statusCode, duration_ms: Date.now() - started,
      instance: os.hostname(),
    })));
    try {
      if (req.method === "GET" && path === "/health") {
        return reply(res, 200, {status: "ok"}); // Process health: independent of PostgreSQL.
      }
      if (req.method === "GET" && path === "/ready") {
        await pool.query("SELECT id FROM items LIMIT 1");
        return reply(res, 200, {status: "ready", database: "reachable"});
      }
      if (req.method === "GET" && path === "/items") {
        const result = await pool.query("SELECT id, name, created_at FROM items ORDER BY id LIMIT 1000");
        return reply(res, 200, result.rows);
      }
      if (req.method === "POST" && path === "/items") {
        const contentType = (req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        if (contentType !== "application/json") {
          return reply(res, 415, {error: "Use Content-Type: application/json"});
        }
        const body = await readJson(req);
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        if (!name || [...name].length > 100) {
          return reply(res, 400, {error: "name must contain 1 to 100 characters"});
        }
        // Keep user input out of SQL text. $1 is bound separately by node-postgres.
        const result = await pool.query(
          "INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at", [name]
        );
        return reply(res, 201, result.rows[0]);
      }
      return reply(res, 404, {error: "Not found", routes: ["GET /health", "GET /ready", "GET /items", "POST /items"]});
    } catch (error) {
      const status = error.status || 503;
      log(JSON.stringify({event: "request_error", path, code: error.code || "REQUEST_ERROR"}));
      return reply(res, status, {error: error.status ? error.message : "Database unavailable"});
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (require.main === module) {
  for (const key of ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASS"]) {
    if (!process.env[key]) throw new Error(`Missing required configuration: ${key}`);
  }
  const {Pool} = require("pg");
  const pool = new Pool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS,
    max: 5, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000,
    statement_timeout: 3000, query_timeout: 4000,
  });
  pool.on("error", error => console.error(JSON.stringify({event: "pool_error", code: error.code || "DB_ERROR"})));
  const server = createServer(pool);
  const port = Number(process.env.PORT || 3000);
  server.listen(port, "0.0.0.0", () => console.log(JSON.stringify({event: "listening", port, instance: os.hostname()})));
  function shutdown() {
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => {
      try { await pool.end(); clearTimeout(deadline); process.exit(0); }
      catch { process.exit(1); }
    });
  }
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
module.exports = {createServer};
