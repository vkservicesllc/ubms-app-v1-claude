import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'


const interval = 60000

const table = $('#driver-apl-prev-employers-table').DataTable({

    ajax: {
        url: '/api/drivers/applications/prev-employers',
        dataSrc(response) {
            const { data } = response

            data.forEach(row => {
                const { formId, phone, carrier, finishedAt } = row.application

                row.group = new Person(row.applicant).fullName() + ` <small><small class="bull">•</small> ${formatTel(phone)}`
                if (carrier) row.group += ` <small class="bull">•</small> ${carrier}`
                row.group += ` <small class="bull">•</small> ${moment(finishedAt).format('ll')} <small class="bull">•</small> ${formId}</small>`
            })

            return data
        },
    },

    columns: [

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
                let until = 'Present'
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
            data: null,
            searchable: false,
            orderable: false,
            className: 'right aligned',
            render() {
                return '<a class="empl-edit" href=""><i class="dark green text edit outline icon"></i></a>' 
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

    rowGroup: {
        dataSrc(row) {
            return row.group
        },
    },

})


setInterval(() => {
    dtFnFilterData(table)
}, interval)