const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const createApp = require('../app');
const User = require('../models/User');
const emailService = require('../utils/emailService');

function requestJson(server, method, path, { body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
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
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

test('register creates unverified account and sends verification email', async () => {
  const originalFindOne = User.findOne;
  const originalSave = User.prototype.save;
  const originalSendVerificationEmail = emailService.sendVerificationEmail;

  let savedUser = null;
  let sentEmailPayload = null;

  User.findOne = async () => null;
  User.prototype.save = async function save() {
    savedUser = this;
    return this;
  };
  emailService.sendVerificationEmail = async (payload) => {
    sentEmailPayload = payload;
    return { status: 200, text: 'OK' };
  };

  const app = createApp();
  const server = app.listen(0);

  try {
    const response = await requestJson(server, 'POST', '/api/auth/register', {
      body: {
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret123'
      }
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.requiresEmailVerification, true);
    assert.equal(savedUser.isEmailVerified, false);
    assert.equal(typeof savedUser.emailVerificationToken, 'string');
    assert.equal(savedUser.emailVerificationToken.length > 20, true);
    assert.equal(savedUser.emailVerificationExpires instanceof Date, true);
    assert.equal(sentEmailPayload.toEmail, 'alice@example.com');
    assert.equal(sentEmailPayload.username, 'alice');
    assert.equal(sentEmailPayload.verificationLink.startsWith('http://localhost:3000/verify-email?token='), true);
  } finally {
    User.findOne = originalFindOne;
    User.prototype.save = originalSave;
    emailService.sendVerificationEmail = originalSendVerificationEmail;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('login rejects users with unverified emails', async () => {
  const originalFindOne = User.findOne;

  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439011',
    username: 'alice',
    email: 'alice@example.com',
    role: 'user',
    isEmailVerified: false,
    comparePassword: async () => true
  });

  const app = createApp();
  const server = app.listen(0);

  try {
    const response = await requestJson(server, 'POST', '/api/auth/login', {
      body: {
        email: 'alice@example.com',
        password: 'secret123'
      }
    });

    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Please verify your email before logging in.');
  } finally {
    User.findOne = originalFindOne;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('login allows users without explicit verification flag (legacy accounts)', async () => {
  const originalFindOne = User.findOne;

  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439022',
    username: 'legacy',
    email: 'legacy@example.com',
    role: 'user',
    comparePassword: async () => true
  });

  const app = createApp();
  const server = app.listen(0);

  try {
    const response = await requestJson(server, 'POST', '/api/auth/login', {
      body: {
        email: 'legacy@example.com',
        password: 'secret123'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.token, 'string');
    assert.equal(response.body.user.username, 'legacy');
  } finally {
    User.findOne = originalFindOne;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('verify-email marks account as verified', async () => {
  const originalFindOne = User.findOne;

  const expiresAt = new Date(Date.now() + 10000);
  const mockUser = {
    isEmailVerified: false,
    emailVerificationToken: 'hashed-token',
    emailVerificationExpires: expiresAt,
    save: async function save() {
      return this;
    }
  };

  User.findOne = async () => mockUser;

  const app = createApp();
  const server = app.listen(0);

  try {
    const response = await requestJson(server, 'GET', '/api/auth/verify-email?token=plain-token');

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Email verified successfully. You can now log in.');
    assert.equal(mockUser.isEmailVerified, true);
    assert.equal(mockUser.emailVerificationToken, 'hashed-token');
    assert.equal(mockUser.emailVerificationExpires, expiresAt);
  } finally {
    User.findOne = originalFindOne;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('verify-email is idempotent for already-verified users', async () => {
  const originalFindOne = User.findOne;

  const mockUser = {
    isEmailVerified: true,
    emailVerificationToken: 'hashed-token',
    emailVerificationExpires: new Date(Date.now() - 1000),
    save: async function save() {
      return this;
    }
  };

  User.findOne = async () => mockUser;

  const app = createApp();
  const server = app.listen(0);

  try {
    const response = await requestJson(server, 'GET', '/api/auth/verify-email?token=plain-token');

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Email already verified. You can log in.');
  } finally {
    User.findOne = originalFindOne;
    await new Promise((resolve) => server.close(resolve));
  }
});
