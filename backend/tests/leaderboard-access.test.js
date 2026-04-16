const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const createApp = require('../app');
const Team = require('../models/Team');
const Submission = require('../models/Submission');

function requestJson(server, method, path, { token } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = {};
          if (data) {
            parsed = JSON.parse(data);
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('leaderboard is blocked for non-admin before challenge date', async () => {
  const originalDateNow = Date.now;
  Date.now = () => new Date('2026-04-01T00:00:00.000Z').getTime();

  const app = createApp();
  const server = app.listen(0);
  const token = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', username: 'player', role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'GET', '/api/leaderboard', { token });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Leaderboard will be visible on 08 May 2026 at 10:00 AM IST');
  } finally {
    Date.now = originalDateNow;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('leaderboard is available for admin before challenge date', async () => {
  const originalDateNow = Date.now;
  const originalTeamFind = Team.find;
  const originalSubmissionAggregate = Submission.aggregate;
  Date.now = () => new Date('2026-04-01T00:00:00.000Z').getTime();

  Team.find = () => ({
    populate() {
      return this;
    },
    select() {
      return Promise.resolve([]);
    }
  });
  Submission.aggregate = async () => [];

  const app = createApp();
  const server = app.listen(0);
  const token = jwt.sign(
    { userId: '507f1f77bcf86cd799439012', username: 'admin', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'GET', '/api/leaderboard', { token });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
  } finally {
    Team.find = originalTeamFind;
    Submission.aggregate = originalSubmissionAggregate;
    Date.now = originalDateNow;
    await new Promise((resolve) => server.close(resolve));
  }
});
