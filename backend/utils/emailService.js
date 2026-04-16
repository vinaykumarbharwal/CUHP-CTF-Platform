function requiredValue(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required for email verification`);
  }
  return value.trim();
}

function optionalValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

async function sendVerificationEmail({ toEmail, username, verificationLink }) {
  let emailjs;
  try {
    emailjs = require('@emailjs/nodejs');
  } catch (error) {
    throw new Error('Missing dependency "@emailjs/nodejs". Install backend dependencies and try again.');
  }

  const serviceId = requiredValue('EMAILJS_SERVICE_ID');
  const templateId = requiredValue('EMAILJS_TEMPLATE_ID');
  const publicKey = requiredValue('EMAILJS_PUBLIC_KEY');
  const privateKey = optionalValue('EMAILJS_PRIVATE_KEY', 'EMAILJS_ACCESS_TOKEN');
  const options = { publicKey };
  if (privateKey) {
    options.privateKey = privateKey;
  }

  return emailjs.send(
    serviceId,
    templateId,
    {
      to_email: toEmail,
      to_name: username,
      username,
      email: toEmail,
      verification_link: verificationLink,
      verification_url: verificationLink
    },
    options
  );
}

module.exports = {
  sendVerificationEmail
};
