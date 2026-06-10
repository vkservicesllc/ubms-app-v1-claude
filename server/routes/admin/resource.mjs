// ==== IMPORT ==== //

const router = require('express').Router()
const sendError = require('../../tools/utils/error')

/* Tools */
import User, { Role } from '../../tools/core/user.mjs'
import Team from '../../tools/core/team.mjs'
import Individual from '../../tools/core/individual.mjs'
import Company, { Owner, RefSource } from '../../tools/core/company.mjs'
import Carrier from '../../tools/core/carrier.mjs'

/* Validators */
import validationCheck from '../../tools/form/validator.mjs'
import UserForm, { RoleForm } from '../../tools/form/user.mjs'
import TeamForm from '../../tools/form/team.mjs'
import CompanyForm, { OwnerForm, RefSourceForm } from '../../tools/form/company.mjs'
import CarrierForm from '../../tools/form/carrier.mjs'


// ==== SETUP ==== //

const dynamicValidator = {
    companies: (req, res, next) => {
        const { step } = req.params
        let validators = []

        switch (step) {
            case 'address':
                validators = CompanyForm.validate('address')
                break
            case 'contacts':
                validators = CompanyForm.validate('contacts')
                break
        }

        Promise.all(validators.map(validator => validator.run(req)))
            .then(() => next())
            .catch(next)
    },
}


const source = {
    'user': [ User, '/online/users' ],
    'role': [ Role, '/online/users' ],
    'team': [ Team, '/online/teams' ],
    'company': [ Company, '/business/companies', '/business/company/' ],
    'company-owner': [ Owner, '/business/company-owners' ],
    'refsource': [ RefSource, '/business/advertisement' ],

    ext(src, inst) {
        let ext = ''

        switch (src) {
            case 'role':
                ext = `?role=${inst.category || 'def'}`
                break
        }

        return ext
    },

}



// ==== INSERT/UPDATE ROUTES ==== //


