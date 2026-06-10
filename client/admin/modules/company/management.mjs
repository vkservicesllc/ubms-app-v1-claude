import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import Tip from '/modules/tools/tip.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import { busNameEvent, coTypeEvent, aliasEvent, einEvent, dunsEvent } from '/modules/events/company.mjs'
import { urlEvent } from '../events/web.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import selector from '/modules/registry/selectors/company.mjs'

//! FIXES NEEDED: since event must be updated

const TS = selector.id.text, SS = selector.id.select
const sinceId = TS.since, effectiveId = TS.effective
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
    ein: $('#ein-tip'),
    duns: $('#duns-tip'),
    website: $('#website-tip'),
    // form: $('#company-form-tip'),
}

const tipDefs = {}
for (const key in $tip)
    tipDefs[key] = $tip[key].html()

const message = {
    success: {
        name: 'Name is unique',
        alias: 'Alias is unique',
        ein: 'EIN is unique',
        duns: 'DUNS is unique',
    },
    failed: {
        name: 'Name is taken',
        alias: 'Alias is taken',
        ein: 'EIN is taken',
        duns: 'DUNS is taken',
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
let not = `:not([type="hidden"]):not([type="checkbox"]):not(${sinceId}):not(${effectiveId})`
not += `:not(${einId}):not(${dunsId}):not(${websiteId})`
const $input = $(`input${not}, select`)
const $effective = $(effectiveId)
const $effectiveMatch = {
    upsert: $('#upsert-effective-match'),
    delete: $('#delete-effective-match'),
}
const $target = { upsert: $('#upsert-target'), delete: $('#delete-target') }
const $enfMail = $('#enforce-mail')
const $proceed = $('#proceed-button')
const $delRecord = $('#delete-record')
const $error = {
    upsert: $('#upsert-error'),
}

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

                return { $title, $body, $warning, $main, $form, $input, $submit }
                break
            case 'delete':
                return { $title }
                break
        }
    }
}

const _id = $('#company-id').val()
const since = $('#company-since').val()
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

const titles = {
    names: 'Name',
    phones: 'Phone',
    faxes: 'Fax',
    emails: 'Email',
    addresses: 'Physical Address',
    mail: 'Mailing Address',
}

const $staticButtons = $('#static-buttons')


$('.static-edit').click(function(evt) {
    evt.preventDefault()

    const $td = $(this).parent().prev()
    const $formData = $td.find('.form-data')
    const $formEl = $td.find('.form-element')
    const $help = $td.find('.help')
    const $cancel = $(this).next()

    $formEl.find('input').prop('disabled', false)
    $formEl.show()
    $help.show()
    $formData.hide()

    $(this).hide()
    $cancel.show()
    $staticButtons.show()
})

$('.static-cancel').click(function(evt) {
    evt.preventDefault()

    const $td = $(this).parent().prev()
    const $formData = $td.find('.form-data')
    const $formEl = $td.find('.form-element')
    const $help = $td.find('.help')
    const $edit = $(this).prev()

    $formEl.find('input').prop('disabled', true)
    $formEl.hide()
    $help.hide()
    $formData.show()

    $(this).hide()
    $edit.show()

    let enabled = false
    $('#static-form').find('input').each(function() {
        if (!enabled) {
            if ($(this).prop('disabled') === false) enabled = true
        }
    })

    if (!enabled) $staticButtons.hide()
})


