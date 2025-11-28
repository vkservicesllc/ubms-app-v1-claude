require('dotenv').config({ path: '../../../.env' })
const {
    EMAIL__SENDER: name,
    SMTP__AUTH_USER: user,
    SMTP__AUTH_PASS: pass,
} = process.env

const nodemailer = require('nodemailer')


export default nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool: true,
})

export const sender = `"${name}" <${user}>`
export const senderParams = {
    from: sender,
    name,
    email: user,
}