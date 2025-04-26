import moment from 'moment'

/* HTML Builders */
import { Label, Input, Select } from '../../../html/company.mjs'
import { Label as CarrierLabel, Input as CarrierInput, Select as CarrierSelect } from '../../../html/carrier.mjs'
import { Label as AddrLabel, Input as AddrInput, Select as AddrSelect } from '../../../html/address.us.mjs'
import { Label as ContactLabel, Input as ContactInput } from '../../../html/contacts.mjs'

/* Settings */
import { permits } from '../../../settings/carrier.mjs'

/* Registry */
import { formSelectors } from '../../../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../../../client/global/modules/registry/length.mjs'

/* Tools */
import Company, { Owner } from '../../../tools/core/company.mjs'
import Carrier from '../../../tools/core/carrier.mjs'
import Address from '../../../../client/global/modules/tools/core/address.us.mjs'
import escapeHTML from '../../../../client/global/modules/tools/utils/html.mjs'
import { sortObjectByValue } from '../../../../client/global/modules/tools/utils/sorter.mjs'
                //! TEMP
                import { formLabel, formInput } from '../../../../client/global/modules/tools/utils/html/form.mjs'
import { ein as formatEin, duns as formatDuns, tel as formatTel } from '../../../../client/global/modules/tools/utils/formatter.mjs'
import { respond404 } from '../../../tools/utils/response.mjs'
import { button as formButton } from '../../../../client/global/modules/tools/utils/html/components.mjs'

/* Forms */
import { updateFormOptions } from '../../../tools/form/builder.mjs'
import CompanyForm, { OwnerForm } from '../../../tools/form/company.mjs'

/* Assets */
import { labelClass, labelClassRequired } from '../assets.mjs'

const throwErr = require('../../../tools/utils/error').data

const url = {
    company: '/business/company/',
    companies: '/business/companies',
    owners: '/business/company-owners',
}
const errMsg = {
    company: `Server Internal Error: Company not found<br/><a href="${url.companies}">Back to Companies</a>`,
    owner: `Server Internal Error: Company Owner not found<br/><a href="${url.owners}">Back to Company Owners</a>`,
}



export default class {


