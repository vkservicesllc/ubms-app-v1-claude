import Person from './tools/core/person.mjs'
import Address from './tools/core/address.us.mjs'
import escapeHTML from './tools/utils/html.mjs'
import { tel as formatTel } from './tools/utils/formatter.mjs'


const interval = 30000
let refreshed = false


const table = $('#parents-table').DataTable({

    ajax: {
        url: '/api/resource/companies?category=hld',
        dataSrc(response) {
            const { data } = response
            console.log(data)
            return data
        },
    },

    columns: [

        {
            data: 'active',
            searchable: false,
            orderable: false,
            width: '8.57rem',
            render(data, type, row) {
                if (row.until) return `<small class="has-text-danger-55" title="Permanently closed on ${moment(row.until).format('ll')}">Closed</small>`
                if (!row.confirmed) return '<i class="fa fa-hourglass-half has-text-primary"></i>'
                let txt = data ? 'success-dark">Active' : 'danger-dark">Inactive'

                return `<small class="has-text-${txt}</small>`
            },
        },
        
        {
            data: 'alias',
            orderable: false,
            width: '5%',
            render(data, type, row) {
                return `<span class="box py-0" data-target="${row._id}">${escapeHTML(data)}</span>`
            },
            createdCell(cell, data, row) {
                const { style } = row

                if (style) {
                    const $box = $(cell).find('.box')
                    const { background, color } = style

                    if (background) $box.css('background-color', background)
                    if (color) $box.css('color', color)
                }
            },
        },
        
        {
            data: 'name',
            title: 'Name',
            render(data, type, row) {
                let link = ''
                if (row.website)
                    link = `&nbsp; <a href="https://${row.website}" target="_blank"><i class="fa fa-arrow-up-right-from-square has-text-grey is-size-7"></i></a>`

                return `<span class="has-text-weight-semibold">${escapeHTML(data) + link}</span>`
            },
        },

        {
            data: 'since',
            title: 'Launch Date',
            searchable: false,
            width: '10.7rem',
            className: 'has-text-left',
            render(data, type) {
                if (data === '0000-00-00') return
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            data: 'owner',
            title: 'Owner',
            render(data, type, row) {
                return data.name
            },
        },
        
        {
            data: 'address',
            title: 'Base State',
            searchable: false,
            render(data) {
                if (!data.physical.state) return

                return data.physical.expansion.state
            }
        },

        {
            data: 'address',
            title: 'Address',
            searchable: false,
            orderable: false,
            render(data) {
                return new Address(data.physical).html()
            },
        },

        {
            data: 'phone',
            title: 'Phone',
            orderable: false,
            render(data) {
                return formatTel(data)
            },
        },

        {
            data: 'fax',
            title: 'Fax',
            orderable: false,
            render(data) {
                if (!data) return
                return formatTel(data)
            },
        },

        {
            data: 'lastLogo',
            title: 'Logo',
            orderable: false,
            render(data) {
                return data
                    ? '<span class="has-text-success-dark"><i class="fa fa-check"></i></span>'
                    : '<span class="has-text-danger-dark"><i class="fa fa-close"></i></span>'
            }
        },

        {
            data: null,
            orderable: false,
            searchable: false,
            render(data, type, row) {
                let fa, url = '/business'

                if (row.confirmed) {
                    const category = row.expansion.path[1]
                    const { route } = row
                    fa = 'file-lines'
                    url += `/${category}/${route}`
                } else {
                    fa = 'pen-to-square'
                    url += `/company/${row._id}`
                }

                let cell = '<div class="dt-action">'
                cell += `<a class="has-text-success-45 modify-company" href="${url}" title="Modify"><i class="fas fa-${fa}"></i></a>`
                cell += '</div>'

                return cell
            },
        },

    ],

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