// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment from 'moment'
import { PDFDocument } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { CustomFonts } from '../../settings/pdf-lib.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Company from '../../tools/core/company.mjs'
import { Application, Employment } from '../../tools/core/driver.mjs'
import createApplicationPdf from './mw/pdf/driver-application.mjs'
import createDriverLicensePdf from './mw/pdf/driver-license.mjs'
import createEmplVerifPdf from './mw/pdf/prev-employment-verification.mjs'
import { inPGroup, inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'
import fillPdf from '../../tools/utils/pdf.fillable.mjs'
import { respond404 } from '../../tools/utils/response.mjs'

/* Other */
import { fileLoggedOut } from './files.mjs'



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
        res.setHeader('Content-Disposition', 'inline; filename="Application Blank.pdf"')
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

        if (!application || application.condition === 'p' || (team && application._teamId !== team._id))
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
        res.setHeader('Content-Disposition', `inline; filename="[${formId}] Application.pdf"`)
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/driver/application/:formId/consent/psp', fileLoggedOut, Team.mw.verify, async (req, res) => {
    const { formId } = req.params

    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/apl', 'download', permissions, DS))
            return res.redirect(aplUrl)

        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })

        if (!application || application.condition === 'p' || (team && application._teamId !== team._id))
            return res.redirect(aplUrl)

        const { name: carrierName } = application.carrier || {}
        if (!carrierName) return res.send('Document not found')

        const { fullName, finishedOn, signature } = application
        let pdfBytes = await fillPdf('/carrier/driver/consent_psp', {
            'Prospective Employer Name': carrierName,
            'Signature Date': moment(finishedOn).format('MM/DD/YYYY'),
            "Driver's Printed Name": fullName,
        }, { title: `${fullName} - PSP Consent` })

        const pdfDoc = await PDFDocument.load(pdfBytes)
        pdfDoc.registerFontkit(fontkit)

        const pages = pdfDoc.getPages()
        const page2 = pages[1]
        const font = await pdfDoc.embedFont(CustomFonts.MrsSaintDelafield)

        page2.drawText(signature.applicant, {
            x: 250,
            y: 708,
            size: 21,
            font,
        })

        pdfBytes = await pdfDoc.save()

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="[${formId}] Consent (PSP).pdf"`)
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.get('/driver/application/:formId/:documentType', fileLoggedOut, Team.mw.verify, async (req, res) => {
    const { formId, documentType } = req.params

    try {
        const aplUrl = '/drivers/applications'
        const { user, team } = res.session
        const { DS } = user

        const permissions = await user.permissions(res.session)
        if (!withPrivileges('f:drv/sup', 'download', permissions, DS))
            return res.redirect(aplUrl)

        const application = await Application.fetch(res.session, { formId })
        if (!application || application.condition === 'p' || (team && application._teamId !== team._id))
            return res.redirect(aplUrl)

        let pdfBytes, downloadName

        switch (documentType) {
            case 'drivers-license':
                pdfBytes = await createDriverLicensePdf(application)
                downloadName = "Driver's License"
                break
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="[${formId}] ${downloadName}.pdf"`)
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
        res.setHeader('Content-Disposition', `inline; filename="Verification (TEMP).pdf"`)
        res.send(Buffer.from(pdfBytes))
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router