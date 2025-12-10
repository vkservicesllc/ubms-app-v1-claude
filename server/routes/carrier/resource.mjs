// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Company from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Driver, { Application, Citation, Accident, Employment } from '../../tools/core/driver.mjs'
import { ApplicationForm } from '../../tools/form/driver.mjs'
import { inPEnvironment, withPrivileges } from '../../tools/core/user/permissions.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { validateApplicant, dynamicValidator as dynamicApplicantValidator } from '../driver/resource.mjs'


// ==== SETUP ==== //

const url = {
    drivers: {
        applications: '/drivers/applications',
    },
}

const validateApplicantEmployers = []
const applicantEmployerFields = [
    '_prevEmployer', '_emplPhone', '_emplAddr1', '_emplAddr2', '_emplAddrZip', '_emplAddrCity', '_emplAddrState',
    '_emplStartDate', '_emplPosition', '_emplEarnings', '_emplFMCSR2', '_emplDotDat2', '_emplRFL', '_emplEndDate',
]
applicantEmployerFields.forEach(prop => validateApplicantEmployers.push(ApplicationForm[prop].validate()))



// ==== SETTINGS ROUTES ==== //


router.post('/user/:_id/app/settings', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.params
        if (_id != res.session.user._id) throw new Error('Invalid User')

        const user = await User.fetch(res.session, { _id })
        await user.settings('update', req.body)

        res.redirect('/settings')
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router