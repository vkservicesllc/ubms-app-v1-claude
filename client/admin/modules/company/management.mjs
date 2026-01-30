import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

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


$.ajax(`/api/resource/companies/${_id}/history`, {
    success(response) {
        const { names, ownerships, addresses, mail, phones, faxes, emails } = response.data
        const defs = {
            a: span => `<tr><td class="has-text-centered has-text-danger-65" colspan="${span}"><small><i>`,
            b: '</i></small></td></tr>',
            current: '<li class="fa fa-check has-text-success" title="Current data"></li>',
            init: ' <sup class="has-text-warning initial" title="Initial data: effective since launch date"><i class="fas fa-star"></i></sup>',
            aAttr: {
                edit: (row, prop, target, value) => `class="edit-company-${prop}" title="Edit selected ${value || prop}" data-target="${target}" data-id="${row._companyId}" data-since="${row.since}" href=""`,
                delete: (row, prop, target, value) => `class="delete-company-${prop} ml-1" title="Delete selected ${value || prop}" data-target="${target}" data-id="${row._companyId}" data-since="${row.since}" href=""`,
            },
        }

// console.table(addresses) //! TEMP

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
            list.names += `<td>${row.busName}, ${row.coType} &nbsp;<small class="has-text-grey">(${row.alias})</small></td>`
            list.names += `<td class="has-text-right controls">`
            list.names += `<a ${defs.aAttr.edit(row, 'name', 'names')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.names += `<a ${defs.aAttr.delete(row, 'name', 'names')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.names += '</td></tr>'
        })

        ownerships.map((row, i) => {
            const owner = new Person(row.owner)
            list.ownerships += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.ownerships += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.ownerships += `<td>${owner.fullName()}</td>`
            list.ownerships += `<td class="has-text-right controls">`
            if (!i) list.ownerships += `<a id="transfer-ownership" title="Transfer ownership" href=""><i class="fas fa-arrows-turn-right has-text-link-70"></i></a>`
            if (!row.initial) list.ownerships += `<a ${defs.aAttr.delete(row, 'ownership', 'ownerships')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.ownerships += '</td></tr>'
        })

        addresses.map((row, i) => {
            list.addresses += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.addresses += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.addresses += `<td>${new Address(row).html()}</td>`
            list.addresses += `<td class="has-text-right controls">`
            list.addresses += `<a ${defs.aAttr.edit(row, 'address', 'addresses')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.addresses += `<a ${defs.aAttr.delete(row, 'address', 'addresses')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.addresses += '</td></tr>'
        })

        mail.map((row, i) => {
            list.mail += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.mail += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.mail += `<td>${new Address(row).html()}</td>`
            list.mail += `<td class="has-text-right controls">`
            list.mail += `<a ${defs.aAttr.edit(row, 'mail', 'mail', 'mailing address')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.mail += `<a ${defs.aAttr.delete(row, 'mail', 'mail', 'mailing address')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.mail += '</td></tr>'
        })

        phones.map((row, i) => {
            list.phones += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.phones += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.phones += `<td>${formatTel(row.phone)}</td>`
            list.phones += `<td class="has-text-right controls">`
            list.phones += `<a ${defs.aAttr.edit(row, 'phone', 'phones')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.phones += `<a ${defs.aAttr.delete(row, 'phone', 'phones')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.phones += '</td></tr>'
        })

        faxes.map((row, i) => {
            list.faxes += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.faxes += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.faxes += `<td>${formatTel(row.fax)}</td>`
            list.faxes += `<td class="has-text-right controls">`
            list.faxes += `<a ${defs.aAttr.edit(row, 'fax', 'faxes')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.faxes += `<a ${defs.aAttr.delete(row, 'fax', 'faxes')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.faxes += '</td></tr>'
        })

        emails.map((row, i) => {
            list.emails += `<tr><td class="current-status">${!i ? defs.current : ''}</td>`
            list.emails += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.emails += `<td>${row.email}</td>`
            list.emails += `<td class="has-text-right controls">`
            list.emails += `<a ${defs.aAttr.edit(row, 'email', 'emails')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.emails += `<a ${defs.aAttr.delete(row, 'email', 'emails')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.emails += '</td></tr>'
        })

        $tableList.names.html(list.names)
        $tableList.ownerships.html(list.ownerships)
        $tableList.addresses.html(list.addresses)
        $tableList.mail.html(list.mail)
        $tableList.phones.html(list.phones)
        $tableList.faxes.html(list.faxes)
        $tableList.emails.html(list.emails)
    },
})