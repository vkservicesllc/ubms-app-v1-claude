import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import Tip from '/modules/tools/tip.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import { busNameEvent, coTypeEvent, aliasEvent, einEvent, dunsEvent } from '/modules/events/company.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import selector from '/modules/registry/selectors/company.mjs'

const TS = selector.id.text, SS = selector.id.select
const sinceId = TS.since
const einId = TS.ein, dunsId = TS.duns, websiteId = TS.website
const busNameId = TS.busName, coTypeId = SS.coType, aliasId = TS.alias
const phoneId = TS.phone, faxId = TS.fax, emailId = TS.email
const addr1Id = TS.address1, addr2Id = TS.address2
const zipId = TS.addrZip, cityId = TS.addrCity, stateId = SS.addrState
const mailAddr1Id = TS.mailAddress1, mailAddr2Id = TS.mailAddress2
const mailZipId = TS.mailAddrZip, mailCityId = TS.mailAddrCity, mailStateId = SS.mailAddrState

const $tip = {
    name: $('#busname-tip'),
    alias: $('#alias-tip'),
    email: $('#email-tip'),
    // ein: $('#ein-tip'),
    // duns: $('#duns-tip'),
    // website: $('#website-tip'),
    // form: $('#company-form-tip'),
}

const tipDefs = {}
for (const key in $tip)
    tipDefs[key] = $tip[key].html()

const message = {
    success: {
        name: 'Name is unique',
        alias: 'Alias is unique',
        // ein: 'EIN is unique',
        // duns: 'DUNS is unique',
    },
    failed: {
        name: 'Name is taken',
        alias: 'Alias is taken',
        // ein: 'EIN is taken',
        // duns: 'DUNS is taken',
    },
}

const setTip = new Tip($tip, tipDefs, message)

const handleChange = (props = {}) => {
    let input = true, action = 'passed'
    const { data, key } = props

    data._id = _id
    for (const prop in data)
        if (!data[prop]) {
            input = false
            break
        }

    if (!input) action = 'default'


    $.ajax('/api/unique/company', {
        method: 'POST',
        data,
        success(response) {
            const { unique } = response
            if (input && !unique) action = 'failed'

            setTip[action](key)
        },
    })
}

const $tabs = $('.company-management-tabs')
const $sections = $('.company-management-content')
const $tableList = {
    names: $('#name-table-list'),
    ownerships: $('#ownership-table-list'),
    addresses: $('#address-table-list'),
    mail: $('#mail-table-list'),
    phones: $('#phone-table-list'),
    faxes: $('#fax-table-list'),
    emails: $('#email-table-list'),
}
const $input = $('input:not([type="checkbox"]), select')

const $modal = {
    upsert: $('#upsert-modal'),
    delete: $('#delete-modal'),
    elements: function(target) {
        const $title = $(this[target]).find('.modal-card-target-title')
        const $submit = $(this[target]).find('[type="submit"]')
        const $body = $(this[target]).find('.modal-card-body')
        const $main = $(this[target]).find('.form-body')
        const $form = $main.find('.form')

        switch (target) {
            case 'upsert':
                const $warning = $(this.upsert).find('.warning-body')
                const $proceed = $(this.upsert).find('.proceed-button')

                return { $title, $body, $warning, $main, $form, $input, $submit, $proceed }
                break
            case 'delete':
                const $checkbox = $('input[type="checkbox"]')

                return { $title, $body, $submit, $form, $checkbox }
                break
        }
    }
}

const _id = $('#company-id').val()
const timeout = 250


$tabs.click(function() {
    $tabs.removeClass('is-active')
    $sections.fadeOut(timeout)
    $(this).addClass('is-active')

    setTimeout(() => {
        const section = $(this).data('section')

        $(`#${section}-section`).fadeIn(timeout)
    }, timeout)
})