    static add = async (req, res) => {
        try {
            const { error, data: company } = await Company.create(res.session, req.body)
            if (error) return throwErr.server(res, error)

            res.redirect(url.company + company._id)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static modify = async (req, res) => {
        try {
            const { _id } = req.params

            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            const { catId, since, ein, duns, website, busName, coType, alias } = req.body
            let error

            ({ error } = await company.modify(res.session, 'companies', { catId, since, ein, duns, website }))
            if (!error)
               ({ error } = await company.modify(res.session, 'names', { busName, coType, alias }))
            if (error) return throwErr.server(res, error)

            res.redirect(url.company + company._id)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static update = async (req, res) => { // name
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.params
            const { alias } = req.body

            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            if (alias != company.alias)
                return throwErr.server(res, `Request Error: Incorrect confirmation alias<br/><a href="${url.companies}">Back to Companies</a>`)

            const { error } = await company.delete(res.session)
            if (error) return throwErr.server(res, error + `<a href="${url.companies}">Back to Companies</a>`)

            res.redirect(url.companies)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static confirm = async (req, res) => {
        try {
            const { _id } = req.params

            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            const { confirmed, error } = await company.confirm(res.session)
            if (error) return throwErr.server(res, error)

            let redirectUrl = url.company + company._id
            if (confirmed) {
                const { catId, route } = company
                const category = Company.categoryList[catId].path[1]

                redirectUrl = `/business/${category}/${route}`
            }

            res.redirect(redirectUrl)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertOwnership = async (req, res) => {
        try {
            const { _id } = req.params
            const { _ownerId, since } = req.body //* if `since` is undefined, company `since` will be used

            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            const owner = await Owner.data(res.session, { _id: _ownerId })
            if (!owner) return throwErr.server(res, errMsg.owner)

            const { error } = await company.delete(res.session, 'ownerships', { since })
            if (error) return throwErr.server(res, error)
            else {
                const { error } = await company.update(res.session, 'ownerships', {
                    ownerId: await owner.id(),
                    since,
                })
                if (error) return throwErr.server(res, error)
            }

            res.redirect(url.company + _id)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateOwnership = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertAddress = async (req, res) => {
        try {
            const { _id } = req.params
            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            const { body } = req
            const { address } = company
            const action = { physical: null, mail: null }
            const errors = []

            if (!address.physical.address1) {
                action.physical = 'update'
                if (body.mail?.address1) action.mail = 'update'
            } else {
                action.physical = 'modify'
                if (!address.mail.address1) {
                    if (body.mail?.address1) action.mail = 'update'
                } else {
                    if (body.mail?.address1) action.mail = 'modify'
                    else action.mail = 'delete'
                }
            }

            if (action.physical) {
                const { error } = await company[action.physical](res.session, 'addresses', body.physical)
                if (error) errors.push(error)
            }
            if (action.mail) {
                const { error } = await company[action.mail](res.session, 'mail', body.mail)
                if (error) errors.push(error)
            }

            if (errors.length) return throwErr.server(res, errors.join(' / '))

            res.redirect(url.company + _id)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateAddress = async (req, res) => {
        try {
            const { _id, type } = req.params

            //!..
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertContacts = async (req, res) => {
        try {
            const { _id } = req.params
            const company = await Company.data(res.session, { _id })
            if (!company) return throwErr.server(res, errMsg.company)

            const { body } = req
            const action = { phone: null, fax: null, email: null }
            const errors = []

            if (!company.phone) {
                action.phone = 'update'
                if (body.fax) action.fax = 'update'
                if (body.email) action.email = 'update'
            } else {
                if (body.phone != company.phone) action.phone = 'modify'
                if (!body.fax && company.fax) action.fax = 'delete'
                else if (body.fax && !company.fax) action.fax = 'update'
                else if (body.fax && company.fax && body.fax != company.fax)
                    action.fax = 'modify'
                if (!body.email && company.email) action.email = 'delete'
                else if (body.email && !company.email) action.email = 'update'
                else if (body.email && company.email && body.email != company.email)
                    action.email = 'modify'
            }

            if (action.phone) {
                const { phone: number } = body
                const { error } = await company[action.phone](res.session, 'phones', { number })
                if (error) errors.push(error)
            }
            if (action.fax) {
                const { fax: number } = body
                const { error } = await company[action.fax](res.session, 'faxes', { number })
                if (error) errors.push(error)
            }
            if (action.email) {
                const { email } = body
                const { error } = await company[action.email](res.session, 'emails', { email })
                if (error) errors.push(error)
            }

            if (errors.length) return throwErr.server(res, errors.join(' / '))

            res.redirect(url.company + _id)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateContact = async (req, res) => {
        try {
            const { _id, type } = req.params

            //!..
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateTeams = async (req, res) => {
        try {
            const { _id } = req.params
            const { action, teams: _teamIds } = req.body
            const company = await Company.data(res.session, { _id })

            const { error } = await company.teams(res.session, action, _teamIds)
            if (error) return throwErr.server(res, null, error)

            res.redirect(`/business/${Company.categoryList[company.catId].path[1]}/${company.route}?teams`)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertOwner = async (req, res) => {
        try {
            const { company: _companyId, since } = req.query
            const { _id } = req.body
            delete req.body._id

            if (!_id) {
                const { error, data: owner } = await Owner.create(res.session, req.body)
                if (error) return throwErr.server(res, error)

                if (_companyId) {
                    const company = await Company.data(res.session, { _id: _companyId })

                    const { error } = await company.delete(res.session, 'ownerships', { since })
                    if (error) return throwErr.server(res, error)
                    else {
                        const { error } = await company.update(res.session, 'ownerships', { ownerId: await owner.id(), since })
                        if (error) return throwErr.server(res, error)
                    }
                    //* `since` is undefined if owner is added at company registration
                    //* `since` must be requested via url query if owner is added at ownership update
                }
            } else {
                const owner = await Owner.data(res.session, { _id })

                const { error } = await owner.modify(res.session, req.body)
                if (error) return throwErr.server(res, error)
            }

            res.redirect(_companyId ? url.company + _companyId : url.owners)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateOwner = async (req, res) => {
        try {
            const { company: _companyId } = req.query
            const { _id } = req.body
            delete req.body._id

            const owner = await Owner.data(res.session, { _id })

            const { error } = await owner.update(res.session, req.body)
            if (error) return throwErr.server(res, error)

            res.redirect(_companyId ? url.company + _companyId : url.owners)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static deleteOwner = async (req, res) => {
        try {
            const { _id } = req.body

            const owner = await Owner.data(res.session, { _id })
            if (!owner) return throwErr.server(res, errMsg.owner)

            const { error } = await owner.delete(res.session)
            if (error) return throwErr.server(res, error + `<a href="${url.owners}">Back to Company Owners</a>`)

            res.redirect(url.owners)
        } catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static upsertOwnerPhone = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


    static updateOwnerPhone = async (req, res) => {
        try {} catch (err) {
            throwErr.server(res, null, err)
        }
    }


}


const display = (data, ein) => {
    const na = '<em class="has-text-danger has-text-weight-normal">N/A</em>'
    const display = {}
    display.data = {}
    display.label = {}

    if (ein) {
        const typeList = {}

        for (const group in Company.typeList)
            for (const type in Company.typeList[group])
                typeList[type] = Company.typeList[group][type]

        display.data.ein = formatEin(ein)
        display.data.type = typeList[data.coType]
        display.data.website = na
        if (data.website) {
            const href = `https://${data.website}`
            display.data.website = `<a href="${href}" target="_blank">${href}</a>`
        }
    }

    if (data.since) {
        display.data.since = moment(data.since).format('ll')
        display.data.duns = data.duns ? formatDuns(data.duns) : na
    }

    if (data.address)
        display.data.address = {
            physical: data.address.physical.html({ inline: false }),
            mail: data.address.mail.zip
                ? data.address.mail.html({ inline: false })
                : '<em class="has-text-grey has-text-weight-normal">Same as physical</em>',
        }

    if (data.phone) {
        display.data.phone = formatTel(data.phone)
        display.data.fax = data.fax ? formatTel(data.fax) : na
        display.data.email = data.email || na
    }

    if (data.catId == 'crr') {
        display.data.scac = data.scac || na
        display.data.irp = data.irp || na
        display.data.ifta = data.ifta || na
        display.data.iftaJur = Address.stateList[data.iftaJur]
        display.data.stateTax = {}
        display.label.stateTax = {}

        for (const state in permits) {
            display.label.stateTax[state] = permits[state].title
            display.data.stateTax[state] = na
            if (!data.stateTax) continue

            if (data.stateTax[state])
                display.data.stateTax[state] = data.stateTax[state]
        }

        display.data.efs = data.efs || na
        display.data.fleetOne = data.fleetOne || na
        display.data.transflo = data.transflo || na
    }

    return display
}


export const companyById = async (req, res) => {
    try {
        const key = 'company'
        let { hbs } = res

        /* HBS Preset */
        const { active } = hbs.nav
        hbs.nav.companies = active
        let titlePfx = 'New Company'

        /* Data Preset */
        let { _id } = req.params
        let data = { _id }
        let contentTitle = titlePfx
        const blocks = [ 'record', 'ownership', 'address', 'contacts', 'credentials', 'confirmation' ]

        /* Steps */
        const step = { segment: '', link: '', marker: '', span: '' }
        let step1 = 'Registration'
        const activeStep = {
            segment: ' is-active',
            link: ' is-link-live is-link-active',
            marker: ' is-hollow',
            span: '<i class="fas fa-pen" style="font-size: 65%;"></i>',
        }
        const completedStep = {
            ...step,
            link: ' is-link-live',
            span: '<i class="fas fa-check"></i>',
        }
        const steps = { record: activeStep }

        /* Visibility, styles */
        const hidden = ' style="display: none;"'
        const visibility = { record: '' }
        const css = {}

        /* Form */
        let catForm, options = {}, ownerOptions = {}
        const instr = { labelClass, labelClassRequired, textClass: 'input' }
        const icon = {
            select: {
                catId: '<i class="fas fa-file-circle-question"></i>',
            },
        }
        const button = { submit: {}, add: {}, edit: {}, upsert: {} }
        const saveSubmit = { style: 'is-success', content: 'Save' }
        const submitProps = {}
        const submitButton = (id, content, style) => formButton({ type: 'submit', class: `button is-fullwidth ${style}`, id, content, disabled: true })
        const actionUrl = {
            param: {
                record: '/add',
            },
            query: {},
        }

        /* Defaults */
        for (const block of blocks) {
            if (block == 'confirmation') break

            submitProps[block] = { style: 'is-link', content: 'Next' }

            if (block == 'record') continue

            steps[block] = step
            visibility[block] = hidden
        }
        let catId, since, ein, duns, busName, coType, alias, website


        /* Current Company */
        if (_id != 'new') {
            data = await Company.data(res.session, { _id })
            if (!data) return respond404(res)

            {({ _id, catId, since, duns, busName, coType, alias, website } = data)}
            ein = await data.ein(res.session)

            const { name, owner } = data
            const { _id: _ownerId } = owner
            const { icon: catIdIcon } = Company.categoryList[catId]

            step1 = 'Record'
            titlePfx = name
            contentTitle = `<span class="has-text-weight-semibold is-size-4">${escapeHTML(name)}</span>`
            contentTitle += ' &nbsp;&nbsp;<a id="delete-company-trigger"><i class="fas fa-trash-can has-text-danger is-size-6"></i></a>'

            steps.record = completedStep
            steps.ownership = activeStep
            visibility.record = hidden
            visibility.ownership = ''
            actionUrl.param.record = `/${_id}/modify`
            actionUrl.query.owner = `?company=${_id}`
            if (catIdIcon) icon.select.catId = catIdIcon
            submitProps.record = saveSubmit


            /* Current Owner */
            if (_ownerId) {
                const { address } = data
                const { address1, address2, zip, city } = address.physical
                const {
                    address1: mailAddress1,
                    address2: mailAddress2,
                    zip: mailZip,
                    city: mailCity,
                } = address.mail
                let { state } = address.physical
                let { state: mailState } = address.mail
                if (state) state = state[0]
                if (mailState) mailState = mailState[0]

                steps.ownership = completedStep
                steps.address = activeStep
                visibility.ownership = hidden
                visibility.address = ''
                submitProps.ownership = saveSubmit


                if (zip) {}


                //
            }


            {
                const { content, style } = submitProps.ownership
                const values = { confirmAlias: null, ownership: _ownerId }
                let data = {}

                const owners = await Owner.list(res.session)
                const names = []
                owners.map(owner => names.push(owner.fullName()))
                let dublicates = names.filter((name, i) => names.indexOf(name) !== i)
                dublicates = [ ...new Set(dublicates) ]

                owners.forEach((owner, i) => data[owner._id] = names[i] + (dublicates.includes(names[i]) ? ` (${owner.age})` : ''))
                data = sortObjectByValue(data)

                options = updateFormOptions(options, CompanyForm, values, { ...instr, tabs: 5 })
                options.ownership.select.input.data = data

                button.submit.ownership = submitButton('ownership-submit', content, style)
                button.add.owner = formButton({ class: 'button py-3 is-link', id: 'add-owner-trigger', content: '<i class="fas fa-plus"></i>' })
                button.edit.owner = formButton({
                    class: 'button py-3 is-primary is-dark',
                    id: 'edit-owner-trigger',
                    content: '<i class="fas fa-pen"></i>',
                    disabled: _ownerId === null,
                })

                const fields = [
                    'firstName', 'middleName',
                    'lastName', 'suffix', 'nameSince',
                    'gender', 'dob', 'ssn', 'phone',
                ]
                ownerOptions = updateFormOptions({}, OwnerForm, fields, { ...instr, tabs: 7 })
            }
        }


        /* Record HBS Form & Submit */
        {
            const { content, style } = submitProps.record
            const values = { catId, since, ein, duns, busName, coType, alias, website }

            options = updateFormOptions(options, CompanyForm, values, { ...instr, tabs: 5 })
            button.submit.record = submitButton('record-submit', content, style)
        }

        /* Final Polish */
        if (data.catId == 'crr')
            css.card = {
                minHeight: '455px',
            }
        if (data.name) {
            data.name = escapeHTML(data.name)
            data.alias = escapeHTML(data.alias)
            if (data.owner.name) data.owner.name = escapeHTML(data.owner.name)
        }

        /* HBS Setup */
        hbs = hbs.set(key, { titlePfx })
        hbs._id = _id
        hbs.actionUrl = actionUrl
        hbs.data = data
        hbs.display = display(data, ein)
        hbs.contentTitle = contentTitle
        hbs.steps = steps
        hbs.step1 = step1
        hbs.visibility = visibility
        hbs.css = css
        hbs.form = new CompanyForm(options)
        hbs.ownerForm = new OwnerForm(ownerOptions)
        hbs.catForm = catForm
        hbs.icon = icon
        hbs.button = button

        res.render(key, hbs)

    } catch (err) {
        throwErr.server(res, null, err)
    }
}


export const companyById_OLD = async (req, res) => {
    try {
        // const key = 'company'
        // let { hbs } = res

        // /* HBS Preset */
        // const { active } = hbs.nav
        // hbs.nav.companies = active
        // let titlePfx = 'New Company'

        // /* Data Preset */
        // let { _id } = req.params
        // let data = { _id }
        // let contentTitle = titlePfx
        // const blocks = [ 'record', 'ownership', 'address', 'contacts', 'credentials', 'confirmation' ]

        // /* Steps */
        // const step = { segment: '', link: '', marker: '', span: '' }
        // let step1 = 'Registration'
        // const activeStep = {
        //     segment: ' is-active',
        //     link: ' is-link-live is-link-active',
        //     marker: ' is-hollow',
        //     span: '<i class="fas fa-pen" style="font-size: 65%;"></i>',
        // }
        // const completedStep = {
        //     ...step,
        //     link: ' is-link-live',
        //     span: '<i class="fas fa-check"></i>',
        // }
        // const steps = { record: activeStep }

        // /* Visibility, styles */
        // const hidden = ' style="display: none;"'
        // const visibility = { record: '' }
        // const css = {}

        // /* Form */
        const label = {}, input = { current: {} }, select = {}
        // const icon = {
        //     select: {
        //         catId: '<i class="fas fa-file-circle-question"></i>',
        //     },
        // }
        // const button = { submit: {}, add: {}, edit: {}, upsert: {} }
        // const saveSubmit = { style: 'is-success', content: 'Save' }
        // const submitProps = {}
        // const submitButton = (id, content, style) => formButton({ type: 'submit', class: `button is-fullwidth ${style}`, id, content, disabled: true })
        // const actionUrl = {
        //     param: {
        //         record: '/add',
        //     },
        //     query: {},
        // }

        // /* Defaults */
        // for (const block of blocks) {
        //     if (block == 'confirmation') break

        //     submitProps[block] = { style: 'is-link', content: 'Next' }

        //     if (block == 'record') continue

        //     steps[block] = step
        //     visibility[block] = hidden
        // }
        // let catId, since, ein, duns, busName, coType, alias, website


        /* Current Company */
        if (_id != 'new') {
            // data = await Company.data(res.session, { _id })
            // if (!data) return respond404(res)

            // {({ _id, catId, since, duns, busName, coType, alias, website } = data)}
            // ein = await data.ein(res.session)

            // const { name, owner } = data
            // const { _id: _ownerId } = owner
            // const { icon: catIdIcon } = Company.categoryList[catId]

            // step1 = 'Record'
            // titlePfx = name
            // contentTitle = `<span class="has-text-weight-semibold is-size-4">${escapeHTML(name)}</span>`
            // contentTitle += ' &nbsp;&nbsp;<a id="delete-company-trigger"><i class="fas fa-trash-can has-text-danger is-size-6"></i></a>'

            // steps.record = completedStep
            // steps.ownership = activeStep
            // visibility.record = hidden
            // visibility.ownership = ''
            // actionUrl.param.record = `/${_id}/modify`
            // actionUrl.query.owner = `?company=${_id}`
            // if (catIdIcon) icon.select.catId = catIdIcon
            // submitProps.record = saveSubmit


            /* Current Owner */
            if (_ownerId) {
                const { address } = data
                const { address1, address2, zip, city } = address.physical
                const {
                    address1: mailAddress1,
                    address2: mailAddress2,
                    zip: mailZip,
                    city: mailCity,
                } = address.mail
                let { state } = address.physical
                let { state: mailState } = address.mail
                if (state) state = state[0]
                if (mailState) mailState = mailState[0]

                steps.ownership = completedStep
                steps.address = activeStep
                visibility.ownership = hidden
                visibility.address = ''
                submitProps.ownership = saveSubmit


                if (zip) {
                    const { phone, fax, email } = data

                    steps.address = completedStep
                    steps.contacts = activeStep
                    visibility.address = hidden
                    visibility.contacts = ''
                    submitProps.address = saveSubmit


                    if (phone) {
                        steps.contacts = completedStep
                        visibility.contacts = hidden
                        submitProps.contacts = saveSubmit

                        switch (catId) {


                            case 'crr':
                                data = await Carrier.data(res.session, { _companyId: _id })
                                if (!data) return respond404(res)

                                const {
                                    mc, usdot, scac, irp,
                                    ifta, iftaJur, stateTax,
                                    efs, fleetOne, transflo
                                } = data

                                steps.credentials = activeStep
                                visibility.credentials = ''

                                if (mc && usdot) {
                                    steps.credentials = completedStep
                                    steps.confirmation = activeStep
                                    visibility.credentials = hidden
                                    submitProps.credentials = saveSubmit
                                }

                                label.carrier = {
                                    mc: CarrierLabel.mc({ class: labelClassRequired }),
                                    usdot: CarrierLabel.usdot({ class: labelClassRequired }),
                                    scac: CarrierLabel.scac({ class: labelClass }),
                                    ifta: CarrierLabel.ifta({ class: labelClass }),
                                    iftaJur: CarrierLabel.iftaJur({ class: labelClass }),
                                    irp: CarrierLabel.irp({ class: labelClass }),
                                    efs: CarrierLabel.efs({ class: labelClass }),
                                    fleetOne: CarrierLabel.fleetOne({ class: labelClass }),
                                    transflo: CarrierLabel.tranflo({ class: labelClass }),
                                    permit: {},
                                }

                                input.carrier = {
                                    current: {
                                        mc: CarrierInput.mc({ value: mc }, true),
                                        usdot: CarrierInput.usdot({ value: usdot }, true),
                                        scac: CarrierInput.scac({ value: scac }, true),
                                        ifta: CarrierInput.ifta({ value: ifta }, true),
                                        irp: CarrierInput.irp({ value: irp }, true),
                                        efs: CarrierInput.efs({ value: efs }, true),
                                        fleetOne: CarrierInput.fleetOne({ value: fleetOne }, true),
                                        transflo: CarrierInput.transflo({ value: transflo }, true),
                                    },
                                    mc: CarrierInput.mc({ class: 'input', value: mc }),
                                    usdot: CarrierInput.usdot({ class: 'input', value: usdot }),
                                    scac: CarrierInput.scac({ class: 'input', value: scac }),
                                    ifta: CarrierInput.ifta({ class: 'input', value: ifta }),
                                    irp: CarrierInput.irp({ class: 'input', value: irp }),
                                    efs: CarrierInput.efs({ class: 'input', value: efs }),
                                    fleetOne: CarrierInput.fleetOne({ class: 'input', value: fleetOne }),
                                    transflo: CarrierInput.transflo({ class: 'input', value: transflo }),
                                    permit: { current: {} },
                                }

                                for (const state in inputLength.carrier.permit.max) {
                                    let value
                                    if (stateTax) value = stateTax[state]

                                    label.carrier.permit[state] = CarrierLabel.permit(state, { class: labelClass })
                                    input.carrier.permit[state] = CarrierInput.permit(state, { class: 'input', value })
                                    input.carrier.permit.current[state] = CarrierInput.permit(state, { value }, true)
                                }

                                select.carrier = {
                                    iftaJur: CarrierSelect.iftaJur({
                                        tabs: 5,
                                        value: iftaJur || state,
                                        options: { valOpt: false },
                                    }),
                                }

                                button.upsert.statePermits = formButton({
                                    class: 'button is-primary',
                                    content: 'State Permits',
                                })

                                {
                                    const { style, content } = submitProps.credentials
                                    button.submit.credentials = submitButton('credentials-submit', content, style)
                                }

                                break


                            default:
                                steps.confirmation = activeStep
                        }

                    }


                    /* Contacts HBS Form */
                    const { phoneId, faxId, emailId } = formSelectors.company
                    /* Label */
                    label.phone = ContactLabel.tel('phone', { class: labelClassRequired, addClass: 'required', for: phoneId })
                    label.fax = ContactLabel.tel('fax', { class: labelClass, for: faxId })
                    label.email = ContactLabel.email({ class: labelClass, for: emailId })
                    /* Input/Select */
                    input.phone = ContactInput.tel('phone', { class: 'input', type: 'text', id: phoneId, value: phone, required: true })
                    input.fax = ContactInput.tel('fax', { class: 'input', type: 'text', id: faxId, value: fax })
                    input.email = ContactInput.email({ class: 'input', id: emailId, value: email })
                    {
                        const { style, content } = submitProps.contacts
                        button.submit.contacts = submitButton('contacts-submit', content, style)
                    }

                }


                /* Address HBS Form */
                const { addr1Id, addr2Id, zipId, cityId, stateId } = formSelectors.company
                /* Label */
                label.address1 = AddrLabel.address1({ class: labelClassRequired, for: addr1Id })
                label.address2 = AddrLabel.address2({ class: labelClass, for: addr2Id }, true)
                label.zip = AddrLabel.zip({ class: labelClassRequired, for: zipId })
                label.city = AddrLabel.city({ class: labelClassRequired, for: cityId })
                label.state = AddrLabel.state({ class: labelClassRequired, for: stateId })
                label.country = formLabel({
                    content: 'Country',
                    class: labelClass,
                })
                /* Input/Select */
                input.address1 = AddrInput.address1({ class: 'input', id: addr1Id, value: address1 }, false)
                input.address2 = AddrInput.address2({ class: 'input', id: addr2Id, value: address2 }, false)
                input.zip = AddrInput.zip({ class: 'input', id: zipId, value: zip }, false)
                input.city = AddrInput.city({ class: 'input', id: cityId, value: city }, false)
                select.state = AddrSelect.stateUS({ tabs: 7, id: stateId, value: state, options: { emptyOpt: '--' } }, false)
                input.country = formInput({
                    class: 'input',
                    value: 'United States',
                    readOnly: true,
                })
                {
                    const { mailStatusId, mailAddr1Id, mailAddr2Id, mailZipId, mailCityId, mailStateId } = formSelectors.company
                    const disabled = !mailAddress1
                    input.mailAddress = formInput({
                        type: 'checkbox',
                        id: mailStatusId,
                        checked: !(!mailAddress1),
                    })
                    /* Label */
                    label.mailAddress1 = AddrLabel.address1({ class: labelClassRequired, for: mailAddr1Id }, true)
                    label.mailAddress2 = AddrLabel.address2({ class: labelClass, for: mailAddr2Id }, true)
                    label.mailZip = AddrLabel.zip({ class: labelClassRequired, for: mailZipId })
                    label.mailCity = AddrLabel.city({ class: labelClassRequired, for: mailCityId })
                    label.mailState = AddrLabel.state({ class: labelClassRequired, for: mailStateId })
                    /* Input/Select */
                    input.mailAddress1 = AddrInput.address1({ class: 'input', id: mailAddr1Id, value: mailAddress1, disabled }, true)
                    input.mailAddress2 = AddrInput.address2({ class: 'input', id: mailAddr2Id, value: mailAddress2, disabled }, true)
                    input.mailZip = AddrInput.zip({ class: 'input', id: mailZipId, value: mailZip, disabled }, true)
                    input.mailCity = AddrInput.city({ class: 'input', id: mailCityId, value: mailCity, disabled }, true)
                    select.mailState = AddrSelect.stateUS({ tabs: 7, id: mailStateId, value: mailState, disabled, options: { emptyOpt: '--' } }, true)
                }
                {
                    const { style, content } = submitProps.address
                    button.submit.address = submitButton('address-submit', content, style)
                }

            }


            /* Deletion HBS Form */
            // const { id: companyId, aliasId } = formSelectors.company
            // input.deleteId = Input.id(_id, { id: `delete-${companyId}` })
            // input.confirmAlias = CompanyForm.confirmAlias.text.input({ class: 'input' })

            /* Ownership HBS Form */
            input.current.ownership = Input.ownership({ value: _ownerId })
            // label.ownership = Label.ownership({ class: labelClassRequired })
            // select.ownership = await Select.ownership({ tabs: 5, value: _ownerId, options: { emptyOpt: '--' } })
            // button.add.owner = formButton({ class: 'button py-3 is-link', id: 'add-owner-trigger', content: '<i class="fas fa-plus"></i>' })
            // button.edit.owner = formButton({
            //     class: 'button py-3 is-primary is-dark',
            //     id: 'edit-owner-trigger',
            //     content: '<i class="fas fa-pen"></i>',
            //     disabled: _ownerId === null,
            // })
            // {
            //     const { content, style } = submitProps.ownership
            //     button.submit.ownership = submitButton('ownership-submit', content, style)
            // }

            /* Owner HBS Form */
            /* Current */
            // input.current.ownerId = Input.ownerId()
            // input.current.ownerSsn = Input.ownerSsn({}, true)
            // /* Label */
            // label.ownerUpdateSince = Label.ownerUpdateSince({ class: labelClassRequired })
            // label.ownerFirstName = Label.ownerName('f', { class: labelClassRequired })
            // label.ownerMiddleName = Label.ownerName('m', { class: labelClass })
            // label.ownerLastName = Label.ownerName('l', { class: labelClassRequired })
            // label.ownerSuffix = Label.ownerName('s', { class: labelClass })
            // label.ownerGender = Label.ownerGender({ class: labelClass })
            // label.ownerDob = Label.ownerDob({ class: labelClassRequired })
            // label.ownerSsn = Label.ownerSsn({ class: labelClass })
            // /* Input/Select */
            // input.ownerUpdateSince = Input.ownerUpdateSince({ class: 'input'} )
            // input.ownerFirstName = Input.ownerName('f', { class: 'input' })
            // input.ownerMiddleName = Input.ownerName('m', { class: 'input' })
            // input.ownerLastName = Input.ownerName('l', { class: 'input' })
            // select.ownerSuffix = Select.ownerSuffix({ tabs: 7, options: { emptyOpt: '--' } })
            // select.ownerGender = Select.ownerGender({ tabs: 7, options: { emptyOpt: '--' } })
            // input.ownerDob = Input.ownerDob({ class: 'input' })
            // input.ownerSsn = Input.ownerSsn({ class: 'input' })

        }


        // /* Record HBS Form */
        // /* Current */
        // input.current.since = Input.since({ value: since }, true)
        // input.current.busName = Input.busName({ value: busName }, true)
        // input.current.coType = Input.coType({ value: coType })
        // input.current.alias = Input.alias({ value: alias }, true)
        // input.current.ein = Input.ein({ value: ein }, true)
        // input.current.duns = Input.duns({ value: duns }, true)
        // /* Label */
        // label.catId = Label.catId({ class: labelClassRequired })
        // label.since = Label.since({ class: labelClassRequired })
        // label.ein = Label.ein({ class: labelClassRequired })
        // label.duns = Label.duns({ class: labelClass })
        // label.busName = Label.busName({ class: labelClassRequired })
        // label.coType = Label.coType({ class: labelClassRequired })
        // label.alias = Label.alias({ class: labelClassRequired })
        // label.website = Label.website({ class: labelClass })
        // /* Input/Select */
        // select.catId = Select.catId({ tabs: 5, value: catId, options: { emptyOpt: '--' } })
        // input.since = Input.since({ class: 'input', value: since })
        // input.ein = Input.ein({ class: 'input', value: ein })
        // input.duns = Input.duns({ class: 'input', value: duns })
        // input.busName = Input.busName({ class: 'input', value: busName })
        // select.coType = Select.coType({ tabs: 5, value: coType, options: { emptyOpt: '--' } })
        // input.alias = Input.alias({ class: 'input', value: alias })
        // input.website = Input.website({ class: 'input', value: website })
        // /* Submit */
        // {
        //     const { content, style } = submitProps.record
        //     button.submit.record = submitButton('record-submit', content, style)
        // }

        // if (data.catId == 'crr')
        //     css.card = {
        //         minHeight: '455px',
        //     }
        // if (data.name) {
        //     data.name = escapeHTML(data.name)
        //     data.alias = escapeHTML(data.alias)
        //     if (data.owner.name) data.owner.name = escapeHTML(data.owner.name)
        // }

        // /* HBS Setup */
        // hbs = hbs.set(key, { titlePfx })
        // hbs._id = _id
        // hbs.actionUrl = actionUrl
        // hbs.data = data
        // hbs.display = display(data, ein)
        // hbs.contentTitle = contentTitle
        // hbs.steps = steps
        // hbs.step1 = step1
        // hbs.visibility = visibility
        // hbs.css = css
        // hbs.label = label
        // hbs.input = input
        // hbs.select = select
        // hbs.icon = icon
        // hbs.button = button

        // res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}


export const companyByCategoryAndRoute = async (req, res) => {
    try {
        const { category, route } = req.params
        let company = await Company.data(res.session, { route })
        const { _id: _companyId, catId } = company
        const ein = await company.ein(res.session)

        if (!company) return respond404(res)
        if (category != Company.categoryList[catId].path[1])
            return respond404(res)

        const css = {}

        switch (catId) {

            case 'crr':
                company = await Carrier.data(res.session, { _companyId })
                css.card = { minHeight: '455px' }
                css.multiSelect = { minHeight: '310px' }
                break

        }

        company.name = escapeHTML(company.name)
        company.alias = escapeHTML(company.alias)
        company.owner.name = escapeHTML(company.owner.name)

        const icon = Company.categoryList[catId].icon
        let cardTitle = company.name
        if (icon) cardTitle = `${icon}&nbsp;&nbsp;${cardTitle}`

        const key = 'company'
        let { hbs } = res
        hbs = hbs.set(key, { titlePfx: company.name })

        const { active } = hbs.nav
        hbs.nav.companies = active

        hbs._id = _companyId
        hbs.cardTitle = cardTitle
        hbs.data = company
        hbs.input = input
        hbs.display = display(company, ein)
        hbs.css = css
        hbs.form = {
            confirmAlias: {
                text: {
                    input: CompanyForm.confirmAlias.text.input({ class: 'input' }),
                },
            },
        }
        hbs.display.status = company.active
            ? 'Active'
            : '<i class="has-text-danger">Inactive</i>'
        hbs.display.statusTrigger = company.active ? 'Deactivate' : 'Activate'

        res.render(key, hbs)
    } catch (err) {
        throwErr.server(res, null, err)
    }
}