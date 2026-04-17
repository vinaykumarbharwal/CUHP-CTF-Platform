const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const emailService = require('../utils/emailService');

const router = express.Router();
const EMAIL_VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

function hashVerificationToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getVerificationBaseUrl() {
  const explicitUrl = (process.env.EMAIL_VERIFICATION_URL || '').trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const envFrontendUrl = (
    process.env.FRONTEND_URL ||
    process.env.CORS_ORIGIN ||
    process.env.VERCEL_URL ||
    ''
  ).trim().replace(/\/+$/, '');

  if (envFrontendUrl) {
    return `${envFrontendUrl}/verify-email`;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://cuhp-ctf-2026.vercel.app/verify-email';
  }

  const frontendUrl = 'http://localhost:3000';
  return `${frontendUrl}/verify-email`;
}

function buildVerificationLink(token) {
  const baseUrl = getVerificationBaseUrl();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
}

router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address.'),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const verificationToken = createVerificationToken();
    const verificationTokenHash = hashVerificationToken(verificationToken);
    const verificationLink = buildVerificationLink(verificationToken);

    const user = new User({
      username,
      email,
      password,
      isEmailVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_WINDOW_MS)
    });
    await user.save();

    try {
      await emailService.sendVerificationEmail({
        toEmail: user.email,
        username: user.username,
        verificationLink
      });
    } catch (error) {
      console.error('Email verification send failed:', error);
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ error: 'Could not send verification email. Please try registering again.' });
    }

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account. Check SPAM folder if you do not see the email in inbox.',
      requiresEmailVerification: true
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify-email', async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  try {
    const now = new Date();
    const tokenHash = hashVerificationToken(token);
    const user = await User.findOne({
      emailVerificationToken: tokenHash
    });

    if (!user) {
      return res.status(400).json({ error: 'Verification link is invalid or expired' });
    }

    if (user.isEmailVerified === true) {
      return res.json({ message: 'Email already verified. You can log in.' });
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires <= now) {
      return res.status(400).json({ error: 'Verification link is invalid or expired' });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address.'),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role || 'user' },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, teamId: user.teamId, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
