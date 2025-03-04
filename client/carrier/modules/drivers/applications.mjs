import Person from '/modules/assets/person.mjs'
import Address from '/modules/assets/address.us.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'


const interval = 60000
const $filter = {
    companies: $('#company-filter'),
}
const $filterOptions = {
    companies: new Map(),
}

const table = $('#driver-apl-table').DataTable({

    ajax: {
        url: '/api/drivers/applications',
        data(data) {
            data.companyFilter = $filter.companies.val()
        },
        dataSrc(response) { console.log(response) //!TEMP
            const { data } = response

            data.forEach(row => $filterOptions.companies.set(row.alias, `${row.busName}, ${row.coType}`))
            $filter.companies.empty().append('<option value="">Filter by Companies</options>')
            $filterOptions.companies.forEach((name, alias) => {
                $filter.companies.append(`<option value="${alias}">${name}</option>`)
            })

            return data
        },
    },
    processing: true,
    serverSide: true,

    columns: [

        {
            title: 'Company',
            searchable: false,
            data(row) {
                const { busName, coType } = row

                return escapeHTML(`${busName}, ${coType}`)
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
            render(data, type) {
                return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
            },
        },

        {
            data: 'lastName',
            title: 'Last Name',
            render(data, type, row) {
                return escapeHTML(new Person(row).fullLastName())
            },
        },

        {
            data: 'firstName',
            title: 'First Name',
            render(data, type, row) {
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
                row.dob = moment(row.dob).format('YYYY-MM-DD')
                return new Person(row).age
            },
        },

        {
            data: 'phone',
            title: 'Phone',
            render(data) {
                return formatTel(data)
            },
        },

        {
            data: null,
            title: 'Address',
            render(data, type, row) {
                return null //! need to render address HTML
            },
        },

    ],

    initComplete() {
        // const companyFilterWrapper = $('<div class="company-filter-wrapper"></div>').insertBefore($('.dataTables_filter'))
        // companyFilterWrapper.append($filter.companies)
        const customFilters = $('<div class="custom-filters"></div>')
            .insertBefore($('.dataTables_filter'))

        customFilters.append('<select id="filterOne"><option value="">Filter 1</option></select>')

        $filter.companies.on('change', () => table.ajax.reload() )
    },

    language: {
        emptyTable: '<span class="ui red text">No applications at this time</span>',
    },

    order: [ 2, 'desc' ],

})



setInterval(() => {
    dtFnFilterData(table)
}, interval)