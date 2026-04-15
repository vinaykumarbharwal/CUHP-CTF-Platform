const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const createApp = require('../app');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { ensureAdminUser } = require('../utils/adminBootstrap');

function requestJson(server, method, path, { token, body } = {}) {
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

test('non-admin cannot update challenge', async () => {
  const challengeId = new mongoose.Types.ObjectId().toString();
  const findByIdAndUpdateMock = async () => null;

  const originalFindByIdAndUpdate = Challenge.findByIdAndUpdate;
  Challenge.findByIdAndUpdate = findByIdAndUpdateMock;

  const app = createApp();
  const server = app.listen(0);

  const userToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), username: 'player', role: 'user' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'PUT', `/api/challenges/${challengeId}`, {
      token: userToken,
      body: { title: 'Updated title' }
    });

    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Admin access required');
  } finally {
    Challenge.findByIdAndUpdate = originalFindByIdAndUpdate;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can update challenge fields', async () => {
  const challengeId = new mongoose.Types.ObjectId().toString();
  const updatedChallengeDoc = {
    _id: challengeId,
    title: 'Updated title',
    description: 'Updated description',
    category: 'Web',
    difficulty: 'Hard',
    points: 350,
    image: 'https://example.com/new.png',
    flag: 'CUHP{updated_flag}'
  };

  const originalFindByIdAndUpdate = Challenge.findByIdAndUpdate;
  Challenge.findByIdAndUpdate = (id, update) => {
    assert.equal(String(id), challengeId);
    assert.deepEqual(update.$set, {
      title: 'Updated title',
      description: 'Updated description',
      category: 'Web',
      difficulty: 'Hard',
      points: 350,
      image: 'https://example.com/new.png',
      flag: 'CUHP{updated_flag}'
    });
    return {
      select: async () => updatedChallengeDoc
    };
  };

  const app = createApp();
  const server = app.listen(0);

  const adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), username: 'admin', role: 'admin' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'PUT', `/api/challenges/${challengeId}`, {
      token: adminToken,
      body: {
        title: 'Updated title',
        description: 'Updated description',
        category: 'Web',
        difficulty: 'Hard',
        points: 350,
        image: 'https://example.com/new.png',
        flag: 'CUHP{updated_flag}'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Challenge updated successfully');
    assert.equal(response.body.challenge.title, 'Updated title');
    assert.equal(response.body.challenge.points, 350);
  } finally {
    Challenge.findByIdAndUpdate = originalFindByIdAndUpdate;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can create challenge', async () => {
  const createdId = new mongoose.Types.ObjectId().toString();
  const originalCreate = Challenge.create;

  Challenge.create = async (payload) => ({
    _id: createdId,
    ...payload,
    toObject() {
      return { _id: createdId, ...payload };
    }
  });

  const app = createApp();
  const server = app.listen(0);

  const adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), username: 'admin', role: 'admin' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'POST', '/api/challenges', {
      token: adminToken,
      body: {
        title: 'New challenge',
        description: 'Challenge description',
        category: 'Web',
        difficulty: 'Easy',
        points: 100,
        image: 'https://example.com/challenge.png',
        flag: 'CUHP{new_flag}'
      }
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.message, 'Challenge created successfully');
    assert.equal(response.body.challenge.title, 'New challenge');
    assert.equal(response.body.challenge.flag, undefined);
  } finally {
    Challenge.create = originalCreate;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can access challenges before release lock', async () => {
  const originalFind = Challenge.find;
  const originalTeamFind = Team.find;
  const originalAggregate = Submission.aggregate;

  Challenge.find = () => ({
    lean: async () => ([
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Locked challenge',
        category: 'Web',
        difficulty: 'Easy',
        points: 100
      }
    ])
  });
  Team.find = () => ({
    lean: async () => []
  });
  Submission.aggregate = async () => [];

  const app = createApp();
  const server = app.listen(0);

  const adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), username: 'admin', role: 'admin' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'GET', '/api/challenges', {
      token: adminToken
    });

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body), true);
    assert.equal(response.body[0].title, 'Locked challenge');
  } finally {
    Challenge.find = originalFind;
    Team.find = originalTeamFind;
    Submission.aggregate = originalAggregate;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can submit flags before release lock', async () => {
  const originalUserFindById = User.findById;
  const originalChallengeFindById = Challenge.findById;
  const originalTeamFindById = Team.findById;
  const originalCountDocuments = Submission.countDocuments;
  const originalSubmissionSave = Submission.prototype.save;
  const originalTeamSave = Team.prototype.save;

  const userId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();
  const challengeId = new mongoose.Types.ObjectId();

  const mockTeam = {
    _id: teamId,
    solvedChallenges: [],
    totalScore: 0,
    save: async function save() {
      return this;
    }
  };

  User.findById = async () => ({ _id: userId, teamId });
  Challenge.findById = async () => ({
    _id: challengeId,
    points: 200,
    flag: 'CUHP{admin_test_flag}'
  });
  Team.findById = async () => mockTeam;
  Submission.countDocuments = async () => 0;
  Submission.prototype.save = async function save() {
    return this;
  };
  Team.prototype.save = async function save() {
    return this;
  };

  const app = createApp();
  const server = app.listen(0);

  const adminToken = jwt.sign(
    { userId: userId.toString(), username: 'admin', role: 'admin' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'POST', '/api/submit', {
      token: adminToken,
      body: {
        challengeId: challengeId.toString(),
        flag: 'CUHP{admin_test_flag}'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.points, 200);
  } finally {
    User.findById = originalUserFindById;
    Challenge.findById = originalChallengeFindById;
    Team.findById = originalTeamFindById;
    Submission.countDocuments = originalCountDocuments;
    Submission.prototype.save = originalSubmissionSave;
    Team.prototype.save = originalTeamSave;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('non-admin cannot delete challenge', async () => {
  const challengeId = new mongoose.Types.ObjectId().toString();
  const app = createApp();
  const server = app.listen(0);

  const userToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), username: 'player', role: 'user' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'DELETE', `/api/challenges/${challengeId}`, {
      token: userToken
    });

    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Admin access required');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('ensureAdminUser promotes existing account and creates admin account', async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD = 'admin_password';

  try {
    let saved = false;
    User.findOne = async () => ({
      username: 'admin',
      email: 'admin@example.com',
      role: 'user',
      save: async () => {
        saved = true;
      }
    });
    User.create = async () => {
      throw new Error('should not create when admin exists');
    };

    await ensureAdminUser();
    assert.equal(saved, true);

    User.findOne = async () => null;
    let createdPayload = null;
    User.create = async (payload) => {
      createdPayload = payload;
      return payload;
    };

    await ensureAdminUser();
    assert.equal(createdPayload.username, 'admin');
    assert.equal(createdPayload.email, 'admin@example.com');
    assert.equal(createdPayload.role, 'admin');
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});
