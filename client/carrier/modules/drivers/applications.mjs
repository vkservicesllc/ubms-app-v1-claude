import Person from '/modules/assets/person.mjs'
import Address from '/modules/assets/address.us.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'


const interval = 60000

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
                companies: $('#company-filter').val(),
                condition: $('#condition-filter').val(),
                decision: $('#decision-filter').val(),
            }
        },
    },
    processing: true,
    serverSide: true,

    columns: [

        {
            orderable: false,
            data(row) {
                const { complete, decision } = row
                if (!complete) return null

                const icon = { a: 'dark green text thumbs up', r: 'red text thumbs down', p: 'blue text clock', h: 'truck moving' }
                return `<i class="${icon[decision]} icon"></i>`
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
            data: 'dob',
            title: 'DOB',
            searchable: false,
            orderable: false,
            render(data, type) {
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
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
            title: 'Address',
            orderable: false,
            render(data, type, row) {
                return null //! need to render address HTML
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
        if (!data.complete) $(row).css({ backgroundColor: '#FFE9EC', color: 'grey' })
        else if (data.decision == 'p') $(row).css({ backgroundColor: '#FFF9E6', color: '#4169E1' })
        else if (data.decision == 'r') $(row).css('color', '#FAA0A0')
        else if (data.decision == 'a') $(row).css('color', 'green')
        else [4, 5].forEach(idx => $('td', row).eq(idx).css({ fontWeight: 'bold', color: 'indigo' }))
    },

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    initComplete(settings, data) {
        styleSearch()

        const { permissions } = data    ;console.log(permissions); //!TEMP
        const api = this.api()

        if (permissions === true || permissions['d:drv/apl'].includes('2'))
            $(api.column(10).header())
                .html('<button class="ui mini circular right floated basic violet icon button" id="create-apl"><i class="plus icon"></i></button>')

        const buildDropdown = (id, placeholder) =>
            $(`<div class="ui labeled input"><div class="ui label"><i class="filter icon"></i></div><select class="ui fluid clearable dropdown labeled icon custom-dt-dropdown" id="${id}" multiple><option value="">${placeholder}</option></select></div>`)
        const toolbar = $('<div class="custom-dt-toolbar"></div>')
        const dropdown = {
            company: $('<div class="ui labeled input"><div class="ui label"><i class="filter icon"></i></div><div class="ui fluid multiple clearable selection dropdown custom-dt-dropdown"><input type="hidden" id="company-filter"><i class="dropdown icon"></i><div class="default text">Companies</div><div class="menu"></div></div></div>'),
            condition: buildDropdown('condition-filter', 'Condition'),
            decision: buildDropdown('decision-filter', 'Decision'),
        }

        const conditions = [ { 'Complete': true } , { 'Incomplete': false } ]
        const decisions = { p: 'Pending', h: 'Hired', a: 'Approved', r: 'Rejected' }

        conditions.forEach(condition => {
            const option = Object.keys(condition)[0]
            const value = Object.values(condition)[0]

            dropdown.condition.find('select').append(`<option value="${value}">${option}</option>`)
        })
        for (const value in decisions) {
            const option = decisions[value]

            dropdown.decision.find('select').append(`<option value="${value}">${option}</option>`)
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

                toolbar.append(dropdown.company)
                toolbar.append(dropdown.condition)
                toolbar.append(dropdown.decision)

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

    order: [ 2, 'desc' ],

})



setInterval(() => {
    dtFnFilterData(table)
}, interval)