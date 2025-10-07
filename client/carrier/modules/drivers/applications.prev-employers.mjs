import Person from '/modules/tools/core/person.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'


const interval = 60000

const table = $('#driver-apl-prev-employers-table').DataTable({

    ajax: {
        url: '/api/drivers/applications/prev-employers',
        dataSrc(response) { console.log(response)
            const { data } = response

            data.forEach(row => {
                row.group = new Person(row).fullName() + ` <small>(${row.formId})</small>`
            })

            return data
        },
    },

    columns: [
        {
            data: 'group',
            visible: false,
        },
        {
            data: 'employer',
            title: 'Employer',
            orderable: false,
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
                return new Address(row).html()
            },
        },
        {
            data: 'startedOn',
            title: 'Employment Date',
            orderable: false,
            render(data) {
                return moment(data).format('ll')
            },
        },
    ],

    language: {
        emptyTable: '<span class="ui red text">No applicants have previous employers at this time</span>',
    },

    rowGroup: {
        dataSrc(row) {
            return row.group
        },
    },

})

setInterval(() => {
    dtFnFilterData(table)
}, interval)