const openUpsertModal = (target, action = 'insert', data, since) => {
    const { $title, $warning, $main, $submit, $proceed } = $modal.elements('upsert')
    let title = {
        names: 'Name',
        phones: 'Phone',
        faxes: 'Fax',
        emails: 'Email',
        addresses: 'Physical Address',
        mail: 'Mailing Address',
    }[target]
    let formAction = 'hide'

    switch (action) {

        case 'update':
            title = '<small>Modify selected</small> ' + title
            data = data[target]
            for (const row of data) {
                if (row.since !== since) continue
                data = row
                break
            }
            $warning.show()
            $proceed.show()
            $submit.text('Register').addClass('is-success')
            break

        default:
            title = '<small>Register new</small> ' + title
            formAction = 'show'
            $main.show()
            $submit.text('Register').addClass('is-link').show()

    }

    $title.html(title)
    $(`.${target}-form`)[formAction]().find('input, select').prop('disabled', false)
    $modal.upsert.addClass('is-active')
}

const closeUpsertModal = () => {
    $modal.upsert.removeClass('is-active')

    const { $title, $warning, $main, $form, $input, $submit, $proceed } = $modal.elements('upsert')

    $input.val(null).prop('disabled', true)
    $title.html(null)
    Object.keys(message.success).forEach(key => setTip.default(key))
    $tip.email.html(null)
    $form.hide()
    $main.hide()
    $submit.hide().text(null).removeClass('is-link is-success')
    $warning.hide()
    $proceed.hide()
}


$input.prop('disabled', true)


busNameEvent(busNameId, coTypeId, {
    onInput() {
        setTip.default('name')
    },
    onChange(busName, coType) {
        handleChange({ data: { busName, coType }, key: 'name' })
    },
})

coTypeEvent(coTypeId, busNameId, (coType, busName) => {
    handleChange({ data: { busName, coType }, key: 'name' })
})

aliasEvent(aliasId, {
    onInput() {
        setTip.default('alias')
    },
    onChange(alias) {
        handleChange({ data: { alias }, key: 'alias' })
    },
})

telEvent(phoneId)
telEvent(faxId)
emailEvent(emailId, {
    onInput() {
        if ($tip.email.html()) $tip.email.html(null)
    },
    onChange(email, valid) {
        if (email && !valid)
            $tip.email.html('<i class="fa fa-triangle-exclamation"></i> Invalid email')
    },
})


