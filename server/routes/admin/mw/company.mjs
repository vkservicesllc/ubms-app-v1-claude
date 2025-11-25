require('dotenv').config({ path: '../../../.env' })
const { DIR__PATH: dir } = process.env


import moment from 'moment'

/* Tools */
import Company, { Owner } from '../../../tools/core/company.mjs'
import Carrier from '../../../tools/core/carrier.mjs'
import Address from '../../../../client/global/modules/tools/core/address.us.mjs'
import escapeHTML from '../../../../client/global/modules/tools/utils/html.mjs'
import { ein as formatEin, duns as formatDuns, tel as formatTel } from '../../../../client/global/modules/tools/utils/formatter.mjs'
import { respond404 } from '../../../tools/utils/response.mjs'
import { getFiles } from '../../../tools/utils/fs.mjs'
import { button as formButton } from '../../../../client/global/modules/tools/utils/html/components.mjs'
import { sortObjectByValue } from '../../../../client/global/modules/tools/utils/sorter.mjs'

/* Forms */
import { updateFormOptions } from '../../../tools/form/builder.mjs'
import CompanyForm, { OwnerForm } from '../../../tools/form/company.mjs'
import CarrierForm from '../../../tools/form/carrier.mjs'

/* Assets */
import { labelClass, labelClassRequired } from '../assets.mjs'
import { addrBook } from '../../../../config.mjs'

const sendError = require('../../../tools/utils/error')

const url = {
    company: '/business/company/',
    companies: '/business/companies',
    owners: '/business/company-owners',
}
const errMsg = {
    company: `Server Internal Error: Company not found<br/><a href="${url.companies}">Back to Companies</a>`,
    owner: `Server Internal Error: Company Owner not found<br/><a href="${url.owners}">Back to Company Owners</a>`,
}

const permits = Carrier.list.permit



export default class {


