// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment, { defaultFormat } from 'moment'
import User from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'
import Individual from '../../tools/core/individual.mjs'
import { Application } from '../../tools/core/driver.mjs'
import uploader from '../../tools/utils/multer.mjs'
import { getFiles, renameFile } from '../../tools/utils/fs.mjs'

const path = require('path')


// ==== SETUP ==== //

const upload = {
    application: {
        dlInit: uploader('/driver/{id}/drivers-license/{id2}'),
    },
}



// ==== ROUTES ==== //


//* via fetch
router.post('/drivers/application/:formId/initial-drivers-license', User.mw.verify, async (req, res, next) => {
    const { formId } = req.params
    const application = await Application.fetch(res.session, { formId })
    if (!application) throw new Error('Application not found')

    const { id, driverId, personId } = application
    const individual = await Individual.fetch(res.session, { id: personId })
    if (!individual) throw new Error('Individual not found')

    //* id/id2 only — the final filename depends on req.body.dl, which multer
    //* hasn't parsed yet at this point, so it's applied via rename below instead
    req.upload = { id: driverId, id2: id }
    req.data = { application, individual }

    next()
}, upload.application.dlInit.fields([
    { name: 'dlF', maxCount: 1 },
    { name: 'dlB', maxCount: 1 },
]), async (req, res) => {
    try {
        //* Runs when upload is successfull
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

        const { issuedOn, expiresOn, number } = dl
        for (const [ field, suffix ] of [ [ 'dlF', 'front' ], [ 'dlB', 'back' ] ]) {
            const file = req.files[field]?.[0]
            if (!file) continue

            const ext = path.extname(file.filename)
            await renameFile(path.dirname(file.path), file.filename, `${issuedOn}_${expiresOn}_${number}_${suffix}_init${ext}`)
        }
        // if (!dl.class) dl.class = null
        // if (!dl.endorsement) dl.endorsement = null
        // if (!dl.restriction) dl.restriction = null
        // if (!name.middleName) name.middleName = null
        // if (!name.suffix) name.suffix = null
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



// ==== EXPORT ==== //

export default router