const openUpsertModal = (target, action = 'insert', data, since) => {
    const { $title, $warning, $main, $submit } = $modal.elements('upsert')
    let title = titles[target]

    switch (action) {

        case 'update':
            title = '<small>Modify selected</small> ' + title
            data = data[target]
            for (const row of data) {
                if (row.since !== since) continue
                data = row
                break
            }
            $effective.val(data.since !== '0000-00-00' ? moment(data.since).format('MM/DD/YYYY') : 'Launch Date')
            if (['names', 'phones', 'addresses'].includes(target))
                $effective.prop('disabled', data.initial)
            $effectiveMatch.upsert.val(data.since)
            switch (target) {
                case 'names':
                    $(busNameId).val(data.busName)
                    $(coTypeId).val(data.coType).find('option[value=""]').remove()
                    $(aliasId).val(data.alias)
                    break
                case 'phones':
                    $(phoneId).val(formatTel(data.phone))
                    break
                case 'faxes':
                    $(faxId).val(formatTel(data.fax))
                    break
                case 'emails':
                    $(emailId).val(data.email)
                    break
                case 'addresses':
                    $(addr1Id).val(data.address1)
                    $(addr2Id).val(data.address2)
                    $(zipId).val(data.zip)
                    $(cityId).val(data.city)
                    $(stateId).val(data.state).find('option[value=""]').remove()
                    $enfMail.prop('checked', !!data.mail)
                    break
                case 'mail':
                    $(mailAddr1Id).val(data.address1)
                    $(mailAddr2Id).val(data.address2)
                    $(mailZipId).val(data.zip)
                    $(mailCityId).val(data.city)
                    $(mailStateId).val(data.state).find('option[value=""]').remove()
                    break
            }
            $warning.show()
            $proceed.show()
            $submit.text('Register').addClass('is-success')

            $proceed.on('click', function() {
                $(this).hide()
                $submit.text('Save Changes').addClass('is-success').show()
                $warning.hide()
                $main.show()
            })
            break

        default:
            title = '<small>Register new</small> ' + title
            $effective.prop('disabled', false)
            $main.show()
            $submit.text('Register').addClass('is-link').show()

    }

    $target.upsert.val(target)
    $title.html(title)
    $(`.${target}-form`).show().find('input, select').prop('disabled', false)
    $modal.upsert.addClass('is-active')
}

const closeUpsertModal = () => {
    $modal.upsert.removeClass('is-active')
    $proceed.off('click')

    const { $title, $warning, $main, $form, $input, $submit } = $modal.elements('upsert')

    $target.upsert.val(null)
    $input.val(null).prop('disabled', true).removeClass('is-danger')
    $effective.val(null)
    $effectiveMatch.upsert.val(null)
    $enfMail.prop('checked', false)
    if (!$(coTypeId).find('option[value=""]').length) $(coTypeId).prepend('<option value="">--</option>')
    if (!$(stateId).find('option[value=""]').length) $(stateId).prepend('<option value="">--</option>')
    if (!$(mailStateId).find('option[value=""]').length) $(mailStateId).prepend('<option value="">--</option>')
    $title.html(null)
    Object.keys(message.success).forEach(key => setTip.default(key))
    $tip.email.html(null)
    $error.upsert.hide().html(null)
    $form.hide()
    $main.hide()
    $submit.hide().text(null).removeClass('is-link is-success')
    $warning.hide()
    $proceed.hide()
}


const openDeleteModal = (target, data, since) => {
    const { $title } = $modal.elements('delete')
    const title = '<small>Delete selected</small> ' + titles[target]

    data = data[target]
    for (const row of data) {
        if (row.since !== since) continue
        data = row
        break
    }
    let record = ''
    let recordSince = `<br/><small class="has-text-weight-normal has-text-grey">Effective Date:</small> `
    recordSince += `<span class="has-text-info-45">${moment(since).format('ll')}</span>`

    switch (target) {
        case 'names':
            record = `${data.busName}, ${data.coType} <small>(${data.alias})</small>`
            break
        case 'phones':
            record = formatTel(data.phone)
            break
        case 'faxes':
            record = formatTel(data.fax)
            break
        case 'emails':
            record = data.email
            break
        case 'addresses':
        case 'mail':
            record = new Address(data).html({ inline: false })
            break
    }
    record = `<span class="has-text-info-45">${record}</span>`

    $target.delete.val(target)
    $title.html(title)
    $delRecord.html(record + recordSince)
    $effectiveMatch.delete.val(since)
    $modal.delete.addClass('is-active')
}

const closeDeleteModal = () => {
    $modal.delete.removeClass('is-active')

    const { $title } = $modal.elements('delete')
    $title.html(null)
    $target.delete.val(null)
    $delRecord.html(null)
    $effectiveMatch.delete.val(null)
}


$input.prop('disabled', true)


