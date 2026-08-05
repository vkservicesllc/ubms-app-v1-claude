// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment, { defaultFormat } from 'moment'
import User from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'
import { Application } from '../../tools/core/driver.mjs'
import uploader from '../../tools/utils/multer.mjs'
import { getFiles } from '../../tools/utils/fs.mjs'


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

    const { id, driverId } = application

    req.upload = {
        id: driverId,
        id2: id,
        files: {
            //* Initial
            dlF: { filename: '00-front' },
            dlB: { filename: '00-back' },
        },
    }
    req.data = { application }

    next()
}, upload.application.dlInit.fields([
    { name: 'dlF', maxCount: 1 },
    { name: 'dlB', maxCount: 1 },
]), async (req, res) => {
    try {
        //* Runs when upload is successfull
        const { application } = req.data
console.log(req.body)
        return res.send({ body: req.body, files: req.files })
        //! to be continued...

    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router