import Person from './tools/core/person.mjs'
import Address from './tools/core/address.us.mjs'
import escapeHTML from './tools/utils/html.mjs'
import { tel as formatTel } from './tools/utils/formatter.mjs'


const interval = 30000
let refreshed = false


const table = $('#parents-table').DataTable({

    ajax: {
        // url: '/api/resource/companies?category=hld',
        url: '/api/resource/company-parents',
        dataSrc(response) {
            const { data } = response
            return data
        },
    },

    columns: [

        {
            data: null,
            visible: false,
        },

        {
            data: null,
            searchable: false,
            orderable: false,
            width: '8.57rem',
            render(data, type, row) {
                if (row.parent.until) return `<small class="has-text-danger-55" title="Permanently closed on ${moment(row.until).format('ll')}">Closed</small>`
                if (!row.parent.confirmed) return '<i class="fa fa-hourglass-half has-text-primary"></i>'
                let txt = row.parent.active ? 'success-dark">Active' : 'danger-dark">Inactive'

                return `<small class="has-text-${txt}</small>`
            },
        },
        
        {
            data: null,
            title: 'Name',
            render(data, type, row) {
                let link = ''
                if (row.website)
                    link = `&nbsp; <a href="https://${row.website}" target="_blank"><i class="fa fa-arrow-up-right-from-square has-text-grey is-size-7"></i></a>`
                data = escapeHTML(row.parent.name)
                data += ` <small style="font-weight: normal;">(${row.parent.alias})</small>`

                return `<span class="has-text-weight-semibold">${data + link}</span>`
            },
        },

        {
            data: null,
            title: 'Launch Date',
            searchable: false,
            width: '10.7rem',
            className: 'has-text-left',
            defaultContent: '<i class="has-text-danger">TBD</i>',
            render(data, type, row) {
                data = row.parent.since
                if (data === '0000-00-00') return
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            data: null,
            title: 'Address',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                return new Address(row.parent.address).html()
            },
        },

        {
            data: null,
            title: 'Phone',
            orderable: false,
            render(data, type, row) {
                return formatTel(row.parent.phone)
            },
        },

        {
            data: null,
            title: 'Fax',
            orderable: false,
            render(data, type, row) {
                if (!row.parent.fax) return
                return formatTel(row.parent.fax)
            },
        },

        {
            data: 'count',
            searchable: false,
            orderable: false,
            render(data) {
                const count = data.companies
                const tag = !count ? 'span' : 'a' // add trigger and attributes

                let cell = '<div class="field is-grouped is-grouped-multiline">'
                cell += '<div class ="control"><div class="tags has-addons">'
                cell += `<${tag} class="tag has-text-weight-semibold${!data.companies ? ' has-text-danger' : ''}">Companies</${tag}>`
                cell += `<span class="tag is-${!data.companies ? 'danger' : 'success'}">${data.companies}</span>`
                cell += '</div></div>'
                cell += '</div>'

                return cell
            },
        },

        {
            data: null,
            orderable: false,
            searchable: false,
            render(data, type, row) {
                let fa, url = '/business'

                if (row.parent.confirmed) {
                    const { route } = row.parent
                    fa = 'file-lines'
                    url += `/parent/${route}`
                } else {
                    fa = 'pen-to-square'
                    url += `/company/${row._companyId}`
                }

                let cell = '<div class="dt-action">'
                cell += `<a class="has-text-success-45 modify-company" href="${url}" title="Modify"><i class="fas fa-${fa}"></i></a>`
                cell += '</div>'

                return cell
            },
        },

    ],

    createdRow(tr, data) {
        if (data.parent.until) $(tr).find('td').css('color', 'grey')
        else if (!data.parent.active) $(tr).addClass('is-warning')
    },

    language: {
        emptyTable: `<span class="has-text-danger">No holding companies registered at this time</span>`,
    },

    lengthMenu: [
        [ 10, 50, 100, -1],
        [ 10, 50, 100, 'All' ],
    ],

})


setInterval(() => {
    dtFnFilterData(table)
    refreshed = true
}, interval)

onDraw(table)