//! NOT FINISHED
inputEvent(sinceId, {
    datepicker: {
        maxDate: 0, //! Determine maxDate based on other components minimum date minus 1 day
    },
})


einEvent(einId, {
    onInput() {
        setTip.default('ein')
    },
    onChange(ein) {
        handleChange({ data: { ein }, key: 'ein' })
    },
})

dunsEvent(dunsId, {
    onInput() {
        setTip.default('duns')
    },
    onChange(duns) {
        handleChange({ data: { duns }, key: 'duns' })
    },
})

urlEvent(websiteId, {
    onInput() {
        $tip.website.html(null)
    },
    onChange(website, valid) {
        if (website && !valid)
            $tip.website.html('<i class="fa fa-triangle-exclamation"></i> Invalid website')
    },
})


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

addr1Event(addr1Id, { addr2Id })
addr2Event(addr2Id)
zipEvent(zipId, { cityId, stateId })
cityEvent(cityId)
selectEvent(stateId, { fill: true })

addr1Event(mailAddr1Id, { addr2Id: mailAddr2Id, mail: true })
addr2Event(mailAddr2Id)
zipEvent(mailZipId, { cityId: mailCityId, stateId: mailStateId })
cityEvent(mailCityId)
selectEvent(mailStateId, { fill: true })


let { href } = location
href = href.split('?')[0]

$('#upsert-form').submit(function(evt) {
    evt.preventDefault()
    $effective.prop('disabled', false)

    const serialized = $(this).serializeArray()
    const data = {}, target = $target.upsert.val(), since = $effectiveMatch.upsert.val()
    let method = 'POST', url = `/api/resource/companies/${_id}/${target}`

    if (since) {
        method = 'PUT'
        url += `/${since}`
    }

    serialized.map(input => {
        let { name } = input
        if (name.includes('[')) name = name.split('[')[1].replace(']', '')

        data[name] = input.value
    })
    if (since === '0000-00-00') delete data.since

    $.ajax({ url, method, data,
        success(response) {
            const { oldRoute, newRoute } = response.props
            if (newRoute !== oldRoute) href = href.replace(oldRoute, newRoute)

            const tabLink = $('.tab-link.is-active').data('section')
            href += `?tab=${tabLink}`

            window.location.replace(href)
        },
        error() {
            $effective.addClass('is-danger')
            $error.upsert.html('<i class="fa fa-exclamation-triangle"></i> Failed to write data: Effective date may exist').show()
        },
    })
})

$('#delete-form').submit(function(evt) {
    evt.preventDefault()

    const target = $target.delete.val()
    const since = $effectiveMatch.delete.val()

    $.ajax(`/api/resource/companies/${_id}/${target}/${since}`, {
        method: 'DELETE',
        success(response) {
            const { oldRoute, newRoute } = response.props
            if (newRoute !== oldRoute) href = href.replace(oldRoute, newRoute)

            const tabLink = $('.tab-link.is-active').data('section')
            href += `?tab=${tabLink}`

            window.location.replace(href)
        },
    })
})