router.post('/insert/company', User.mw.verify, User.mw.superAdminOnly, CompanyForm.validate(), validationCheck, async (req, res) => {
    try {
        delete req.body._match

        const { data: company } = await Company.create(res.session, req.body)
        if (!company) throw new Error('Failed to register company')

        res.redirect(source.company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



router.post('/upsert/user', User.mw.verify, async (req, res, next) => {
    const { user: sessionUser } = res.session
    const { status, location, firstName, alias } = req.body

    switch (true) {
        case status === 'D' && sessionStatus !== 'D':
        case status === 'S' && !sessionUser.DS:
            throw new Error('Illegal User Status')
            break
        case sessionUser.location !== 'US' && location !== sessionUser.location:
            throw new Error('Illegal User Location')
            break
        case firstName === alias:
            throw new Error('Illegal User Alias')
            break
    }

    if ((status === 'D' || status === 'S') && location !== 'US') req.body.location = 'US'
    if (location !== 'US') delete req.body.phone

    next()
}, UserForm.validate(), validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        delete req.body._id

        if (_id) {
            const user = await User.fetch(res.session, { _id }, { hideEvents: false })
            if (!user) throw new Error('User not found')

            if (user.DS) {
                if (user.status === 'D') req.body.status = 'D'
                req.body.location = 'US'
            } else if (!req.body.location) req.body.location = user.location

            await user.update(req.body)
            return res.redirect(source.user[1])
        }

        const { data: user } = await User.create(res.session, req.body)

        res.redirect(!user.DS ? `/online/user/${user._id}` : '/online/users')
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/role', User.mw.verify, User.mw.superAdminOnly, RoleForm.validate(), validationCheck, async (req, res) => {
    try {
        let role
        const { _id } = req.body
        delete req.body._id

        if (_id) {
            role = await Role.fetch(res.session, { _id })
            if (!role) throw new Error('Role not found')

            await role.update(req.body)
        } else {
            let { category = null } = req.query

            if (category) category = Company.list.category.key(category)
            req.body.category = category

            role = (await Role.create(res.session, req.body)).data
        }

        res.redirect(source.user[1] + source.ext('role', role))
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/team', User.mw.verify, User.mw.superAdminOnly, TeamForm.validate(), validationCheck, async (req, res) => {
    try {
        let team
        const { _id } = req.body
        delete req.body._id
        req.body.scoped = req.body.scoped === 'on'

        if (_id) {
            team = await Team.fetch(res.session, { _id })
            if (!team) throw new Error('Team not found')

            await team.update(req.body)
        } else team = (await Team.create(res.session, req.body)).data

        res.redirect(source.team[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/company-owner', User.mw.verify, User.mw.superAdminOnly, OwnerForm.validate(), validationCheck, async (req, res) => {
    try {
        const { company: _companyId } = req.query
        const { _id, _match: match = {} } = req.body
        delete req.body._id
        delete req.body._match

        if (!_id) {
            const { data: owner } = await Owner.create(res.session, req.body)
            if (!owner) throw new Error('Failed to create owner')

            if (_companyId) {
                const company = await Company.fetch(res.session, { _id: _companyId })
                if (!company) throw new Error('Company not found')

                const { since = company.since } = req.query

                await company.delete('ownerships', { since })
                await company.add('ownerships', { ownerId: owner.id, since })
            }
        } else {
            let owner = await Owner.fetch(res.session, { _id })
            if (!owner) throw new Error('Owner not found')

            const { firstName, middleName, lastName, suffix, gender, dob } = req.body
            {
                ({ data: owner } = await owner.update({ gender, dob }))
                const names = await owner.fetch('names')
                const { since = '0000-00-00' } = names[0]

                await owner.update('names', { firstName, middleName, lastName, suffix }, { since })
            }
        }

        res.redirect(_companyId ? source.company[2] + _companyId : source['company-owner'][1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/refsource', User.mw.verify, User.mw.superAdminOnly, RefSourceForm.validate(), validationCheck, async (req, res) => {
    try {
        let refSrc
        const { _id } = req.body
        delete req.body._id

        if (_id) {
            refSrc = await RefSource.fetch(res.session, { _id })
            if (!refSrc) throw new Error('Source not found')

            await refSrc.update(req.body)
        } else refSrc = (await RefSource.create(res.session, req.body)).data

        res.redirect(source.refsource[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/upsert/carrier/:_companyId', User.mw.verify, User.mw.superAdminOnly, CarrierForm.validate(), validationCheck, async (req, res) => {
    try {
        const { _companyId } = req.params
        let carrier = await Carrier.fetch(res.session, { _companyId })
        const company = await Company.fetch(res.session, { _id: _companyId })
        if (!company) throw new Error('Company not found')

        const { since } = company

        if (!carrier.id) {
            req.body.companyId = company.id
            req.body.since = since

            const { data } = await Carrier.create(res.session, req.body)
            carrier = data

            if (carrier) await company.update({ locked: true })
        } else {
            const { mc, usdot, scac, irp, efs, fleetOne, transflo, ifta, stateTax } = req.body
            await carrier.update({ mc, usdot, scac, irp, efs, fleetOne, transflo })
            await carrier.update('ifta', ifta, { since })
            await carrier.update('stateTax', stateTax)
        }

        res.redirect(source .company[2] + carrier._companyId)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



router.post('/update/user/condition', User.mw.verify, [ UserForm.condition.validate() ], validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        const user = await User.fetch(res.session, { _id })
        if (!user) throw new Error('User not found')

        let { condition } = req.body
        if (condition === 'L') condition = 'I'

        await user.update({ condition })

        res.redirect(source.user[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/team/profile', User.mw.verify, User.mw.superAdminOnly, TeamForm.validate('profile'), validationCheck, async (req, res) => {
    try {
        const { _id } = req.body
        delete req.body._id

        const team = await Team.fetch(res.session, { _id })
        if (!team) throw new Error('Team not found')

        await team[team.profile ? 'update' : 'add']('profile', req.body)

        res.redirect(source.team[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/team/settings', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id, settings } = req.body
        delete req.body._id

        const team = await Team.fetch(res.session, { _id })
        if (!team) throw new Error('Team not found')

        await team.settings(req.body)

        res.redirect(source.team[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company/:_id', User.mw.verify, User.mw.superAdminOnly, CompanyForm.validate(), validationCheck, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id }, { hideSensitive: false })
        if (!company) throw new Error('Company not found')

        const { since, ein, duns, busName, coType, alias, website, _match: match } = req.body

        await company.update({ since, ein, duns, website })
        await company.update('names', { since, busName, coType, alias }, match)

        res.redirect(source .company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company/:_id/static', User.mw.verify, User.mw.superAdminOnly, CompanyForm.validate('static'), validationCheck, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id }, { hideSensitive: false })
        if (!company) throw new Error('Company not found')

        await company.update(req.body)

        const category = Company.list.category[company.category].path[1]
        const { route } = company

        res.redirect(`/business/${category}/${route}/management`)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company/:_id/:action/:step', User.mw.verify, User.mw.superAdminOnly, dynamicValidator.companies, validationCheck, async (req, res) => {
    //! THIS MAY ONLY WORK WITH INITIAL VALUES
    try {
        const { _id, action, step } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        const { since = company.since, _match: match = { since: company.since } } = req.body
        delete req.body._match

        switch (step) {

            case 'ownership':
                const { _ownerId: _id } = req.body
                const owner = await Owner.fetch(res.session, { _id })
                if (!owner) throw new Error('Company owner not found')

                const ownerId = owner.id

                if (action === 'update') await company.delete('ownerships', match)
                await company.add('ownerships', { ownerId, since })
                break

            case 'address':
                if (action === 'add') {
                    if (!req.body.physical.since) req.body.physical.since = company.since

                    if (req.body?.mail?.zip) {
                        req.body.physical.mail = false

                        if (!req.body.mail.since) req.body.mail.since = company.since //? may be just use since constant
                        await company.add('mail', req.body.mail)
                    }
                    await company.add('addresses', req.body.physical)
                } else {
                    if (!req.body?.mail?.zip) {
                        req.body.physical.mail = true
                        await company.delete('mail', match)
                    } else if (!company.address?.mail?.zip) {
                        req.body.physical.mail = false

                        if (!req.body.mail.since) req.body.mail.since = company.since
                        await company.add('mail', req.body.mail)
                    } else await company.update('mail', req.body.mail, match)

                    await company.update('addresses', req.body.physical, match)
                }
                break

            case 'contacts':
                const { phone, fax, email } = req.body
                if (action === 'add') {
                    await company.add('phones', { phone, since })
                    if (fax) await company.add('faxes', { fax, since })
                    if (email) await company.add('emails', { email, since })
                } else {
                    await company.update('phones', { phone }, match)

                    if (!fax) await company.delete('faxes', match)
                    else if (!company.fax) await company.add('faxes', { fax, since })
                    else await company.update('faxes', { fax }, match)

                    if (!email) await company.delete('emails', match)
                    else if (!company.email) await company.add('emails', { email, since })
                    else await company.update('emails', { email }, match)
                }
                break

        }

        res.redirect(source .company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/update/company-owner/add/name', User.mw.verify, User.mw.superAdminOnly, OwnerForm.validate('name'), validationCheck, async (req, res) => {
    try {
        const { company: _companyId } = req.query
        const { _id } = req.body
        delete req.body._id

        const owner = await Owner.fetch(res.session, { _id })
        if (!owner) throw new Error('Owner not found')

        await owner.add('names', req.body)

        res.redirect(_companyId ? source.company[2] + _companyId : source['company-owner'][1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== DELETE ROUTES ==== //


router.post('/delete/:src/:_id?', User.mw.verify, async (req, res) => {
    try {
        const { src } = req.params
        if (src !== 'user' && res.session.user.status === 'A')
            throw new Error('Access to this path is granted to Super Admin only<br><a href="/">Home</a>')

        let { _id } = req.params
        if (!_id) ({ _id } = req.body)
        if (!_id) throw new Error('Identifier not supplied')

        const [ Src, redirUrl ] = source[src]

        const inst = await Src.fetch(res.session, { _id })
        if (!inst) throw new Error(`${Src.name} not found`)

        await inst.delete()

        res.redirect(redirUrl + source.ext(src, inst))
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== JX ROUTES ==== //


router.post('/jx/:src/:_id/:action/:target', User.mw.verify, async (req, res) => {
    try {
        const { src, _id, action, target } = req.params
        const { tab } = req.query
        if (src !== 'user' && res.session.user.status === 'A')
            throw new Error('Access to this path is granted to Super Admin only<br><a href="/">Home</a>')

        const url = req.get('referer') + (tab ? `?${tab}` : '') || redirUrl

        let { _ids } = req.body
        if (!_ids) return res.redirect(url)

        if (!Array.isArray(_ids)) _ids = [ _ids ]
        const [ Src, redirUrl ] = source[src]

        const inst = await Src.fetch(res.session, { _id })
        if (!inst) throw new Error(`${Src.name} not found`)

        await inst[action](`jx.${target}`, _ids)

        res.redirect(url)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== MISC ROUTES ==== //


router.post('/reset/user', User.mw.verify, async (req, res) => {
    try {
        const { _id } = req.body
    
        const user = await User.fetch(res.session, { _id })
        if (!user) throw new Error('User not found')

        await user.reset()

        res.redirect(source.user[1])
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/confirm/company/:_id', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        await company.update({ confirmed: true })

        res.redirect(source.company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/toggle/company/:_id/condition', User.mw.verify, User.mw.superAdminOnly, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        const active = !company.active
        await company.update({ active })

        res.redirect(source.company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})


router.post('/close/company/:_id', User.mw.verify, User.mw.superAdminOnly, [ CompanyForm.until.validate() ], validationCheck, async (req, res) => {
    try {
        const { _id } = req.params
        const company = await Company.fetch(res.session, { _id })
        if (!company) throw new Error('Company not found')

        await company.close(req.body.until)

        res.redirect(source.company[2] + company._id)
    } catch (err) {
        sendError.server(req, res, err)
    }
})



// ==== EXPORT ==== //

export default router