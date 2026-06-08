const { DIR__PATH: dir } = Bun.env


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

// const url = {
//     company: '/business/company/',
//     companies: '/business/companies',
//     owners: '/business/company-owners',
// }

const permits = Carrier.list.permit


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
        display.data.since = data.since !== '0000-00-00' ? moment(data.since).format('ll') : na
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
            dir: {
                record: 'insert/company',
            },
            param: {
                ownership: 'add',
                address: 'add',
                contact: 'add',
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
        let category, since, ein, duns, busName, coType, alias, website, locked
        const checked = { mailAddress: '' }


        /* Current Company */
        if (_id !== 'new') {
            data = await Company.fetch(res.session, { _id }, { hideSensitive: false })
            if (!data) return respond404(res)

            if (data.confirmed) {
                let url = `/business/${Company.list.category[data.category].path[1]}/${data.route}`
                return res.redirect(url)
            }

            {({ _id, category, since, ein, duns, busName, coType, alias, website, locked } = data)}
            if (since === '0000-00-00') since = null

            const { name, owner } = data
            const { _id: _ownerId } = owner
            const { icon: catIdIcon } = Company.list.category[category]

            titlePfx = name
            contentTitle = `<span class="has-text-weight-semibold is-size-4">${escapeHTML(name)}</span>`
            contentTitle += ' &nbsp;&nbsp;<a id="delete-company-trigger"><i class="fas fa-trash-can has-text-danger is-size-6"></i></a>'

            steps.record = completedStep
            steps.ownership = activeStep
            visibility.record = hidden
            visibility.ownership = ''
            actionUrl.dir.record = `update/company/${_id}`
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

                actionUrl.param.ownership = 'update'
                steps.ownership = completedStep
                steps.address = activeStep
                visibility.ownership = hidden
                visibility.address = ''
                visibility.mailAddress = hidden
                submitProps.ownership = saveSubmit


                if (addrZip) {
                    const { phone, fax, email } = data

                    actionUrl.param.address = 'update'
                    steps.address = completedStep
                    steps.contacts = activeStep
                    visibility.address = hidden
                    visibility.contacts = ''
                    submitProps.address = saveSubmit


                    if (phone) {
                        actionUrl.param.contact = 'update'
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
                                        id: data._id,
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
            options.category.select.input.disabled = locked

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
        const id = company.id

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
            const files = await getFiles(`${dir}/uploads/business/company/${id}/logo`, false)

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
            until: {
                text: {
                    label: CompanyForm.until.text.label({ class: labelClassRequired }),
                    input: CompanyForm.until.text.input({ class: 'input' }),
                },
            },
        }
        hbs.display.status = company.active
            ? '<span class="has-text-success-45">Active</span>'
            : '<i class="has-text-danger">Inactive</i>'
        if (company.until) hbs.display.status = `<span class="has-text-danger">Permanently Closed <small>(Effective ${moment(company.until).format('ll')})</small></span>`
        hbs.display.statusTrigger = company.active ? 'Deactivate' : 'Activate'
        hbs.display.statusMessage = company.active ? 'place the company on hold' : 'release the company from hold'
        hbs.url = {
            update: `/business/${Company.list.category[company.category].path[1]}/${company.route}/management`,
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const companyManagement = async (req, res) => {
    try {
        const { route } = req.params
        let company = await Company.fetch(res.session, { route }, { hideSensitive: false })

        const { _id: _companyId, category, since, ein, duns, website } = company
        if (!company || company.until) return respond404(res)
        if (req.params.category !== Company.list.category[category].path[1])
            return respond404(res)

        const key = 'company-management'
        let { hbs } = res
        hbs = hbs.set(key)

        const { active } = hbs.nav
        hbs.nav.companies = active

        const icon = Company.list.category[category].icon
        hbs.companyName = company.name
        if (icon) hbs.companyName = `${icon}&nbsp;&nbsp;${hbs.companyName}`

        hbs.url = {
            back: `/business/${req.params.category}/${route}`,
        }

        const instr = { labelClass, labelClassRequired, textClass: 'input' }
        let options = {}

        const values = { since: moment(since).format('MM/DD/YYYY'), ein, duns, website }
        const fields = [
            'effective',
            'busName', 'coType', 'alias',
            'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
            'mailAddress1', 'mailAddress2', 'mailAddrZip', 'mailAddrCity', 'mailAddrState',
            'phone', 'fax', 'email',
        ]

        options = updateFormOptions(options, CompanyForm, values, { ...instr })
        options = updateFormOptions(options, CompanyForm, fields, { ...instr, tabs: 13 })

        switch (category) {

            case 'crr':
                company = await Carrier.fetch(res.session, { _companyId })
                break

        }

        company.moment = {
            since: company.since !== '0000-00-00'
                ? moment(company.since).format('ll')
                : '<em class="has-text-danger has-text-weight-normal">Not specified</em>',
        }

        hbs.data = company
        hbs.form = new CompanyForm(options)

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}