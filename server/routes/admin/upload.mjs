const router = require('express').Router()

/* Tools */
import moment from 'moment'
import User, { superAdminUserOnly } from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'
import uploader from '../../tools/utils/multer.mjs'

const upload = {
    company: {
        logo: uploader('/business/company/logo'),
    },
}



router.post('/business/company/logo/:_id', User.verify, superAdminUserOnly, async (req, res, next) => {
    const { _id } = req.params
    const { since } = req.query

    const company = await Company.data(res.session, { _id })
    const id = await company.id()
    let filename = company.since

    if (since) filename = since

    req.upload = {
        dir: id,
        filename,
    }
    req.data = { company, filename }

    next()
}, upload.company.logo.single('companyLogo'), async (req, res) => {
    // Runs when upload is successfull
    await req.data.company.modify(res.session, 'main', { lastLogo: req.data.filename })

    res.send({ status: 'success' })
})



export default router