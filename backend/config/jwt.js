module.exports = {
  secret: process.env.JWT_SECRET || 'your_secret_key',
  expiresIn: process.env.JWT_EXPIRE || '7d'
};
