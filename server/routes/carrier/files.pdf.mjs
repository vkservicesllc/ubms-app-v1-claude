// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Company from '../../tools/core/company.mjs'
import { Application, Employment } from '../../tools/core/driver.mjs'
import createApplicationPdf from './mw/pdf/driver-application.mjs'
import createEmplVerifPdf from './mw/pdf/prev-employment-verification.mjs'
import { inPGroup, inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'
import { respond404 } from '../../tools/utils/response.mjs'

/* Other */
import { fileLoggedOut } from '../carrier.mjs'



// ==== DRIVER ROUTES ==== //


router.get('/driver/application/blank/:route?', fileLoggedOut, Team.mw.verify, async (req, res) => {
    try {
        const { user } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('d:drv/apl', 'create', permissions, DS))
            return respond404(res)

        const { route } = req.params

        let carrier
        if (route) {
            const company = await Company.fetch(res.session, { route })
            const { name, address, phone, fax, lastLogo } = company

            carrier = { name, address, phone, fax, lastLogo }
            carrier.address = carrier.address.physical
            carrier.companyId = company.id
        }

        const pdfBytes = await createApplicationPdf(carrier)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="application.pdf"')
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/driver/application/:formId', fileLoggedOut, Team.mw.verify, async (req, res) => {
    const { formId } = req.params

    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/apl', 'download', permissions, DS))
            return res.redirect(aplUrl)

        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })

        if (!application || application.condition !== 'c' || (team && application._teamId !== team._id))
            return res.redirect(aplUrl)

        let carrier
        if (application._carrierId) {
            const { _carrierId: _id } = application
            carrier = await Carrier.fetch(res.session, { _id })

            const companyId = carrier.companyId
            const { name, address, phone, fax, lastLogo } = carrier
            carrier = { name, address, phone, fax, lastLogo }
            carrier.address = carrier.address.physical
            carrier.companyId = companyId
        }

        const addresses = await application.fetch('addresses')
        const violations = await application.fetch('citations')
        const accidents = await application.fetch('accidents')
        const employers = await Employment.fetch(res.session, { appId: application.id, unreported: false })

        const pdfBytes = await createApplicationPdf(carrier, application, addresses, violations, accidents, employers)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="application.pdf"')
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


//! CREATE CONSENT FORM
router.get('/driver/application/:formId/consent/mvr-psp', fileLoggedOut, Team.mw.verify, async (req, res) => {
    const { formId } = req.params

    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/apl', 'download', permissions, DS))
            return res.redirect(aplUrl)

        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })

        if (!application || application.condition !== 'c' || (team && application._teamId !== team._id))
            return res.redirect(aplUrl)

        let carrier
        if (application._carrierId) {
            const { _carrierId: _id } = application
            carrier = await Carrier.fetch(res.session, { _id })

            const companyId = carrier.companyId
            const { name, address, phone, fax, lastLogo } = carrier
            carrier = { name, address, phone, fax, lastLogo }
            carrier.address = carrier.address.physical
            carrier.companyId = companyId
        }

        const addresses = await application.fetch('addresses')
        const violations = await application.fetch('citations')
        const accidents = await application.fetch('accidents')
        const employers = await Employment.fetch(res.session, { appId: application.id, unreported: false })

        const pdfBytes = await createApplicationPdf(carrier, application, addresses, violations, accidents, employers)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="application.pdf"')
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/driver/application/previous-employment/verification/:method?', fileLoggedOut, Team.mw.verify, async (req, res) => {
    try {
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/emp', 'download', permissions, DS))
            return res.redirect(aplUrl)

        const { method } = req.params
        const { emp: _id , app: _appId } = req.query
        const employment = await Employment.fetch(res.session, { _id, _appId }, { hideSensitive: false })
        if (!employment.application.carrier) return respond404(res)
        if (team && employment.application._teamId !== team._id) return respond404(res)

        const pdfBytes = await createEmplVerifPdf(employment, method)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="verification.pdf"')
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router