import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'


const interval = 60000

const table = $('#driver-apl-prev-employers-table').DataTable({

    ajax: {
        url: '/api/resource/drivers/applications/prev-employments',
        method: 'GET',
        dataSrc(response) {
            const { data } = response

            data.forEach(row => {
                const { formId, phone, carrier, finishedAt } = row.application

                row.order = finishedAt + ' ' + row.startedOn
                row.group = new Person(row.application).fullName() + ` <small><small class="bull">•</small> ${formatTel(phone)}`
                if (carrier) row.group += ` <small class="bull">•</small> ${carrier}`
                row.group += ` <small class="bull">•</small> ${moment(finishedAt).format('ll')} <small class="bull">•</small> ${formId}</small>`
            })

            return data
        },
    },

    columns: [

        {
            data: 'order',
            searchable: false,
            orderable: false,
            visible: false,
        },

        {
            data: 'group',
            searchable: false,
            orderable: false,
            visible: false,
        },

        {
            data: 'status',
            searchable: false,
            orderable: false,
            width: '30px',
            render(data) {
                let icon

                switch (data) {
                    case 'c':
                        icon = 'dark green check circle outline'
                        break
                    case 'r':
                        icon = 'red ban'
                        break
                    default:
                        icon = 'dark orange clock outline'
                }

                return `<i class="ui ${icon} icon"></i>`
            },
        },

        {
            data: 'employer',
            title: 'Employer',
            orderable: false,
            searchable: false,
            createdCell(td) {
                $(td).css('font-weight', 'bold')
            },
        },

        {
            data: 'usdot',
            title: 'US-DOT',
            orderable: false,
        },

        {
            data: 'phone',
            title: 'Phone',
            orderable: false,
            searchable: false,
            render(data) {
                return formatTel(data)
            },
        },

        {
            data: null,
            title: 'Address',
            orderable: false,
            searchable: false,
            render(data, type, row) {
                return new Address(row.address).html()
            },
        },

        {
            data: 'startedOn',
            title: 'Employment Period',
            orderable: false,
            searchable: false,
            render(data, type, row) {
                let until = '<span class="ui dark red text">Still Employed</span>'
                if (row.leftOn) until = moment(row.leftOn).format('ll')

                return moment(data).format('ll') + ' – ' + until
            },
        },

        {
            data: 'position',
            title: 'Position',
            orderable: false,
            searchable: false,
        },

        {
            data: 'fmcsr',
            title: 'FMCSR',
            orderable: false,
            searchable: false,
            render(data) {
                if (data === null) return '<i style="color: pink; font-size: .9em;">N/A</i>'
                return `<i class="${data ? 'dark green check' : 'dark red close'} icon"></i>`
            },
        },

        {
            data: 'dotDat',
            title: 'Drug/Alcohol',
            orderable: false,
            searchable: false,
            render(data) {
                return `<i class="${data ? 'dark green check' : 'dark red close'} icon"></i>`
            },
        },

        {
            data: null,
            searchable: false,
            orderable: false,
            className: 'right aligned',
            render(data, type, row) {
                return `<a class="manage-empl" data-id="${row._id}" data-app-id="${row._appId}" href=""><i class="dark green business time icon"></i></a>` 
            },
        },

    ],

    createdRow(tr, row) {
        let bgc = 'lightyellow'
        if (row.status === 'c') bgc = 'palegreen'
        if (row.status === 'r') bgc = 'lightpink'

        $(tr).css('background-color', bgc)
    },

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    fixedHeader: {
        header: true,
        headerOffset: $('#top-nav').height(),
    },
    
    initComplete() {
        // styleSearch()

        // const toolbar = $('<div class="custom-dt-toolbar"></div>')
        // $('.dt-length').after(toolbar)

        // $('#dt-search-0')
        //     .on('input', function() {
        //         $(this).val($(this).val().replace(/\W/gi, ''))
        //     })

        // $('.dt-length, .dt-search, .custom-dt-toolbar').css('visibility', 'visible')
        $('.dt-length').css('visibility', 'visible')
    },

    language: {
        emptyTable: '<span class="ui red text">No applicants have previous employers at this time</span>',
    },

    lengthMenu,
    order: [[0, 'desc']],

    rowGroup: {
        dataSrc(row) {
            return row.group
        },
    },

})


setInterval(() => {
    dtFnFilterData(table)
}, interval)


export default table