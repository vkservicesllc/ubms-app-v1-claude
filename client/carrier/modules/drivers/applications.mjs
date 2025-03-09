import Person from '/modules/assets/person.mjs'
import Address from '/modules/assets/address.us.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'
import filterDropdown from '/modules/tools/filter-dropdown.mjs'


const interval = 60000
const conditions = {
    p: [ 'In progress...', 'spinner' ],
    c: [ 'Completed', 'blue text clock' ],
    a: [ 'Approved', 'dark green text thumbs up' ],
    r: [ 'Rejected', 'red text thumbs down' ],
    h: [ 'Hired', 'truck moving' ],
}

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
                user: $('#user-filter').val(),
                companies: $('#company-filter').val(),
                conditions: $('#condition-filter').val(),
            }
        },
    },
    processing: true,
    serverSide: true,

    columns: [

        {
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
            data(row) {
                const { busName, coType } = row

                return escapeHTML(`${busName}, ${coType}`)
            },
        },

        {
            data: null,
            title: 'User',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                return null //! need to render user First Name + Init of LastName
            },
        },

        {
            data: null,
            orderable: false,
            searchable: false,
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

        const { permissions } = data    ;console.log(permissions); //!TEMP
        const api = this.api()

        if (permissions === true || permissions['d:drv/apl'].includes('2'))
            $(api.column(api.columns().count() - 1).header())
                .html('<button class="ui mini circular right floated basic violet icon button" id="create-apl"><i class="plus icon"></i></button>')

        const toolbar = $('<div class="custom-dt-toolbar"></div>')
        const dropdown = {
            company: filterDropdown('company-filter', 'Companies', { multiple: true, clearable: true, element: 'div' }),
            user: filterDropdown('user-filter', 'User', { clearable: true }),
            condition: filterDropdown('condition-filter', 'Conditions', { multiple: true, clearable: true, element: 'div' })
        }

        for (const value in conditions) {
            const option = conditions[value]

            dropdown.condition.find('.menu').append(`<div class="item" data-value="${value}" data-text="<i class='${option[1]} icon'></i>">${option[0]}</div>`)
        }

        $.ajax('/api/drivers/applications/companies', {
            method: 'POST',
            success(companies) {
                if (companies) {
                    companies.forEach(company => {
                        const { _carrierId, active, until, name, alias } = company
                        let color = 'green'
                        if (until) name += 'red'
                        else if (!active) name += 'blue'

                        dropdown.company.find('.menu').append(`<div class="item" data-value="${_carrierId}" data-text="${alias}"><div class="ui ${color} empty circular label"></div>${name}</div>`)
                    })
                }

                toolbar.append(dropdown.user) // USERS IN 'd:drv/apl' permission group for "Assign User" and USERS in applications by userId in Filter
                toolbar.append(dropdown.company)
                toolbar.append(dropdown.condition)

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

    order: [ 7, 'desc' ],

})



setInterval(() => {
    dtFnFilterData(table)
}, interval)