const router = require('express').Router()
const throwErr = require('../../tools/error').api

/* Settings */
import config from '../../../config.mjs'
import db from '../../settings/mysql.mjs'

/* Assests */
import User from '../../assets/user.mjs'

/* Tools */
import transporter, { sender } from '../../tools/nodemailer.mjs'



router.post('/username-uniqueness', async (req, res) => {
    try {
        const response = { unique: true }
        const { username } = req.body

        const { found } = await User.find(res.session, { username })
        response.unique = !found

        res.send(response)
    } catch (err) {
        throwErr.server(res, null, err, false)
    }
})


router.post('/user/decline/:_id', async (req, res) => {
    try {
        const { _id } = req.params
        const user = await User.data(res.session, { _id })
        if (!user) return throwErr.auth(res, 'Unauthorized access')

        const inviter = await user.inviter(res.session)

        await mysql.execute(
            new Query(db.online, 'user_registration').delete({ userId: User.matchIdHash(_id) })
        )

        await mysql.execute(
            new Query(db.online, 'users').update({ decliner: true, condition: 'L' }, { id: User.matchIdHash(_id) })
        )

        transporter.sendMail({
            from: sender,
            to: inviter.email,
            subject: 'User Declined Terms and Conditions',
            html: `<div style="font-family: Arial, Helvetica, sans-serif;">
                <p>Dear ${inviter.name},</p>
                <p>
                    We would like to inform you that the user ${user.name} has declined the terms and conditions.<br/>
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
                <p>Dear ${user.name},</p>
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
        throwErr.server(res, null, err, false)
    }
})



export default router