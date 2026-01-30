import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

const $tabs = $('.company-management-tabs')
const $sections = $('.company-management-content')
const $tableList = {
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
                edit: (row, prop, target) => `class="edit-company-${prop}" title="Edit selected ${prop}" data-target="${target}" data-id="${row._companyId}" data-since="${row.since}" href=""`,
                delete: (row, prop, target) => `class="delete-company-${prop} ml-1" title="Delete selected ${prop}" data-target="${target}" data-id="${row._companyId}" data-since="${row.since}" href=""`,
            },
        }

console.table(addresses) //! TEMP

        const list = {
            phones: '',
            faxes: !faxes.length ? `${defs.a(4)}No faxes registered yet${defs.b}` : '',
            emails: !emails.length ? `${defs.a(4)}No emails registered yet${defs.b}` : '',
        }

        phones.map((row, i) => {
            list.phones += `<tr><td>${!i ? defs.current : ''}</td>`
            list.phones += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.phones += `<td>${formatTel(row.phone)}</td>`
            list.phones += `<td class="has-text-right controls">`
            list.phones += `<a ${defs.aAttr.edit(row, 'phone', 'phones')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            if (!row.initial) list.phones += `<a ${defs.aAttr.delete(row, 'phone', 'phones')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.phones += '</td></tr>'
        })

        faxes.map((row, i) => {
            list.faxes += `<tr><td>${!i ? defs.current : ''}</td>`
            list.faxes += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.faxes += `<td>${formatTel(row.fax)}</td>`
            list.faxes += `<td class="has-text-right controls">`
            list.faxes += `<a ${defs.aAttr.edit(row, 'fax', 'faxes')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.faxes += `<a ${defs.aAttr.delete(row, 'fax', 'faxes')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.faxes += '</td></tr>'
        })

        emails.map((row, i) => {
            list.emails += `<tr><td>${!i ? defs.current : ''}</td>`
            list.emails += `<td class="effective-date">${moment(row.since).format('ll') + (row.initial ? defs.init : '')}</td>`
            list.emails += `<td>${row.email}</td>`
            list.emails += `<td class="has-text-right controls">`
            list.emails += `<a ${defs.aAttr.edit(row, 'email', 'emails')}><i class="fa fa-pen-to-square has-text-success-45"></i></a>`
            list.emails += `<a ${defs.aAttr.delete(row, 'email', 'emails')}><i class="fa fa-trash has-text-danger-60"></i></a>`
            list.emails += '</td></tr>'
        })

        $tableList.phones.html(list.phones)
        $tableList.faxes.html(list.faxes)
        $tableList.emails.html(list.emails)
    },
})