require('dotenv').config({ path: '../../../.env' })
const { DIR__PATH: dir } = process.env

const router = require('express').Router()

/* Tools */
import fs from 'fs'
import User, { superAdminUserOnly } from '../../tools/core/user.mjs'
import Company from '../../tools/core/company.mjs'



router.get('/business/company/logo/:_id/:filename', User.verify, async (req, res) => {
    const { _id, filename } = req.params
    const company = await Company.data(res.session, { _id })
    const id = await company.id()
    const path = `${dir}/uploads/business/company/logo/${id}/${filename}`

    fs.access(path, fs.constants.F_OK, err => {
        if (err) return res.status(404).send('Image not found')

        res.sendFile(path)
    })
})



export default router