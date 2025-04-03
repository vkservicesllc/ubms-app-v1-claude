import Person from '/modules/assets/person.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'
import filterDropdown from '/modules/tools/filter-dropdown.mjs'
import { sortArrayByObjectKey } from '/modules/tools/sorter.mjs'


const interval = 60000
const conditions = {
    p: [ '<span class="ui grey text">In progress...</small>', 'spinner' ],
    c: [ '<span class="ui blue text">Completed</small>', 'blue text clock' ],
    a: [ '<span class="ui dark green text">Approved</small>', 'dark green text thumbs up' ],
    r: [ '<span class="ui red text">Rejected</small>', 'red text thumbs down' ],
    h: [ 'Hired', 'truck moving' ],
}
const positions = $.ajax('/api/assets/driver?filter=positions', { method: 'POST', async: false }).responseJSON
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
const searchTag = '<sup><i class="small grey text search icon"></i></sup>'

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
        dataSrc(response) {
            const { data, actions, aplAddress } = response

            data.forEach(row => {
                row.actions = actions
                if (row.condition = 'p')
                    row.aplAddress = aplAddress + row.formId
            })

            return data
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
            title: `Form ID ${searchTag}`,
            orderable: false,
            render(data) {
                return escapeHTML(data)
            },
        },

        {
            data: 'lastName',
            title: `Last Name ${searchTag}`,
            orderable: false,
            render(data, type, row) {
                return escapeHTML(new Person(row).fullLastName())
            },
        },

        {
            data: 'firstName',
            title: `First Name ${searchTag}`,
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
            title: `Phone ${searchTag}`,
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
                let state = row.dlState || null

                return state
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
            data: null,
            title: 'Applied on',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                data = row.finishedAt || row.createdAt

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
                
                return escapeHTML(new Person({ firstName, lastName, alias }).fullName('Al'))
            },
        },

        {
            data: null,
            searchable: false,
            orderable: false,
            className: 'right aligned',
            width: '120px',
            render(data, type, row) {
                const { _id, condition } = row
                const { comment, modify, delete: remove } = row.actions.data
                const { access } = row.actions.file

                let panel = ''

                if (condition != 'p') {
                    if (modify) {
                        panel += `<a class="modify-apl"><i class="black text edit outline icon"></i></a>`
                        panel += `<a class="assign-apl"><i class="black clipboard outline icon"></i></a>`
                    }
                    if (access) panel += `<a class="assign-apl"><i class="black folder outline icon"></i></a>`
                    if (comment) panel += `<a class="comment-apl"><i class="black text comment outline icon"></i></a>`
                } else panel += `<a class="apl-external-form" href="${row.aplAddress}" target="_blank"><i class="blue text external alternate icon"></i></a>`
                if (remove && ['p', 'c'].includes(condition))
                    panel += `<a class="delete-apl" data-id="${_id}" href=""><i class="red text trash alternate outline icon"></i></a>`

                return panel
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
                $(row).css('color', '#4169E1')
                break
            case 'a':
                $(row).css('color', 'green')
                break
            case 'r':
                $(row).css('color', '#DC143C')
                break
            case 'h':
                [2, 3].forEach(idx => $('td', row).eq(idx).css({ fontWeight: 'bold' }))
                break
        }
    },

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    initComplete(settings, data) {
        styleSearch()

        const toolbar = $('<div class="custom-dt-toolbar"></div>')
        const dropdown = {
            condition: filterDropdown('condition-filter', 'Conditions', { multiple: true, clearable: true, element: 'div' }),
            position: filterDropdown('position-filter', 'Positions', { multiple: true, clearable: true, element: 'div' }),
            company: filterDropdown('company-filter', 'Companies', { multiple: true, clearable: true, element: 'div' }),
            user: filterDropdown('user-filter', 'User', { clearable: true, element: 'div' }),
        }

        dropdown.position.find('.menu').append(`<div class="item" data-value="null" data-text="<i class='red text user slash icon'></i>"><span class="ui red text">Undecided</span></div>`)
        dropdown.company.find('.menu').append(`<div class="item" data-value="null" data-text="<i class='red text handshake slash icon'></i>"><span class="ui red text">Unassigned</span></div>`)
        dropdown.user.find('.menu').append(`<div class="item" data-value="null" data-text="<span class='ui red text'><i>Not assigned to User</span>"><span class="ui red text">Unassigned</span></div>`)

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
                        const person = new Person({ firstName, lastName, alias })

                        user.name = person.fullName('AL')
                        user.shortName = person.fullName('Al')
                    })

                    const self = users.filter(user => user.self === true)[0]
                    const others = sortArrayByObjectKey(users.filter(user => user.self === false), 'name')

                    if (self)
                        dropdown.user.find('.menu').append(`<div class="item" data-value="${self._id}" data-text="<span class='ui dark blue text'><i><b>My Applicants</b></i></span>">${self.name} <small>(self)</small></div>`)
                    others.forEach(user => {
                        const { _id, name, shortName } = user

                        dropdown.user.find('.menu').append(`<div class="item" data-value="${_id}" data-text="<small>Assigned to</small> <b>${shortName}</b>">${name}</div>`)
                    })
                }

                toolbar.append(dropdown.condition)
                toolbar.append(dropdown.position)
                toolbar.append(dropdown.company)
                toolbar.append(dropdown.user)

                $('.dt-length').after(toolbar)

                $('.custom-dt-dropdown')
                    .dropdown()
                    .on('change', function() {
                        const length = $(this).dropdown('get value').length
                        $(this).siblings('.label')[length ? 'addClass' : 'removeClass']('blue')

                        $(this).blur()
                        table.ajax.reload()
                    })

                $('#dt-search-0')
                    .on('input', function() {
                        $(this).val($(this).val().replace(/\W/gi, ''))
                    })

                $('.dt-length, .dt-search, .custom-dt-toolbar').css('visibility', 'visible')
            },
        })


    },

    language: {
        emptyTable: '<span class="ui red text">No applications at this time</span>',
    },

    lengthMenu,

})


setInterval(() => {
    dtFnFilterData(table)
}, interval)


export default table