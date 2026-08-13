// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment, { defaultFormat } from 'moment'
import User from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'
import Individual from '../../tools/core/individual.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import uploader from '../../tools/utils/multer.mjs'
import { getFiles, renameFile } from '../../tools/utils/fs.mjs'

const path = require('path')


// ==== SETUP ==== //

const upload = {
    application: {
        dl: uploader('/driver/{id}/drivers-license/{id2}'),
        mec: uploader('/driver/{id}/medical-certificate/{id2}'),
        ssc: uploader('/driver/{id}/social-security-card/{id2}'),
    },
}

const uploadDriverPreset = async (req, res, next) => {
    const { formId } = req.params

    const application = await Application.fetch(res.session, { formId })
    if (!application) throw new Error('Application not found')

    const { id, driverId, personId } = application

    const driver = await Driver.fetch(res.session, { id: driverId })
    if (!driver) throw new Error('Driver not found')

    const individual = await Individual.fetch(res.session, { id: personId })
    if (!individual) throw new Error('Individual not found')

    req.upload = { id: driverId, id2: id }
    req.data = { application, driver, individual }

    next()
}



// ==== ROUTES ==== //


router.post('/api/drivers/application/:formId/initial-drivers-license', User.mw.verify, uploadDriverPreset, upload.application.dl.fields([
    { name: 'dlF', maxCount: 1 },
    { name: 'dlB', maxCount: 1 },
]), async (req, res) => {
    try {
        const { application, individual } = req.data
        let { checklist } = application
        if (!checklist) checklist = {}

        let action = 'update'

        if (!checklist.documents) {
            checklist.documents = {}
            action = 'add'
        }
        checklist.documents.dl = 1

        const { dl, name, person, address } = req.body
        const { dlId } = application

        dl.commercial = dl.commercial === 'Y'

        const cdl = dl.commercial ? 'Y' : 'N'
        let dlClass = dl.class
        if (!dlClass) dlClass = '-'
        const { id: userId } = res.session.user
        for (const [ field, side ] of [ [ 'dlF', 'front' ], [ 'dlB', 'back' ] ]) {
            const file = req.files[field]?.[0]
            if (!file) continue

            const ext = path.extname(file.filename)
            const filename = `${dl.issuedOn}_${dl.expiresOn}_${dl.state}_${dl.number}_${dlClass}_${cdl}_${side}_${userId}_init${ext}`
            await renameFile(path.dirname(file.path), file.filename, filename)
        }
        await individual.update('identifications', dl, { id: dlId })
        await individual.update('names', name, { since: individual.dob })

        const { since } = address
        delete address.since
        if (since) {
            await individual.update('addresses', address, { since })
            await individual.update('identifications', { addrSince: since }, { id: dlId })
        } else {
            const { address1, address2, city: addrCity, state: addrState, zip: addrZip } = address
            await individual.update('identifications', {
                address1, address2, addrCity, addrState, addrZip,
            }, { id: dlId })
        }

        await individual.update(person)
        await application[action]('checklist', { checklist })

        res.json({ status: 'OK' })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/api/drivers/application/:formId/initial-medical-certificate', User.mw.verify, uploadDriverPreset, upload.application.mec.fields([
    { name: 'mec', maxCount: 1 },
]), async (req, res) => {
    try {
        const file = req.files.mec?.[0]
        if (!file) throw new Error('File not found')

        const { application, driver } = req.data
        let { checklist } = application
        if (!checklist) checklist = {}

        let action = 'update'

        if (!checklist.documents) {
            checklist.documents = {}
            action = 'add'
        }
        checklist.documents.mec = 1

        const { expiresOn, issuedOn, nrcme } = req.body
        const { id: userId } = res.session.user
        const ext = path.extname(file.filename)
        const filename = `${expiresOn}_${issuedOn || '-'}_${nrcme || '-'}_${userId}_init${ext}`

        await renameFile(path.dirname(file.path), file.filename, filename)

        let { mecId } = application
        if (mecId) await driver.update('mecs', { expiresOn, issuedOn, nrcme }, { id: mecId })
        else {
            const { insertId } = await driver.add('mecs', { expiresOn, issuedOn, nrcme })
            if (!insertId) throw new Error('Failed to add medical card')

            mecId = insertId
            await application.update({ mecId })
        }

        await application[action]('checklist', { checklist })

        res.json({ status: 'OK' })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/api/drivers/application/:formId/initial-social-security-card', User.mw.verify, uploadDriverPreset, upload.application.ssc.fields([
    { name: 'ssc', maxCount: 1 },
]), async (req, res) => {
    try {
        const file = req.files.ssc?.[0]
        if (!file) throw new Error('File not found')

        const { application, individual } = req.data
        let { checklist } = application
        if (!checklist) checklist = {}

        let action = 'update'

        if (!checklist.documents) {
            checklist.documents = {}
            action = 'add'
        }
        checklist.documents.ssc = 1

        const { ssn, dhsReq } = req.body
        const { id: userId } = res.session.user
        const ext = path.extname(file.filename)
        const filename = `${application.finishedOn}_${dhsReq === 'true' ? 'Y' : 'N'}_${userId}_init${ext}`

        await renameFile(path.dirname(file.path), file.filename, filename)

        await individual.update({ ssn })
        await application[action]('checklist', { checklist })

        res.json({ status: 'OK' })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/api/drivers/application/:formId/drivers-license', User.mw.verify, uploadDriverPreset, upload.application.dl.fields([
    { name: 'dlF', maxCount: 1 },
    { name: 'dlB', maxCount: 1 },
]), async (req, res) => {
    try {
        req.body.commercial = req.body.commercial === 'Y'
        const { issuedOn, expiresOn, commercial, state, number, class: dlClass } = req.body
        const { id: userId } = res.session.user
        const cdl = commercial ? 'Y' : 'N'

        for (const [ field, side ] of [ [ 'dlF', 'front' ], [ 'dlB', 'back' ] ]) {
            const file = req.files[field]?.[0]
            if (!file) continue

            const ext = path.extname(file.filename)
            await renameFile(path.dirname(file.path), file.filename, `${issuedOn}_${expiresOn}_${state}_${number}_${dlClass || '-'}_${cdl}_${side}_${userId}${ext}`)
        }

        const { record } = req.query
        if (record !== 'false') {
            //
        }

        res.json({ status: 'OK' })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/api/drivers/application/:formId/medical-certificate', User.mw.verify, uploadDriverPreset, upload.application.mec.fields([
    { name: 'mec', maxCount: 1 },
]), async (req, res) => {
    try {
        //
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router