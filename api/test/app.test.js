"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {once} = require("node:events");
const {createServer} = require("../app");

async function fixture(t, query = async () => ({rows: []})) {
  const calls = [];
  const server = createServer({query: async (...args) => { calls.push(args); return query(...args); }}, () => {});
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return {base: `http://127.0.0.1:${server.address().port}`, calls};
}

test("health succeeds without querying the database", async t => {
  const {base, calls} = await fixture(t, async () => { throw new Error("offline"); });
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {status: "ok"});
  assert.equal(calls.length, 0);
});
test("readiness checks the items table", async t => {
  const {base, calls} = await fixture(t);
  const res = await fetch(`${base}/ready`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).database, "reachable");
  assert.match(calls[0][0], /FROM items/);
});
test("database failure returns a safe 503", async t => {
  const {base} = await fixture(t, async () => { throw new Error("password=SECRET"); });
  const res = await fetch(`${base}/ready`);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), {error: "Database unavailable"});
});
test("GET items returns database rows", async t => {
  const rows = [{id: 1, name: "apple", created_at: "2026-09-26T00:00:00.000Z"}];
  const {base} = await fixture(t, async () => ({rows}));
  const res = await fetch(`${base}/items`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), rows);
});
test("POST inserts the name as a SQL parameter and returns 201", async t => {
  const name = "'); DROP TABLE items; --";
  const {base, calls} = await fixture(t, async (_, values) => ({rows: [{id: 4, name: values[0]}]}));
  const res = await fetch(`${base}/items`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name})});
  assert.equal(res.status, 201);
  assert.equal((await res.json()).name, name);
  assert.ok(calls[0][0].includes("$1"));
  assert.ok(!calls[0][0].includes(name));
  assert.deepEqual(calls[0][1], [name]);
});
test("POST rejects blank or oversized names", async t => {
  const {base, calls} = await fixture(t);
  for (const name of [" ", "a".repeat(101)]) {
    const res = await fetch(`${base}/items`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name})});
    assert.equal(res.status, 400);
    await res.text();
  }
  assert.equal(calls.length, 0);
});
test("POST rejects invalid JSON", async t => {
  const {base} = await fixture(t);
  const res = await fetch(`${base}/items`, {method: "POST", headers: {"Content-Type": "application/json"}, body: "{broken"});
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "Invalid JSON");
});
test("POST requires JSON content type", async t => {
  const {base} = await fixture(t);
  const res = await fetch(`${base}/items`, {method: "POST", body: "hello"});
  assert.equal(res.status, 415);
  await res.text();
});
test("POST rejects oversized request bodies", async t => {
  const {base} = await fixture(t);
  const res = await fetch(`${base}/items`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: "a".repeat(20000)})});
  assert.equal(res.status, 413);
  await res.text();
});
test("unknown routes return 404", async t => {
  const {base} = await fixture(t);
  const res = await fetch(`${base}/missing`);
  assert.equal(res.status, 404);
  await res.text();
});
