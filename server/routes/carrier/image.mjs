// ==== IMPORT ==== //

const { DIR__PATH: dir } = Bun.env

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import fs from 'fs'
import User from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'
import { Application } from '../../tools/core/driver.mjs'


// ==== SETUP ==== //
const imgExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif']


// ==== ROUTES ==== //


router.get('/driver/application/:_id/uploads/:filename', User.mw.verify, async (req, res) => {
    const { _id, filename } = req.params
    const application = await Application.fetch(res.session, { _id })
    const { driverId, id } = application
    const path = `${dir}/uploads/driver/${driverId}/application/${id}/uploads/${filename}`

    for (const ext of imgExt) {
        const filePath = path + ext
        if (fs.existsSync(filePath)) return res.sendFile(filePath)
    }

    res.status(404).send('Image not found')
})



// ==== EXPORT ==== //

export default router