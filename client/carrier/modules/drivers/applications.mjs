import Person from '/modules/assets/person.mjs'
import Address from '/modules/assets/address.us.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'



const table = $('#driver-apl-table').DataTable({

    ajax: {
        url: '/api/drivers/applications',
        dataSrc(response) {
            const { data } = response
            return data
        },
    },
    processing: true,
    serverSide: true,

    columns: [

        {
            data: 'formId',
            title: 'Form ID',
            orderable: false,
        },

        {
            data: 'appliedOn',
            title: 'Applied on',
            searchable: false,
            render(data, type) {
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            title: 'Last Name',
            data(row) {
                return escapeHTML(new Person(row).fullLastName())
            },
        },

        {
            title: 'First Name',
            data(row) {
                return escapeHTML(new Person(row).fullFirstName())
            },
        },

        {
            data: 'dob',
            title: 'DOB',
            searchable: false,
            render(data, type) {
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            title: 'Age',
            searchable: false,
            type: 'string',
            data(row) {
                return new Person(row).age
            },
        },

    ],

})