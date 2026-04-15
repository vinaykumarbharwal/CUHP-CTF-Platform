const User = require('../models/User');

async function ensureAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminEmail || !adminPassword) {
    return;
  }

  const existingAdmin = await User.findOne({
    $or: [{ username: adminUsername }, { email: adminEmail.toLowerCase() }]
  });

  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`Admin role granted to existing user: ${existingAdmin.username}`);
    }
    return;
  }

  await User.create({
    username: adminUsername,
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'admin'
  });

  console.log(`Admin user created: ${adminUsername}`);
}

module.exports = {
  ensureAdminUser
};