    static add = async (req, res) => {
        try {
            const company = await Company.create(res.session, req.body)

            res.redirect(url.company + company._id)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static modify = async (req, res) => {
        try {
            const { _id } = req.params

            const company = await Company.fetch(res.session, { _id })
            if (!company) return sendError.server(req, res, errMsg.company)

            const { category, since, ein, duns, website, busName, coType, alias } = req.body
            let error

            ({ error } = await company.modify(res.session, 'companies', { category, since, ein, duns, website }))
            if (!error)
               ({ error } = await company.modify(res.session, 'names', { busName, coType, alias }))
            if (error) return sendError.server(req, res, error)

            res.redirect(url.company + company._id)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static update = async (req, res) => { // name
        try {} catch (err) {
            sendError.server(req, res, err)
        }
    }


    static delete = async (req, res) => {
        try {
            const { _id } = req.params
            const { alias } = req.body

            const company = await Company.fetch(res.session, { _id })
            if (!company) return sendError.server(req, res, errMsg.company)

            if (alias !== company.alias)
                return sendError.server(req, res, `Request Error: Incorrect confirmation alias<br/><a href="${url.companies}">Back to Companies</a>`)

            const { error } = await company.delete(res.session)
            if (error) return sendError.server(req, res, error + `<a href="${url.companies}">Back to Companies</a>`)

            res.redirect(url.companies)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static confirm = async (req, res) => {
        try {
            const { _id } = req.params

            const company = await Company.fetch(res.session, { _id })
            if (!company) return sendError.server(req, res, errMsg.company)

            const { confirmed, error } = await company.confirm(res.session)
            if (error) return sendError.server(req, res, error)

            let redirectUrl = url.company + company._id
            if (confirmed) {
                const { category, route } = company

                redirectUrl = `/business/${Company.list.category[category].path[1]}/${route}`
            }

            res.redirect(redirectUrl)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static upsertOwnership = async (req, res) => {
        try {
            const { _id } = req.params
            const { _ownerId, since } = req.body //* if `since` is undefined, company `since` will be used

            const company = await Company.fetch(res.session, { _id })
            if (!company) return sendError.server(req, res, errMsg.company)

            const owner = await Owner.fetch(res.session, { _id: _ownerId })
            if (!owner) return sendError.server(req, res, errMsg.owner)

            const { error } = await company.delete(res.session, 'ownerships', { since })
            if (error) return sendError.server(req, res, error)
            else {
                const { error } = await company.update(res.session, 'ownerships', {
                    ownerId: await owner.id(),
                    since,
                })
                if (error) return sendError.server(req, res, error)
            }

            res.redirect(url.company + _id)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static updateOwnership = async (req, res) => {
        try {} catch (err) {
            sendError.server(req, res, err)
        }
    }


    static upsertAddress = async (req, res) => {
        try {
            const { _id } = req.params
            const company = await Company.fetch(res.session, { _id })
            if (!company) return sendError.server(req, res, errMsg.company)

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

            if (errors.length) return sendError.server(req, res, errors.join(' / '))

            res.redirect(url.company + _id)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static updateAddress = async (req, res) => {
        try {
            const { _id, type } = req.params

            //!..
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static upsertContacts = async (req, res) => {
        try {
            const { _id } = req.params
            const company = await Company.fetch(res.session, { _id })
            if (!company) return sendError.server(req, res, errMsg.company)

            const { body } = req
            const action = { phone: null, fax: null, email: null }
            const errors = []

            if (!company.phone) {
                action.phone = 'update'
                if (body.fax) action.fax = 'update'
                if (body.email) action.email = 'update'
            } else {
                if (body.phone !== company.phone) action.phone = 'modify'
                if (!body.fax && company.fax) action.fax = 'delete'
                else if (body.fax && !company.fax) action.fax = 'update'
                else if (body.fax && company.fax && body.fax !== company.fax)
                    action.fax = 'modify'
                if (!body.email && company.email) action.email = 'delete'
                else if (body.email && !company.email) action.email = 'update'
                else if (body.email && company.email && body.email !== company.email)
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

            if (errors.length) return sendError.server(req, res, errors.join(' / '))

            res.redirect(url.company + _id)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static updateContact = async (req, res) => {
        try {
            const { _id, type } = req.params

            //!..
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static updateUsers = async (req, res) => {
        try {
            const { _id } = req.params
            const { action, users: _userIds } = req.body
            const company = await Company.fetch(res.session, { _id })

            const { error } = await company.relationship(res.session, 'users', action, _userIds)
            if (error) return sendError.server(req, res, null, error)

            res.redirect(`/business/${Company.list.category[company.category].path[1]}/${company.route}?users`)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    // static updateTeams = async (req, res) => {
    //     try {
    //         const { _id } = req.params
    //         const { action, teams: _teamIds } = req.body
    //         const company = await Company.fetch(res.session, { _id })

    //         const { error } = await company.relationship(res.session, 'teams', action, _teamIds)
    //         if (error) return sendError.server(req, res, null, error)

    //         res.redirect(`/business/${Company.list.category[company.category].path[1]}/${company.route}?teams`)
    //     } catch (err) {
    //         sendError.server(req, res, err)
    //     }
    // }


    static upsertOwner = async (req, res) => {
        try {
            const { company: _companyId, since } = req.query
            const { _id } = req.body
            delete req.body._id

            if (!_id) {
                const { error, data: owner } = await Owner.create(res.session, req.body)
                if (error) return sendError.server(req, res, error)

                if (_companyId) {
                    const company = await Company.fetch(res.session, { _id: _companyId })

                    const { error } = await company.delete(res.session, 'ownerships', { since })
                    if (error) return sendError.server(req, res, error)
                    else {
                        const { error } = await company.update(res.session, 'ownerships', { ownerId: await owner.id(), since })
                        if (error) return sendError.server(req, res, error)
                    }
                    //* `since` is undefined if owner is added at company registration
                    //* `since` must be requested via url query if owner is added at ownership update
                }
            } else {
                const owner = await Owner.fetch(res.session, { _id })

                const { error } = await owner.modify(res.session, req.body)
                if (error) return sendError.server(req, res, error)
            }

            res.redirect(_companyId ? url.company + _companyId : url.owners)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static updateOwner = async (req, res) => {
        try {
            const { company: _companyId } = req.query
            const { _id } = req.body
            delete req.body._id

            const owner = await Owner.fetch(res.session, { _id })

            const { error } = await owner.update(res.session, req.body)
            if (error) return sendError.server(req, res, error)

            res.redirect(_companyId ? url.company + _companyId : url.owners)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static deleteOwner = async (req, res) => {
        try {
            const { _id } = req.body

            const owner = await Owner.fetch(res.session, { _id })
            if (!owner) return sendError.server(req, res, errMsg.owner)

            const { error } = await owner.delete(res.session)
            if (error) return sendError.server(req, res, error + `<a href="${url.owners}">Back to Company Owners</a>`)

            res.redirect(url.owners)
        } catch (err) {
            sendError.server(req, res, err)
        }
    }


    static upsertOwnerPhone = async (req, res) => {
        try {} catch (err) {
            sendError.server(req, res, err)
        }
    }


    static updateOwnerPhone = async (req, res) => {
        try {} catch (err) {
            sendError.server(req, res, err)
        }
    }


}


const display = (data, ein) => {
    const na = '<em class="has-text-danger has-text-weight-normal">N/A</em>'
    const display = {}
    display.data = {}
    display.label = {}

    const typeList = {}
    for (const group in Company.list.type)
        for (const type in Company.list.type[group])
            typeList[type] = Company.list.type[group][type]
    display.data.type = typeList[data.coType]

    display.data.ein = formatEin(ein) || na

    display.data.website = na
    if (data.website) {
        const href = `https://${data.website}`
        display.data.website = `<a href="${href}" target="_blank">${href}</a>`
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

    if (data.category === 'crr') {
        display.data.scac = data.scac || na
        display.data.irp = data.irp || na
        display.data.ifta = data.ifta || na
        display.data.iftaJur = Address.list.state[data.iftaJur]
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
                category: '<i class="fas fa-file-circle-question"></i>',
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
            if (block === 'confirmation') break

            submitProps[block] = { style: 'is-link', content: 'Next' }

            if (block === 'record') continue

            steps[block] = step
            visibility[block] = hidden
        }
        let category, since, ein, duns, busName, coType, alias, website
        const checked = { mailAddress: '' }


        /* Current Company */
        if (_id !== 'new') {
            data = await Company.fetch(res.session, { _id })
            if (!data) return respond404(res)

            {({ _id, category, since, ein, duns, busName, coType, alias, website } = data)}

            const { name, owner } = data
            const { _id: _ownerId } = owner
            const { icon: catIdIcon } = Company.list.category[category]

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
            if (catIdIcon) icon.select.category = catIdIcon
            submitProps.record = saveSubmit


            /* Current Owner */
            if (_ownerId) {
                const { address } = data
                const { address1, address2, zip: addrZip, city: addrCity } = address.physical
                const {
                    address1: mailAddress1,
                    address2: mailAddress2,
                    zip: mailAddrZip,
                    city: mailAddrCity,
                } = address.mail
                let { state: addrState } = address.physical
                let { state: mailAddrState } = address.mail
                if (addrState) addrState = addrState[0]
                if (mailAddrState) mailAddrState = mailAddrState[0]

                steps.ownership = completedStep
                steps.address = activeStep
                visibility.ownership = hidden
                visibility.address = ''
                visibility.mailAddress = hidden
                submitProps.ownership = saveSubmit


                if (addrZip) {
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

                        let catOptions = {}


                        switch (category) {


                            case 'crr':
                                data = await Carrier.fetch(res.session, { _companyId: _id })
                                if (!data) return respond404(res)

                                const {
                                    mc, usdot, scac, irp,
                                    ifta, iftaJur, stateTax,
                                    efs, fleetOne, transflo,
                                } = data

                                steps.credentials = activeStep
                                visibility.credentials = ''

                                if (mc && usdot) {
                                    steps.credentials = completedStep
                                    steps.confirmation = activeStep
                                    visibility.credentials = hidden
                                    submitProps.credentials = saveSubmit
                                }

                                {
                                    const values = {
                                        mc, usdot, scac, irp,
                                        ifta, iftaJur: iftaJur || addrState,
                                        efs, fleetOne, transflo,
                                    }
                                    for (const key in permits)
                                        values[`${key}Permit`] = stateTax?.[key]

                                    catOptions = updateFormOptions(catOptions, CarrierForm, values, { ...instr, tabs: 5 })
                                }
                                catForm = new CarrierForm(catOptions)

                                {
                                    const { style, content } = submitProps.credentials
                                    button.submit.credentials = submitButton('credentials-submit', content, style)
                                }

                                break


                            default:
                                steps.confirmation = activeStep
                        }


                    }


                    {
                        const values = { phone, fax, email }
                        options = updateFormOptions(options, CompanyForm, values, instr)

                        const { style, content } = submitProps.contacts
                        button.submit.contacts = submitButton('contacts-submit', content, style)
                    }
                }


                /* Address HBS Form & Submit */
                {
                    const values = {
                        address1, address2, addrZip, addrCity, addrState,
                        mailAddress1, mailAddress2, mailAddrZip, mailAddrCity, mailAddrState,
                    }
                    options = updateFormOptions(options, CompanyForm, values, { ...instr, tabs: 5 })
                    if (mailAddrZip) {
                        checked.mailAddress = ' checked'
                        visibility.mailAddress = ''
                    }

                    if (mailAddrZip)
                        Object.keys(values).slice(-5).forEach(prop => {
                            const input = options[prop]?.text?.input || options[prop].select.input
                            input.disabled = false
                        })

                    const { content, style } = submitProps.address
                    button.submit.address = submitButton('address-submit', content, style)
                }
            }


            /* Ownership & Owner HBS Form & Submit */
            {
                const values = { confirmAlias: null, ownership: _ownerId }
                options = updateFormOptions(options, CompanyForm, values, { ...instr, tabs: 5 })
                options.ownership.select.input.data = {} //await Owner.inputData(res.session)

                const owners = await Owner.fetch(res.session)
                const data = {}, names = []

                owners.map(owner => names.push(owner.fullName()))
                let dublicates = names.filter((name, i) => names.indexOf(name) !== i)
                dublicates = [ ...new Set(dublicates) ]
                owners.forEach((owner, i) => data[owner._id] = names[i] + (dublicates.includes(names[i]) ? ` (${owner.age})` : ''))
                options.ownership.select.input.data = sortObjectByValue(data)

                const { content, style } = submitProps.ownership
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
            if (since) since = moment(since).format('MM/DD/YYYY')
            const values = { category, since, ein, duns, busName, coType, alias, website }
            options = updateFormOptions(options, CompanyForm, values, { ...instr, tabs: 6 })

            const { content, style } = submitProps.record
            button.submit.record = submitButton('record-submit', content, style)
        }

        /* Category Form & Final Polish */
        if (data.category === 'crr')
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
        hbs.checked = checked
        hbs.icon = icon
        hbs.button = button

        res.render(key, hbs)

    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const companyByCategoryAndRoute = async (req, res) => {
    try {
        const { route } = req.params
        let company = await Company.fetch(res.session, { route }, { hideSensitive: false })

        const { _id: _companyId, category, ein } = company
        if (!company) return respond404(res)
        if (req.params.category !== Company.list.category[category].path[1])
            return respond404(res)

        const css = {}
        let logoList = ''

        switch (category) {

            case 'crr':
                company = await Carrier.fetch(res.session, { _companyId })

                css.card = { minHeight: '455px' }
                css.multiSelect = { minHeight: '310px' }
                break

        }

        company.name = escapeHTML(company.name)
        company.alias = escapeHTML(company.alias)

        company.owner.name = escapeHTML(company.owner.fullName())

        const icon = Company.list.category[category].icon
        let cardTitle = company.name
        if (icon) cardTitle = `${icon}&nbsp;&nbsp;${cardTitle}`

        const key = 'company'
        let { hbs } = res
        hbs = hbs.set(key, { titlePfx: company.name })

        const { active } = hbs.nav
        hbs.nav.companies = active

        if (company.lastLogo) {
            const id = await company.id()
            const files = await getFiles(`${dir}/uploads/business/company/logo/${id}`, false)

            files.forEach((filename, i) => {
                const t = `\t\t\t\t`
                const label = files.length - 1 === i ? 'Initial' : 'Effective '
                const caption = moment(filename.split('.')[0]).format('ll')

                logoList += `\n${t}<figure class="image">`
                logoList += `\n${t}\t<figcaption><small>${label}:</small> ${caption}`
                if (files.length - 1 !== i) logoList += `&nbsp;&nbsp;<button class="delete-company-logo" data-filename="${filename}"><i class="has-text-danger-dark fa fa-close"></i></button>`
                logoList += '</figcaption>'
                logoList += `\n${t}\t<img src="${addrBook.admin}/image/business/company/logo/${_companyId}/${filename}" alt="Logo" />`
                logoList += `\n${t}</figure>`
            })
        }

        hbs._id = _companyId
        hbs.cardTitle = cardTitle
        hbs.data = company
        hbs.display = display(company, ein)
        hbs.css = css
        hbs.logoList = logoList
        hbs.defaultValue = {
            today: moment().format('MM/DD/YYYY'),
        } 
        hbs.form = {
            id: {
                hidden: {
                    input: CompanyForm.id.hidden.input({ value: _companyId }),
                },
            },
            confirmAlias: {
                text: {
                    input: CompanyForm.confirmAlias.text.input({ class: 'input' }),
                },
            },
        }
        hbs.display.status = company.active
            ? '<span class="has-text-success-45">Active</span>'
            : '<i class="has-text-danger">Inactive</i>'
        hbs.display.statusTrigger = company.active ? 'Deactivate' : 'Activate'

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}