// ==== IMPORT ==== //

const router = require('express').Router()
const mysql = require('../../tools/utils/mysql')
const sendError = require('../../tools/utils/error')

/* Settings */
import config from '../../../config.mjs'
import db, { query } from '../../settings/mysql.mjs'

/* Tools */
import User, { Token } from '../../tools/core/user.mjs'
import transporter, { sender } from '../../tools/utils/nodemailer.mjs'
import { utcTimeStamp } from '../../tools/utils/date.mjs'



// ==== ROUTES ==== //


router.post('/unique/user/new/username', async (req, res) => {
    try {
        const { username } = req.body
        const response = { unique: true }

        const user = await User.fetch(res.session, { username }, { offline: true })
        response.unique = !user

        res.send(response)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/user/decline/:_id', async (req, res) => {
    try {
        const { _id } = req.params

        const user = await User.fetch(res.session, { _id }, { offline: true })
        if (!user) throw new Error('Oops! Something went wrong!')

        const inviter = await user.inviter()
        await mysql.execute(query.user.registration.delete({ userId: user.id }))
        await mysql.execute(query.user.main.update({ declinedAt: utcTimeStamp(), condition: 'L' }, { id: user.id }))

        const userName = user.fullName('FAL')

        transporter.sendMail({
            from: sender,
            to: inviter.email,
            subject: 'User Declined Terms and Conditions',
            html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                <p>Dear ${inviter.name},</p>
                <p>
                    We would like to inform you that the user ${userName} has declined the terms and conditions.<br/>
                    Please review this matter and take any necessary actions in accordance with our policies.
                </p>
                <p>If you need further information or have any questions, please feel free to contact the support team.</p>
            </div>`,
        })

        transporter.sendMail({
            from: sender,
            to: user.email,
            subject: 'Important Notice: Declined Terms and Conditions',
            html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                <p>Dear ${userName},</p>
                <p>
                    We have noticed that you declined the Terms and Conditions.<br/>
                    Please be aware that accepting these terms is a mandatory requirement for continued access to our services.
                </p>
                <strong>What this means:</strong>
                <ul>
                    <li>Your access to ${config.site.name} is currently restricted.</li>
                    <li>Declining the terms and conditions could impact your employment status.</li>
                </ul>
                <strong>Further Steps:</strong>
                <ol>
                    <li>Contact your Administrator</li>
                    <li>Discuss possible solutions</li>
                    <li>Request a new invitation</li>
                    <li>Accept the Terms and Conditions of our platform</li>
                </ol>
                <p>If no action is taken, your account may be permanently banned.</p>
            </div>`,
        })

        res.send('OK')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// router.post('/user/security', User.verify)


router.post('/token/resend', async (req, res) => {
    try {
        const { _id } = req.body
        const user = await User.fetch(res.session, { _id }, { offline: true })
        if (!user) throw new Error('Oops! Something went wrong!')

        const { clientIp } = req.session
        const { key: token } = await Token.create({ userId: id, clientIp })

        const response = { status: token ? 'success' : 'error' }
        if (token && !config.notification.email.authToken) response.token = token

        res.send(response)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router