import Person from './assets/person.mjs'
import Address from './assets/address.us.mjs'
import { tel as formatTel } from './tools/formatter.mjs'


const statusReq = $.ajax('/api/session/status?key=0', { method: 'POST' })

$.when(statusReq).done(statusRes => {
    const [ adminStatus ] = statusRes
    const interval = 30000

    let emptyTableMsg = 'No companies registered at this time'
    if (adminStatus == 'A') emptyTableMsg = 'No companies to display'

    const table = new DataTable('#companies-table', {

        ajax: {
            url: '/api/companies',
            dataSrc(response) {
                const { data: companies } = response
                let owners = []
                const names = []

                companies.map(company => {
                    const { confirmed, owner } = company

                    if (!confirmed)
                        company.group = '<small class="has-text-weight-normal has-text-danger">... pending</small>'

                    owner.name = new Person(owner).fullName()
                    owners.push({ [owner._id]: owner.name })
                })

                owners = Array.from(new Set(owners.map(owner => JSON.stringify(owner)))).map(str => JSON.parse(str))

                owners.map(owner => {
                    const name = Object.values(owner)[0]
                    names.push(name)
                })

                let dublicates = names.filter((name, i) => names.indexOf(name) !== i)
                dublicates = [ ...new Set(dublicates) ]

                companies.forEach((company, i) => {
                    const { owner} = company
                    const { name } = owner
                    if (dublicates.includes(name))
                        owner.name += ` <small class="has-text-grey">(${owner.age} yo)</small>`
                })

                return companies
            },
        },

        columns: [

            {
                data: 'group',
                title: 'Group',
                visible: false,
                searchable: false,
            },

            {
                data: 'category',
                title: 'Category',
                visible: false,
                searchable: false,
            },

            {
                data: 'active',
                searchable: false,
                orderable: false,
                width: '120px',
                render(data, type, row) {
                    if (!row.confirmed) return `<i class="fa fa-hourglass-half has-text-primary"></i>`
                    let txt = data ? 'success-dark">Active' : 'danger-dark">Inactive'

                    return `<small class="has-text-${txt}</small>`
                },
            },

            {
                data: 'alias',
                orderable: false,
                width: '5%',
                render(data, type, row) {
                    return `<span class="box py-0" data-target="${row._id}">${data}</span>`
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
                render(data) {
                    return `<span class="has-text-weight-semibold">${data}</span>`
                },
            },

            {
                data: 'since',
                title: 'Launch Date',
                searchable: false,
                width: '150px',
                className: 'has-text-left',
                render(data, type) {
                    return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
                },
            },

            {
                data: 'owner',
                title: 'Owner',
                render(data) {
                    return data.name
                },
            },

            {
                data: 'address',
                title: 'State',
                render(data) {
                    if (!data.physical.state) return

                    return data.physical.state[1]
                }
            },

            {
                data: 'address',
                title: 'Address',
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
                data: null,
                title: adminStatus != 'A' ? '<div class="dt-action"><a class="has-text-link-70" href="/business/company/new" title="Add"><i class="fas fa-plus"></i></a></div>' : '',
                orderable: false,
                searchable: false,
                visible: adminStatus != 'A',
                render(data, type, row) {
                    let cell = ''

                    if (adminStatus != 'A') {
                        let fa, url = '/business'

                        if (row.confirmed) {
                            const category = row.category.toLowerCase()
                            const { route } = row
                            fa = 'file-lines'
                            url += `/${category}/${route}`
                        } else {
                            fa = 'pen-to-square'
                            url += `/company/${row._id}`
                        }

                        cell = '<div class="dt-action">'
                        cell += `<a class="has-text-success-45 modify-company" href="${url}" title="Modify"><i class="fas fa-${fa}"></i></a>`
                        cell += '</div>'
                    }

                    return cell
                },
            },

        ],

        createdRow(tr, data) {
            if (!data.active) $(tr).addClass('is-warning')
        },

        language: {
            emptyTable: `<span class="has-text-danger">${emptyTableMsg}</span>`,
        },

        lengthMenu,

        order: [ [ 4, 'asc' ] ],

        rowGroup: {
            dataSrc(row) {
                return row.group
            },
        },

    })

    setInterval(() => {
        dtFnFilterData(table)
    }, interval)

    onDraw(table)
})