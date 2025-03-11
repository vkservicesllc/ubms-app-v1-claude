import Person from '/modules/assets/person.mjs'
import Address from '/modules/assets/address.us.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'
import filterDropdown from '/modules/tools/filter-dropdown.mjs'
import { sortArrayByObjectKey } from '/modules/tools/sorter.mjs'


const interval = 180000
const conditions = {
    p: [ '<span class="ui grey text">In progress...</small>', 'spinner' ],
    c: [ '<span class="ui blue text">Completed</small>', 'blue text clock' ],
    a: [ '<span class="ui dark green text">Approved</small>', 'dark green text thumbs up' ],
    r: [ '<span class="ui red text">Rejected</small>', 'red text thumbs down' ],
    h: [ 'Hired', 'truck moving' ],
}
const positions = {
    'CD': 'Company Driver',
    'OO': 'Owner Operator',
    'OD': 'Driver for Owner',
    'LP': 'Lease Purchaser',
}
const defaultContent = '<span style="color: pink; font-size: .9em;">Unassigned</span>'

const styleSearch = () => {
    $('.dt-search').find('label').remove()

    const $search = $('.dt-search input[type="search"]')
    const $preserved = $search.detach()
    const $structure = $('<div class="ui labeled input"><div class="ui label"><i class="search icon"></i></div></div>')

    $preserved
        .addClass("ui input")
        .removeClass("dt-search")
        .appendTo($structure)

    $('.dt-search').replaceWith($structure)
}

