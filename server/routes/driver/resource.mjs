// ==== IMPORT ==== //

const router = require('express').Router()
const { body } = require('express-validator')
const sendError = require('../../tools/utils/error')

/* Tools */
import User from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Carrier from '../../tools/core/carrier.mjs'
import Individual from '../../tools/core/individual.mjs'
import Driver, { Application } from '../../tools/core/driver.mjs'
import { utcTimeStamp } from '../../tools/utils/date.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import DriverForm, { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs'


// ==== SETUP ==== //


const dynamicValidator = {
    applications: (req, res, next) => {
        const { step } = req.params
        let validators = []

        switch (step) {
            case 'workflow':
                validators = ApplicationForm.validate('workflow')
                break
            case 'profile':
                validators = ApplicationForm.validate('profile')
                break
            case 'legal-status':
                validators = ApplicationForm.validate('legal')
                break
            case 'position':
                validators = ApplicationForm.validate('position/vehicle')
                break
            case 'residence':
                validators = ApplicationForm.validate('residence')
                break
            case 'driver-license':
                validators = ApplicationForm.validate('license')
                break
            case 'medical-card':
                validators = ApplicationForm.validate('medical')
                break
            case 'legal-compliance':
                validators = ApplicationForm.validate('compliance')
                break
            case 'safety':
                validators = ApplicationForm.validate('safety')
                break
            case 'experience':
                validators = ApplicationForm.validate('experience')
                break
            case 'prev-employment':
                validators = ApplicationForm.validate('employment')
                break
            // case 'prev-employer':
            //     validators = EmploymentForm.validate()
                break
            case 'preference':
                validators = ApplicationForm.validate('preference')
                break
            case 'business':
                validators = ApplicationForm.validate('business/vehicle')
                break
            case 'beneficiary':
                validators = ApplicationForm.validate('beneficiary')
                break
            case 'misc':
                validators = ApplicationForm.validate('emergency')
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },
}



// ==== ROUTES ==== //


router.post('/application/start/:_teamId?/:_carrierId?', [
    ApplicationForm.position.validate(),
    ApplicationForm.ssn.validate(),
    ApplicationForm.dob.validate(),
], validationCheck, async (req, res) => {
    try {
        const { position, ssn, dob } = req.body
        let { form: formId } = req.query

        const person = await Individual.fetch(res.session, { ssn })
        if (person && dob !== person.dob) throw new Error('DAPP_DOB_MISMATCH_ERROR')

        let urlExt = ''
        const extendUrl = _id => `/registration?id=${_id}`

        if (formId) {
            const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })
            if (!application) throw new Error('DAPP_NFOUND_ERROR')

            if (!application.driverId) {
                if (application?.lead?.ssn) urlExt = extendUrl(application._id)  //* Driver never registered but started in the past
                else {
                    let driverId, rehire
                    const driver = await Driver.fetch(res.session, { ssn })
                    if (driver) {
                        driverId = driver.id
                        rehire = true
                        req.session.application = application._id
                    } else urlExt = extendUrl(application._id)

                    await application.update('lead', { ssn, dob })
                    await application.update({ driverId, rehire, position }) //, createdAt: utcTimeStamp()
                }
            }
        } else {
            const { _teamId, _carrierId } = req.params
            const { cdl: cdlRole, rec: _userSimpleId,  } = req.query

            const application = (await Application.create(res.session, {
                cdlRole, _teamId, _carrierId, _userSimpleId,
                ssn, dob, position,
            })).data

            formId = application.formId
            urlExt = extendUrl(application._id)
        }

        res.redirect(`/application/${formId + urlExt}`)
        // const person = await Individual.fetch(res.session, { ssn })
        // if (person && dob !== person.dob) throw new Error('DAPP_DOB_MISMATCH_ERROR')

        // const { _teamId, _carrierId } = req.params
        // const { cdl: cdlRole, rec: _userSimpleId, form: formId } = req.query
        // const filter = { formId }

        // if (!formId) filter.ssn = ssn
        // let application = await Application.fetch(res.session, filter, { hideSensitive: false })
        // let urlExt = ''
        // const extendUrl = _id => `/registration?id=${_id}`

        // if (!application) {
        //     application = (await Application.create(res.session, {
        //         cdlRole, _teamId, _carrierId, _userSimpleId,
        //         ssn, dob, position,
        //     })).data
        //     if (!application) throw new Error('Failed to create application')
        //     urlExt = extendUrl(application._id)
        // } else if (!application.driverId) {
        //     if (application?.lead?.ssn) urlExt = extendUrl(application._id)  //* Driver never registered but started in the past
        //     else {
        //         let driverId, rehire
        //         const driver = await Driver.fetch(res.session, { ssn })
        //         if (driver) {
        //             driverId = driver.id
        //             rehire = true
        //         } else urlExt = extendUrl(application._id)

        //         await application.update('lead', { ssn, dob })
        //         await application.update({ driverId, rehire, position }) //, createdAt: utcTimeStamp()
        //     }
        // }

        // res.redirect(`/application/${application.formId + urlExt}`)
    } catch (err) {
        switch (err.message) {
            case 'DAPP_DOB_MISMATCH_ERROR':
                {
                    //! Return HBS with message
                    return res.send('DOB Mismatch Error. HBS comming later...')
                }
                break
            case 'DAPP_NFOUND_ERROR':
                {
                    //! Return HBS with message
                    return res.send('Form ID Error. HBS comming later...')
                }
                break
            case 'DAPP_LOCKED_SSN_ERROR':
                {
                    //! Return HBS with message
                    return res.send('SSN is locked. HBS comming later...')
                }
            default:
                sendError.server(req, res, err)
        }
    }
})