$.ajax(`/api/resource/companies/${_id}/history`, {
    success(response) {
        const { data } = response
        const { names, ownerships, addresses, mail, phones, faxes, emails } = data
        const defs = {
            a: span => `<tr><td class="has-text-centered has-text-danger-65" colspan="${span}"><small><i>`,
            b: '</i></small></td></tr>',
            current: '<li class="fa fa-check has-text-success" title="Current data"></li>',
            init: ' <sup class="has-text-warning-50 initial" title="Initial data: effective since launch date"><i class="fas fa-star"></i></sup>',
            aAttr: {
                edit: (row, target, value) => `class="edit-event" title="Edit selected ${value}" data-target="${target}" data-since="${row.since}" href=""`,
                delete: (row, target, value) => `class="delete-event ml-2" title="Delete selected ${value}" data-target="${target}" data-since="${row.since}" href=""`,
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

        const setDate = row =>
            (row.since !== '0000-00-00' ? moment(row.since).format('ll') : '<em class="has-text-danger has-text-weight-normal">Launch Date</em>')
            + (row.initial ? defs.init : '')

        names.map((row, i) => {
            list.names += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.names += `<td class="effective-date">${setDate(row)}</td>`
            list.names += `<td><span class="has-text-weight-semibold">${row.busName}, ${row.coType}</span> &nbsp;<small>(${row.alias})</small></td>`
            list.names += `<td class="has-text-right controls">`
            list.names += `<a ${defs.aAttr.edit(row, 'names', 'name')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.names += `<a ${defs.aAttr.delete(row, 'names', 'name')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.names += '</td></tr>'
        })

        ownerships.map((row, i) => {
            const owner = new Person(row.owner)
            list.ownerships += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.ownerships += `<td class="effective-date">${setDate(row)}</td>`
            list.ownerships += `<td><span class="has-text-weight-semibold">${owner.fullName()}</span></td>`
            list.ownerships += `<td class="has-text-right controls">`
            if (!i) list.ownerships += `<a id="transfer-ownership" title="Transfer ownership" href=""><i class="fas fa-arrows-turn-right has-text-link-70"></i></a>`
            if (!row.initial) list.ownerships += `<a ${defs.aAttr.delete(row, 'ownerships', 'ownership')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.ownerships += '</td></tr>'
        })

        phones.map((row, i) => {
            list.phones += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.phones += `<td class="effective-date">${setDate(row)}</td>`
            list.phones += `<td><span class="has-text-weight-semibold">${formatTel(row.phone)}</span></td>`
            list.phones += `<td class="has-text-right controls">`
            list.phones += `<a ${defs.aAttr.edit(row, 'phones', 'phone')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.phones += `<a ${defs.aAttr.delete(row, 'phones', 'phone')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.phones += '</td></tr>'
        })

        faxes.map((row, i) => {
            list.faxes += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.faxes += `<td class="effective-date">${setDate(row)}</td>`
            list.faxes += `<td><span class="has-text-weight-semibold">${formatTel(row.fax)}</span></td>`
            list.faxes += `<td class="has-text-right controls">`
            list.faxes += `<a ${defs.aAttr.edit(row, 'faxes', 'fax')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.faxes += `<a ${defs.aAttr.delete(row, 'faxes', 'fax')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.faxes += '</td></tr>'
        })

        emails.map((row, i) => {
            list.emails += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.emails += `<td class="effective-date">${setDate(row)}</td>`
            list.emails += `<td><span class="has-text-weight-semibold">${row.email}</span></td>`
            list.emails += `<td class="has-text-right controls">`
            list.emails += `<a ${defs.aAttr.edit(row, 'emails', 'email')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.emails += `<a ${defs.aAttr.delete(row, 'emails', 'email')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.emails += '</td></tr>'
        })

        addresses.map((row, i) => {
            const mailSup = row.mail ? ' &nbsp;<sup class="has-text-info-45 enforced"><i class="fa fa-envelope"></i></sup>' : ''
            list.addresses += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.addresses += `<td class="effective-date">${setDate(row)}</td>`
            list.addresses += `<td><span class="has-text-weight-semibold">${new Address(row).html()}</span>${mailSup}</td>`
            list.addresses += `<td class="has-text-right controls">`
            list.addresses += `<a ${defs.aAttr.edit(row, 'addresses', 'address')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.addresses += `<a ${defs.aAttr.delete(row, 'addresses', 'address')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.addresses += '</td></tr>'
        })

        mail.map((row, i) => {
            list.mail += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.mail += `<td class="effective-date">${setDate(row)}</td>`
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

        inputEvent(sinceId, {
            datepicker: {},
        })

        inputEvent(effectiveId, {
            datepicker: { minDate: since !== '0000-00-00' ? moment(since, 'YYYY-MM-DD').toDate() : undefined, maxDate: 0 },
            onChange(date, $date) {
                $date.removeClass('is-danger')
            },
        })

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

            openDeleteModal(target, data, since)
        })

        $('.upsert-modal-cancel').click(closeUpsertModal)
        $('.delete-modal-cancel').click(closeDeleteModal)

        $('.loader-wrapper').remove()
    },
})