const table = $('#driver-apl-table').DataTable({

    ajax: {
        url: '/api/drivers/applications',
        data(search) {
            search.filter = {
                conditions: $('#condition-filter').val(),
                positions: $('#position-filter').val(),
                companies: $('#company-filter').val(),
                user: $('#user-filter').val(),
            }
        },
    },
    processing: true,
    serverSide: true,

    columns: [

        {
            searchable: false,
            orderable: false,
            data(row) {
                const { condition } = row

                return `<i class="${conditions[condition][1]} icon"></i>`
            },
        },

        {
            data: 'formId',
            title: 'Form ID',
            orderable: false,
            render(data) {
                return escapeHTML(data)
            },
        },

        {
            data: 'lastName',
            title: 'Last Name',
            orderable: false,
            render(data, type, row) {
                return escapeHTML(new Person(row).fullLastName())
            },
        },

        {
            data: 'firstName',
            title: 'First Name',
            orderable: false,
            render(data, type, row) {
                return escapeHTML(new Person(row).fullFirstName())
            },
        },

        {
            title: 'Age',
            searchable: false,
            orderable: false,
            type: 'string',
            data(row) {
                row.dob = moment(row.dob).format('YYYY-MM-DD')
                return new Person(row).age
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
            title: 'State',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                return null //! need to render state from address HTML
            },
        },

        {
            data: 'position',
            title: 'Position',
            searchable: false,
            orderable: false,
            defaultContent: '<span style="color: pink; font-size: .9em;">Undecided</span>',
            render(data) {
                return positions[data]
            },
        },

        {
            data: 'appliedOn',
            title: 'Applied on',
            searchable: false,
            orderable: false,
            render(data, type) {
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            title: 'Company',
            searchable: false,
            orderable: false,
            defaultContent,
            data(row) {
                const { busName, coType } = row
                if (!busName || !coType) return null

                return escapeHTML(`${busName}, ${coType}`)
            },
        },

        {
            data: null,
            title: 'User',
            searchable: false,
            orderable: false,
            defaultContent,
            render(data, type, row) {
                const { userFirstName: firstName, userLastName: lastName, userAlias: alias } = row
                if (!lastName) return null
                
                return escapeHTML(new Person({ firstName: alias || firstName, lastName }).fullName('Fl'))
            },
        },

        {
            data: null,
            searchable: false,
            orderable: false,
            className: 'right aligned',
            render(data, type, row) {
                return '{Button Panel}'
            },
            createdCell(cell) {
                $(cell).css({ color: 'black', fontWeight: 'normal' })
            },
        },

    ],

    createdRow(row, data) {
        switch (data.condition) {
            case 'p':
                $(row).css({ backgroundColor: '#FFE9EC', color: 'grey' })
                break
            case 'c':
                $(row).css({ backgroundColor: '#FFF9E6', color: '#4169E1' })
                break
            case 'a':
                $(row).css('color', 'green')
                break
            case 'r':
                $(row).css('color', '#FAA0A0')
                break
            case 'h':
                [2, 3].forEach(idx => $('td', row).eq(idx).css({ fontWeight: 'bold', color: 'indigo' }))
                break
        }
    },

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    initComplete(settings, data) {
        styleSearch()

        const { permissions } = data
        const api = this.api()

        if (permissions === true || permissions['d:drv/apl'].includes('2'))
            $(api.column(api.columns().count() - 1).header())
                .html('<button class="ui mini circular right floated basic violet icon button" id="create-apl"><i class="plus icon"></i></button>')

        const toolbar = $('<div class="custom-dt-toolbar"></div>')
        const dropdown = {
            condition: filterDropdown('condition-filter', 'Conditions', { multiple: true, clearable: true, element: 'div' }),
            position: filterDropdown('position-filter', 'Positions', { multiple: true, clearable: true, element: 'div' }),
            company: filterDropdown('company-filter', 'Companies', { multiple: true, clearable: true, element: 'div' }),
            user: filterDropdown('user-filter', 'User', { clearable: true, element: 'div' }),
        }

        dropdown.position.find('.menu').append(`<div class="item" data-value="null" data-text="<i class='question icon'></i>"><span class="ui red text">Undecided</span></div>`)
        dropdown.company.find('.menu').append(`<div class="item" data-value="null" data-text="<i class='question icon'></i>"><span class="ui red text">Unassigned</span></div>`)
        dropdown.user.find('.menu').append(`<div class="item" data-value="null"><span class="ui red text">Unassigned</span></div>`)

        for (const value in conditions) {
            const option = conditions[value]

            dropdown.condition.find('.menu').append(`<div class="item" data-value="${value}" data-text="<i class='${option[1]} icon'></i>">${option[0]}</div>`)
        }

        for (const value in positions) {
            const option = positions[value]

            dropdown.position.find('.menu').append(`<div class="item" data-value="${value}" data-text="${value}">${option}</div>`)
        }

        $.ajax('/api/drivers/applications/filters', {
            method: 'POST',
            success(filters) {
                const { companies, users } = filters

                if (companies) {
                    companies.forEach(company => {
                        const { _carrierId, active, until, name, alias } = company
                        let color = 'green'
                        if (until) name += 'red'
                        else if (!active) name += 'blue'

                        dropdown.company.find('.menu').append(`<div class="item" data-value="${_carrierId}" data-text="${alias}"><div class="ui ${color} empty circular label"></div>${name}</div>`)
                    })
                }
                if (users) {
                    users.forEach(user => {
                        const { firstName, lastName, alias } = user

                        user.name = new Person({ firstName, lastName, alias }).fullName('Al')
                    })

                    const self = users.filter(user => user.self === true)[0]
                    const others = sortArrayByObjectKey(users.filter(user => user.self === false), 'name')

                    if (self)
                        dropdown.user.find('.menu').append(`<div class="item" data-value="${self._id}" data-text="SELF">${self.name} <small>(self)</small></div>`)
                    others.forEach(user => {
                        const { _id, name } = user

                        dropdown.user.find('.menu').append(`<div class="item" data-value="${_id}">${name}</div>`)
                    })
                }

                toolbar.append(dropdown.condition)
                toolbar.append(dropdown.position)
                toolbar.append(dropdown.company)
                toolbar.append(dropdown.user) // USERS IN 'd:drv/apl' permission group for "Assign User" and USERS in applications by userId in Filter

                $('.dt-length').after(toolbar)

                $('.custom-dt-dropdown')
                    .dropdown()
                    .on('change', function() {
                        const length = $(this).dropdown('get value').length
                        $(this).siblings('.label')[length ? 'addClass' : 'removeClass']('blue')

                        $(this).blur()
                        table.ajax.reload()
                    })

                $('.dt-length, .dt-search, .custom-dt-toolbar').css('visibility', 'visible')
            },
        })


    },

    language: {
        emptyTable: '<span class="ui red text">No applications at this time</span>',
    },

    lengthMenu,

    order: [ 8, 'desc' ],

})



setInterval(() => {
    dtFnFilterData(table)
}, interval)