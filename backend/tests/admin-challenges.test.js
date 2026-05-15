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
  const originalUserFindById = User.findById;
  Challenge.findByIdAndUpdate = findByIdAndUpdateMock;
  User.findById = async () => ({
    _id: new mongoose.Types.ObjectId(),
    role: 'user'
  });

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
    User.findById = originalUserFindById;
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
  const originalUserFindById = User.findById;
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
  User.findById = async () => ({
    _id: new mongoose.Types.ObjectId(),
    role: 'admin'
  });

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
    User.findById = originalUserFindById;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can create challenge', async () => {
  const createdId = new mongoose.Types.ObjectId().toString();
  const originalCreate = Challenge.create;
  const originalUserFindById = User.findById;

  Challenge.create = async (payload) => ({
    _id: createdId,
    ...payload,
    toObject() {
      return { _id: createdId, ...payload };
    }
  });
  User.findById = async () => ({
    _id: new mongoose.Types.ObjectId(),
    role: 'admin'
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
    User.findById = originalUserFindById;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can access challenges before release lock', async () => {
  const originalFind = Challenge.find;
  const originalTeamFind = Team.find;
  const originalAggregate = Submission.aggregate;
  const originalUserFindById = User.findById;

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
  User.findById = () => ({
    _id: new mongoose.Types.ObjectId(),
    role: 'admin',
    teamId: null,
    lean: async () => ({ teamId: null })
  });

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
    User.findById = originalUserFindById;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin can submit flags before release lock', async () => {
  const originalUserFindById = User.findById;
  const originalChallengeFindById = Challenge.findById;
  const originalTeamFindById = Team.findById;
  const originalTeamFindOneAndUpdate = Team.findOneAndUpdate;
  const originalCountDocuments = Submission.countDocuments;
  const originalFindOne = Submission.findOne;
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
  Team.findOneAndUpdate = async () => ({
    _id: teamId,
    totalScore: 200
  });
  Submission.countDocuments = async () => 0;
  Submission.findOne = () => ({
    select: () => ({
      lean: async () => null
    })
  });
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
    Team.findOneAndUpdate = originalTeamFindOneAndUpdate;
    Submission.countDocuments = originalCountDocuments;
    Submission.findOne = originalFindOne;
    Submission.prototype.save = originalSubmissionSave;
    Team.prototype.save = originalTeamSave;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('repeat correct flag returns already solved without saving another submission', async () => {
  const originalUserFindById = User.findById;
  const originalChallengeFindById = Challenge.findById;
  const originalTeamFindById = Team.findById;
  const originalTeamFindOneAndUpdate = Team.findOneAndUpdate;
  const originalCountDocuments = Submission.countDocuments;
  const originalFindOne = Submission.findOne;
  const originalSubmissionSave = Submission.prototype.save;

  const userId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();
  const challengeId = new mongoose.Types.ObjectId();
  let saveCount = 0;

  const mockTeam = {
    _id: teamId,
    totalScore: 200,
    select: () => ({
      lean: async () => ({ totalScore: 200 })
    })
  };

  User.findById = async () => ({ _id: userId, teamId });
  Challenge.findById = async () => ({
    _id: challengeId,
    points: 200,
    flag: 'CUHP{repeat_flag}'
  });
  Team.findById = () => mockTeam;
  Team.findOneAndUpdate = async () => {
    throw new Error('team score must not update for repeat solves');
  };
  Submission.countDocuments = async () => 0;
  Submission.findOne = () => ({
    select: () => ({
      lean: async () => ({ _id: new mongoose.Types.ObjectId() })
    })
  });
  Submission.prototype.save = async function save() {
    saveCount += 1;
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
        flag: 'CUHP{repeat_flag}'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.alreadySolved, true);
    assert.equal(response.body.points, 0);
    assert.equal(response.body.totalScore, 200);
    assert.equal(saveCount, 0);
  } finally {
    User.findById = originalUserFindById;
    Challenge.findById = originalChallengeFindById;
    Team.findById = originalTeamFindById;
    Team.findOneAndUpdate = originalTeamFindOneAndUpdate;
    Submission.countDocuments = originalCountDocuments;
    Submission.findOne = originalFindOne;
    Submission.prototype.save = originalSubmissionSave;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('challenge list marks current user team solves', async () => {
  const originalFind = Challenge.find;
  const originalTeamFind = Team.find;
  const originalAggregate = Submission.aggregate;
  const originalUserFindById = User.findById;
  const originalUserFind = User.find;

  const userId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();
  const challengeId = new mongoose.Types.ObjectId();

  User.findById = () => ({
    _id: userId,
    role: 'admin',
    teamId,
    lean: async () => ({ teamId })
  });
  User.find = () => ({
    select: () => ({
      lean: async () => ([
        {
          _id: userId,
          username: 'admin'
        }
      ])
    })
  });
  Challenge.find = () => ({
    lean: async () => ([
      {
        _id: challengeId,
        title: 'Solved challenge',
        category: 'Web',
        difficulty: 'Easy',
        points: 100
      }
    ])
  });
  Team.find = () => ({
    lean: async () => ([
      {
        _id: teamId,
        name: 'Alpha'
      }
    ])
  });
  Submission.aggregate = async (pipeline) => {
    const groupStage = pipeline.find((stage) => stage.$group);
    if (groupStage?.$group?.firstSolverId) {
      return [
        {
          _id: challengeId,
          firstSolverId: userId
        }
      ];
    }

    return [
      {
        _id: {
          challengeId,
          teamId
        }
      }
    ];
  };

  const app = createApp();
  const server = app.listen(0);

  const adminToken = jwt.sign(
    { userId: userId.toString(), username: 'admin', role: 'admin' },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  try {
    const response = await requestJson(server, 'GET', '/api/challenges', {
      token: adminToken
    });

    assert.equal(response.status, 200);
    assert.equal(response.body[0].solvedByTeam, true);
    assert.deepEqual(response.body[0].solvedByTeams, ['Alpha']);
    assert.equal(response.body[0].solvedCount, 1);
  } finally {
    Challenge.find = originalFind;
    Team.find = originalTeamFind;
    Submission.aggregate = originalAggregate;
    User.findById = originalUserFindById;
    User.find = originalUserFind;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('non-admin cannot delete challenge', async () => {
  const challengeId = new mongoose.Types.ObjectId().toString();
  const originalUserFindById = User.findById;
  User.findById = async () => ({
    _id: new mongoose.Types.ObjectId(),
    role: 'user'
  });

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
    User.findById = originalUserFindById;
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