$.ajax(`/api/resource/companies/${_id}/history`, {
    success(response) {
        const { data } = response
        const { names, ownerships, addresses, mail, phones, faxes, emails } = data
        const defs = {
            a: span => `<tr><td class="has-text-centered has-text-danger-65" colspan="${span}"><small><i>`,
            b: '</i></small></td></tr>',
            current: '<li class="fa fa-check has-text-success" title="Current data"></li>',
            init: ' <sup class="has-text-warning initial" title="Initial data: effective since launch date"><i class="fas fa-star"></i></sup>',
            aAttr: {
                edit: (row, target, value) => `class="edit-event" title="Edit selected ${value}" data-target="${target}" data-id="${row._companyId}" data-since="${row.since}" href=""`,
                delete: (row, target, value) => `class="delete-event ml-1" title="Delete selected ${value}" data-target="${target}" data-id="${row._companyId}" data-since="${row.since}" href=""`,
            },
        }

        const list = {
            names: '',
            ownerships: '',
            addresses: '',
            mail: !mail.length ? `${defs.a(4)}No mailing addresses registered yet${defs.b}` : '',
            phones: '',
            faxes: !faxes.length ? `${defs.a(4)}No faxes registered yet${defs.b}` : '',
            emails: !emails.length ? `${defs.a(4)}No emails registered yet${defs.b}` : '',
        }

        names.map((row, i) => {
            list.names += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.names += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.names += `<td><span class="has-text-weight-semibold">${row.busName}, ${row.coType}</span> &nbsp;<small>(${row.alias})</small></td>`
            list.names += `<td class="has-text-right controls">`
            list.names += `<a ${defs.aAttr.edit(row, 'names', 'name')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.names += `<a ${defs.aAttr.delete(row, 'names', 'name')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.names += '</td></tr>'
        })

        ownerships.map((row, i) => {
            const owner = new Person(row.owner)
            list.ownerships += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.ownerships += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.ownerships += `<td><span class="has-text-weight-semibold">${owner.fullName()}</span></td>`
            list.ownerships += `<td class="has-text-right controls">`
            if (!i) list.ownerships += `<a id="transfer-ownership" title="Transfer ownership" href=""><i class="fas fa-arrows-turn-right has-text-link-70"></i></a>`
            if (!row.initial) list.ownerships += `<a ${defs.aAttr.delete(row, 'ownerships', 'ownership')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.ownerships += '</td></tr>'
        })

        phones.map((row, i) => {
            list.phones += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.phones += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.phones += `<td><span class="has-text-weight-semibold">${formatTel(row.phone)}</span></td>`
            list.phones += `<td class="has-text-right controls">`
            list.phones += `<a ${defs.aAttr.edit(row, 'phones', 'phone')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.phones += `<a ${defs.aAttr.delete(row, 'phones', 'phone')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.phones += '</td></tr>'
        })

        faxes.map((row, i) => {
            list.faxes += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.faxes += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.faxes += `<td><span class="has-text-weight-semibold">${formatTel(row.fax)}</span></td>`
            list.faxes += `<td class="has-text-right controls">`
            list.faxes += `<a ${defs.aAttr.edit(row, 'faxes', 'fax')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.faxes += `<a ${defs.aAttr.delete(row, 'faxes', 'fax')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.faxes += '</td></tr>'
        })

        emails.map((row, i) => {
            list.emails += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.emails += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.emails += `<td><span class="has-text-weight-semibold">${row.email}</span></td>`
            list.emails += `<td class="has-text-right controls">`
            list.emails += `<a ${defs.aAttr.edit(row, 'emails', 'email')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.emails += `<a ${defs.aAttr.delete(row, 'emails', 'email')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.emails += '</td></tr>'
        })

        addresses.map((row, i) => {
            list.addresses += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.addresses += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.addresses += `<td><span class="has-text-weight-semibold">${new Address(row).html()}</span></td>`
            list.addresses += `<td class="has-text-right controls">`
            list.addresses += `<a ${defs.aAttr.edit(row, 'addresses', 'address')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.addresses += `<a ${defs.aAttr.delete(row, 'addresses', 'address')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.addresses += '</td></tr>'
        })

        mail.map((row, i) => {
            list.mail += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.mail += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.mail += `<td><span class="has-text-weight-semibold">${new Address(row).html()}</span></td>`
            list.mail += `<td class="has-text-right controls">`
            list.mail += `<a ${defs.aAttr.edit(row, 'mail', 'mailing address')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.mail += `<a ${defs.aAttr.delete(row, 'mail', 'mailing address')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.mail += '</td></tr>'
        })

        Object.keys($tableList).forEach(target => $tableList[target].html(list[target]))

        const url = (target, since) => {
            let url = `/api/resource/companies/${_id}/${target}`
            if (since) url += `/${since}`

            return url
        }

        $('.add-event').click(function(evt) {
            evt.preventDefault()

            const target = $(this).data('target')
            openUpsertModal(target)
        })

        $('.edit-event').click(function(evt) {
            evt.preventDefault()

            const target = $(this).data('target')
            const since = $(this).data('since')
            openUpsertModal(target, 'update', data, since)
        })

        $('.delete-event').click(function(evt) {
            evt.preventDefault()

            const target = $(this).data('target')
            const since = $(this).data('since')
console.log({ _id, target, since, url: url(target, since) }) //!TEMP
        })

        $('.upsert-modal-cancel').click(closeUpsertModal)
    },
})