// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import moment from 'moment'
import User from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'
import uploader from '../../tools/utils/multer.mjs'


// ==== SETUP ==== //

const upload = {
    company: {
        logo: uploader('/business/company/logo'),
    },
}



// ==== ROUTES ==== //



router.post('/business/company/logo/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res, next) => {
    const { _id } = req.params
    const { since } = req.query

    const company = await Company.fetch(res.session, { _id })
    const { id } = company
    let filename = company.since

    if (since) filename = since

    req.upload = {
        dir: id,
        filename,
    }
    req.data = { company, filename }

    next()
}, upload.company.logo.single('companyLogo'), async (req, res) => {
    try {
        //* Runs when upload is successfull
        await req.data.company.update({ lastLogo: req.data.filename })

        res.send({ status: 'success' })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router