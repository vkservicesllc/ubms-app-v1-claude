const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Import: Tools */
import Driver, { Application, Employment } from '../../tools/core/driver.mjs'

/* Import: Validators */
import validationCheck from '../../tools/form/validator.mjs'
import { ApplicationForm, EmploymentForm } from '../../tools/form/driver.mjs'



//* GET *//


router.get('/:formId/:target?/:_id?', async (req, res) => {
    try {
        const { formId, target, _id } = req.params
        const application = await Application.fetch(res.session, { formId }, { hideRawId: true, hideSensitive: true })
        if (!application) throw new Error('Application not found')

        delete application.checklist
        delete application.user
        delete application.team

        if (!target) return res.json({ data: application })

        if (!req.session.application) return sendError.auth(req, res)

        if (target === 'employers')
            return res.json({
                data: await Employment.fetch(res.session, { _appId: application._id, _id }),
                resource: application,
            })

        res.json({ data: await application.fetch(target, { _id }), resource: application })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



//* POST/PUT/PATCH *//


const dynamicValidator = (req, res, next) => {
    const { target } = req.params
    let validators = []

    switch (target) {
        case 'employers':
            validators = EmploymentForm.validate()
            break
        //! add more validators later if needed
    }

    Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
}


const updateResource = async (req, res) => {
    try {
        const { formId, target, _id } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        let result

        if (target === 'employers') {
            const employer = await Employment.fetch(res.session, { _id })
            if (!employer) throw new Error('Employer not found')

            result = await employer.update(req.body)
        } else {
            let match = { _id }
            if (req.body.match) {
                match = { ...match, ...req.body.match }
                delete req.body.match
            }

            result = await application.update(target, req.body, match)
        }

        res.json({ status: 'OK', updated: result.updated })
    } catch (err) {
        sendError.server(req, res, err)
    }
}


router.post('/:formId/:target', dynamicValidator, validationCheck, async (req, res) => {
    try {
        const { formId, target } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        let created = false

        if (target === 'employers') {
            delete req.body._id
            req.body.driverId = application.driverId
            req.body.appId = application.id

            const result = await Employment.create(res.session, req.body)
            created = result.created

            await application.update({ prevEmployed: true })
            const driver = await Driver.fetch(res.session, { id: application.driverId })
            const { cache = {} } = driver.appDef
            cache.prevEmployed = true
            await driver.update('appDef', { cache })
        } else {
            const result = await application.add(target, req.body)
            created = result.added

            //! update application prop if needed based target
        }

        res.json({ status: 'OK', created })
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.route('/:formId/:target/:_id?')
    .put(dynamicValidator, validationCheck, updateResource)
    .patch(updateResource)



//* DELETE *//


router.delete('/:formId/:target/:_id?', async (req, res) => {
    try {
        const { formId, target, _id } = req.params
        const application = await Application.fetch(res.session, { formId })
        if (!application) throw new Error('Application not found')

        let result

        if (target === 'employers') {
            const employer = await Employment.fetch(res.session, { _id })
            if (!employer) throw new Error('Employer not found')

            result = await employer.delete()

            const employments = await Employment.fetch(res.session, { appId: application.id })
            if (!employments.length) await application.update({ prevEmployed: application.step > 6 ? false : null })
        } else {
            let match = { _id }
            if (req.body.match) match = { ...match, ...req.body.match }

            result = await application.delete(target, match)

            //! update application prop if needed based target
        }

        res.json({ status: 'OK', deleted: result.deleted })
    } catch (err) {
        sendError.server(req, res, err)
    }
})



/* Export */
export default router