// ==== IMPORT ==== //

let { DIR__PATH: dir } = Bun.env
dir += '/uploads'

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Individual from '../../tools/core/individual.mjs'
import { Application } from '../../tools/core/driver.mjs'
import { inPGroup, inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'
import { respond404 } from '../../tools/utils/response.mjs'
import { deleteFiles } from '../../tools/utils/fs.mjs'

export const fileLoggedOut = async (req, res, next) => {
    const user = await User.mw.verify(req, res)
    if (!user) return res.send('Your session has expired, so you can no longer view this file.<br/>Please log in using another tab and refresh this page to regain access.')

    res.session.user = user
    next()
}



router.post('/delete/driver/application/:formId', fileLoggedOut, Team.mw.verify, async (req, res) => {
    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/sup', 'delete', permissions, DS))
            return res.redirect(aplUrl)

        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application || application.condition === 'p' || (team && application._teamId !== team._id))
            return res.redirect(aplUrl)

        const { target } = req.body
        if (!target) throw new Error('Target undefined')

        const { id, driverId, personId, checklist } = application
        const path = dir + `/driver/${driverId}/`
        + {
            dl: 'drivers-license',
            mec: 'medical-certificate',
            ssc: 'social-security-card',
        }[target] + `/${id}`

        const { success } = await deleteFiles(path, true)

        if (success) {
            const individual = await Individual.fetch(res.session, { id: personId })

            switch (target) {

                case 'dl':
                    {
                        const { dlId } = application
                        const body = {}
                        const fields = [ 'addrSince', 'address1', 'address2', 'addrCity', 'addrState', 'addrZip' ]
                        fields.forEach(field => body[field] = null)
                        checklist.documents.dl = 0

                        await individual.update('identifications', body, { id: dlId })
                    }
                    break

                case 'mec':
                    {
                        checklist.documents.mec = 0
                    }
                    break

                case 'ssc':
                    {
                        checklist.documents.ssc = 0
                    }
                    break

            }

            await application.update('checklist', { checklist })
        }

        res.redirect(`/drivers/application/${formId}/e-form?files`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/skip/driver/application/:formId/:target', fileLoggedOut, Team.mw.verify, async (req, res) => {
    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/sup', 'upload', permissions, DS))
            return res.redirect(aplUrl)

        const { formId, target } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application || application.condition === 'p' || (team && application._teamId !== team._id))
            return res.redirect(aplUrl)

        let { checklist } = application
        if (!checklist) checklist = {}
        if (!checklist.documents) checklist.documents = {}
        if (!checklist.skipped) checklist.skipped = {}

        const prop = {
            'legal-documents': 'leg',
            'social-security-card': 'ssc',
        }[target]

        checklist.documents[prop] = 0
        checklist.skipped[prop] = 1

        await application.update('checklist', { checklist })

        res.redirect(`/drivers/application/${formId}/e-form?files`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router