const { EMAIL__SENDER: name, SMTP__AUTH_USER: user, SMTP__AUTH_PASS: pass } = Bun.env;

const nodemailer = require('nodemailer');

export default nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
  pool: true,
});

export const sender = `"${name}" <${user}>`;
export const senderParams = {
  from: sender,
  name,
  email: user,
};
