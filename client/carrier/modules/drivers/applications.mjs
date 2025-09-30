import Person from '/modules/tools/core/person.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import styleSearch, { tag as searchTag } from '/modules/tools/search.mjs'
import filterDropdown from '/modules/tools/filter-dropdown.mjs'


const interval = 60000
const conditions = {
    p: [ '<span class="ui grey text">In progress...</span>', 'spinner' ],
    c: [ '<span class="ui blue text">Completed</span>', 'blue text clock' ],
    a: [ '<span class="ui dark green text">Approved</span>', 'dark green text thumbs up' ],
    r: [ '<span class="ui orange text">Waiting List</span>', 'orange text hourglass half' ],
    b: [ '<span class="ui red text">Disqualified</span>', 'red text thumbs down' ],
    h: [ 'Hired', 'truck moving' ],
}
const positions = $.ajax('/api/source/driver?filter=positions', { method: 'POST', async: false }).responseJSON
const defaultContent = '<i style="color: pink; font-size: .9em;">Unassigned</i>'

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
            const { data, actions, aplAddress, unscoped, stepLen } = response

            table?.column(12).visible(unscoped)

            data.forEach(row => {
                row.actions = actions
                row.stepLen = stepLen
                if (row.condition == 'p')
                    row.aplAddress = aplAddress + row.formId
            })

            return data
        },
    },

    columns: [

        {
            searchable: false,
            orderable: false,
            data(row) {
                const { step, stepLen } = row
                let { condition } = row
                const progress = condition === 'p' ? ` ${step < stepLen ? Math.round(step / stepLen * 100) : 100}%` : ''
                condition = conditions[condition]

                let data = `<span title="${$(condition[0]).text() + progress}"><i class="${condition[1]} icon"></i></span>`

                if (row.dob !== row.originalDob || row.sex !== row.originalSex)
                    data += `<span title="Identity Error: False DOB or Gender"><i class="ui red exclamation triangle icon"></i></span>`

                if (row.marital === 'm') {
                    let { sex, benefRelation, benefOtherRel } = row

                    if (benefRelation) benefRelation = benefRelation.toLowerCase().trim()
                    if (benefOtherRel) benefOtherRel = benefOtherRel.toLowerCase().trim()

                    switch (true) {
                        case sex === 0 && (benefRelation === 'wife' || benefOtherRel === 'wife'):
                        case sex === 1 && (benefRelation === 'husband' || benefOtherRel === 'husband'):
                            data += `<span title="Logical Error: Incorrect Gender"><i class="ui red exclamation triangle icon"></i></span>`
                            break
                    }
                }

                if (
                    row.firstName !== row.originalFirstName ||
                    row.middleName !== row.originalMiddleName ||
                    row.lastName !== row.originalLastName ||
                    row.suffix !== row.originalSuffix
                )
                    data += `<span title="Identity Warning: Name Mismatch"><i class="ui orange id badge outline icon"></i></span>`

                if (step > 2 && !row.medCard)
                    data += `<span title="Fitness Warning: No Medical Card"><i class="ui orange first aid icon"></i></span>`

                if (step > 8 && !row.activeBusiness)
                    data += `<span title="Warning: No Active LLC"><i class="ui orange briefcase icon"></i></span>`

                if (step > 3) {
                    if (row.criminal)
                        data += `<span title="Red Flag: Misdemeanor/Felony in the Past"><i class="ui red skull crossbones icon"></i></span>`
                    if (row.dui)
                        data += `<span title="Red Flag: DUI/DWI in the Past"><i class="ui red wine bottle icon"></i></span>`
                    if (row.dotDat)
                        data += `<span title="Red Flag: Refused/Failed Drug/Alcohol Test in the Past"><i class="ui red prescription bottle icon"></i></span>`
                }

                return data
            },
        },

        {
            data: 'formId',
            title: `Form ID ${searchTag}`,
            orderable: false,
            render(data) {
                return escapeHTML(data)
            },
            createdCell(td) {
                $(td).css('font-family', 'monospace')
            },
        },

        {
            data: 'lastName',
            title: `Last Name ${searchTag}`,
            orderable: false,
            render(data, type, row) {
                data = escapeHTML(new Person(row).fullLastName())

                const { originalLastName, originalSuffix } = row
                if (row.lastName !== originalLastName || row.suffix !== originalSuffix) {
                    const original = new Person({ ...row, lastName: originalLastName, suffix: originalSuffix })

                    data += ` <small><span class="ui orange text">(${escapeHTML(original.fullLastName())})</span></small>`
                }

                return data
            },
        },

        {
            data: 'firstName',
            title: `First Name ${searchTag}`,
            orderable: false,
            render(data, type, row) {
                data = escapeHTML(new Person(row).fullFirstName())

                const { originalFirstName, originalMiddleName } = row
                if (row.firstName !== originalFirstName || row.middleName !== originalMiddleName) {
                    const original = new Person({ ...row, firstName: originalFirstName, middleName: originalMiddleName })

                    data += ` <small><span class="ui orange text">(${escapeHTML(original.fullFirstName())})</span></small>`
                }

                return data
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
            data: 'state',
            title: 'State',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                const { dlState } = row
                if (dlState && data !== dlState) data += ` <small>(${dlState})</small>`

                return data
            },
        },

        {
            data: 'position',
            title: 'Position',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                data = positions[data]
                if (row.dlCommercial) data += ` <sup title="Commercial Driver's License"><small><i class="green star outline icon"></i></small></sup>`

                return data
            },
        },

        {
            data: 'createdAt',
            title: 'Applied on',
            searchable: false,
            orderable: false,
            type: 'string',
            render(data, type) {
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            data: 'finishedAt',
            title: 'Submitted on',
            searchable: false,
            orderable: false,
            defaultContent: '<i style="color: pink; font-size: .9em;">...pending</i>',
            type: 'string',
            render(data, type) {
                return type == 'display' && data ? moment(data, 'YYYY-MM-DD').format('ll') : data
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
            data: 'teamName',
            title: 'Team',
            searchable: false,
            orderable: false,
            defaultContent,
        },

        {
            data: null,
            searchable: false,
            orderable: false,
            className: 'right aligned',
            width: '120px',
            render(data, type, row) {
                const { _id, condition, formId } = row
                const { comment, modify, delete: remove } = row.actions.data
                const { access } = row.actions.file

                let panel = ''

                if (condition != 'p') {
                    if (modify) {
                        panel += `<a class="modify-apl" href="/drivers/application/${formId}/e-form"><i class="dark green text edit outline icon"></i></a>`
                        // panel += `<a class="assign-apl"><i class="blue clipboard outline icon"></i></a>`
                    }
                    if (condition != 'c' && access) panel += `<a class="apl-files"><i class="black text folder outline icon"></i></a>`
                    if (comment) panel += `<a class="comment-apl"><i class="purple text comment outline icon"></i></a>`
                } else {
                    if (modify) {
                        panel += `<a class="apl-id-card" data-id="${_id}" href=""><i class="dark green text id card outline icon"></i></a>`
                        panel += `<a class="apl-external-form" href="${row.aplAddress}" target="_blank"><i class="blue external alternate icon"></i></a>`
                    }
                }
                if (remove && ['p', 'c'].includes(condition))
                    panel += `<a class="delete-apl" data-id="${_id}" href=""><i class="red trash alternate outline icon"></i></a>`

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
                $(row).css('color', '#F28C28')
                break
            case 'b':
                $(row).css('color', '#DC143C')
                break
            case 'h':
                [2, 3].forEach(idx => $('td', row).eq(idx).css({ fontWeight: 'bold' }))
                break
        }
    },

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    fixedHeader: {
        header: true,
        headerOffset: $('#top-nav').height(),
    },

    initComplete(settings, data) {
        styleSearch()

        const toolbar = $('<div class="custom-dt-toolbar"></div>')
        const dropdown = {
            condition: filterDropdown('condition-filter', 'Status', { multiple: true, clearable: true, element: 'div', short: true }),
            position: filterDropdown('position-filter', 'Position', { multiple: true, clearable: true, element: 'div', short: true }),
            company: filterDropdown('company-filter', 'Company', { multiple: true, clearable: true, element: 'div' }),
            user: filterDropdown('user-filter', 'User', { clearable: true, element: 'div' }),
        }

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
                        const { _carrierId, active, until, alias } = company
                        let { name } = company
                        let color = 'green'

                        if (until) color = 'red'
                        else if (!active) color = 'blue'

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
                toolbar.append('<button class="ui button" id="other-filters"><i class="filter icon"></i></button>')

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
    processing: true,
    serverSide: true,

})


setInterval(() => {
    dtFnFilterData(table)
}, interval)


export default table