const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'simulation-bootstrap.js'), 'utf8');

function harness() {
  const handlers = {}, status = { hidden: true, style: {}, textContent: '' };
  let timeout;
  const context = {
    window: { addEventListener(type, cb) { handlers[type] = cb; } },
    document: { getElementById() { return status; } },
    setTimeout(cb) { timeout = cb; },
  };
  vm.runInNewContext(source, context);
  return { handlers, status, tick() { timeout(); } };
}

test('reports module bootstrap failure and stalled startup', () => {
  const a = harness();
  a.handlers.error({ target: { type: 'module' } });
  assert.equal(a.status.hidden, false);
  assert.match(a.status.textContent, /Firebase scripts/);
  const b = harness();
  b.tick();
  assert.match(b.status.textContent, /did not start/);
});

test('reports pending auth and clears message when auth resolves', () => {
  const h = harness();
  h.handlers['remas-simulation-initialized']();
  h.tick();
  assert.match(h.status.textContent, /authentication/i);
  h.handlers['remas-simulation-auth-resolved']();
  assert.equal(h.status.hidden, true);
});

test('successful startup and auth do not show warning', () => {
  const h = harness();
  h.handlers['remas-simulation-auth-resolved']();
  h.handlers['remas-simulation-initialized']();
  h.tick();
  assert.equal(h.status.hidden, true);
});