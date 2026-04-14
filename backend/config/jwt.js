const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET is required. Set it in your backend environment variables.');
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRE || '7d'
};