router.post('/application/register/:_id', ApplicationForm.validate('registration'), validationCheck, async (req, res) => {
    try {
        const { _id } = req.params
        const application = await Application.fetch(res.session, { _id }, { hideSensitive: false })
        if (!application) throw new Error('Application not found')

        await application.register(req.body)
        req.session.application = application._id

        res.redirect(`/application/${application.formId}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


// router.post('/OLD/application/start/:_teamId/:_carrierId?', ApplicationForm.validate('registration'), validationCheck, async (req, res) => {
// // return res.send(req.body)
//     try {
//         let { form: formId } = req.query
//         const { address: addrBody } = req.body
//         delete req.body.address

//         let application, personId

//         if (formId) {
//             application = await Application.fetch(res.session, { formId })
//             if (!application) throw new Error('Application not found')

// //* Pre-Applicant
// //! Individual add-ons

//             await application.update(req.body)

//             //! Need to get personId from application
//         } else {
//             const { _teamId, _carrierId } = req.params
//             const { cdl: cdlRole, rec: _userId } = req.query

//             req.body.cdlRole = +cdlRole

//             let team
//             if (_teamId !== 'global') {
//                 team = await Team.fetch(res.session, { _id: _teamId }, { offline: true })
//                 if (!team) throw new Error('Team not found')

//                 res.session.team = team
//                 req.body.teamId = team.id
//             }

//             if (_carrierId) {
//                 const carrier = await Carrier.fetch({ ...res.session, user: { id: 1 } }, { _id: _carrierId })
//                 if (!carrier) throw new Error('Carrier not found')

//                 req.body.carrierId = carrier.id
//             }

//             if (_userId) {
//                 const user = await User.fetch(res.session, { _simpleId: _userId }, { offline: true })
//                 if (!user) throw new Error('User not found')

//                 req.body.userId = user.id
//             }

//             const result = await Application.create(res.session, req.body)
//             application = result.data
//             if (!application) throw new Error('Failed to create application')

//             formId = application.formId
//             personId = application.personId
//         }

//         await application.add('addresses', addrBody)
//         await application.welcome()

//         if (!addrBody.enough) await application.update({ step: 0 })
//         await application.update({ addrComplete: !!addrBody.enough })

//         if (personId) { //! CONDITION IS TEMPORARY (EXPECT personId anyway)
//             const person = await Individual.fetch(res.session, { id: application.personId })
//             if (person) { //* DO NOT INTERRUPT APPLICATION WITH ERROR
//                 delete addrBody.appId
//                 delete addrBody.enough

//                 //! ADD THE ADDRESS ONLY IF NOT FOUND
//                 await person.add('addresses', addrBody)
//             }
//         }

//         res.redirect(`/application/${formId}`)
//     } catch (err) {
//         sendError.server(req, res, err)
//     }
// })


router.post('/application/progress/:formId/:step', dynamicValidator.applications, validationCheck, async (req, res) => {
    try {
        const { formId, step } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideSensitive: false })
        if (!application) throw new Error('Application not found')
// return res.send({
//     step,
//     body: req.body,
//     formId,
//     id: application.id,
// })
        await application.progress(step, req.body)

        res.redirect(`/application/${formId}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/application/submit/:formId', async (req, res) => {
    try {
        const { formId } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        await application.submit()

        res.redirect(`/application/${formId}`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router

export { dynamicValidator }