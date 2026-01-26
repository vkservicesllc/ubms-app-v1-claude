import Person from '/modules/tools/core/person.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import styleSearch, { tag as searchTag } from '/modules/tools/search.mjs'


const interval = 300000

const table = $('#driver-aplicants-table').DataTable({

    ajax: {
        url: '/api/resource/drivers/applicants/query',
        dataSrc(response) {
            const { data } = response
console.log(data)
            return data
        },
    },

    columns: [

        {
            data: null,
            title: `Legal Name ${searchTag}`,
            render(data, type, row) {
                return new Person(row).fullName('FMLs')
            }
        },

        {
            data: 'gender',
            title: 'Gender',
            searchable: false,
            render(data) {
                if (data === null) return
                return { 'M': 'Male', 'F': 'Female' }[data]
            },
        },

        {
            data: 'dob',
            title: 'Date of Birth',
            searchable: false,
            render(data) {
                return moment(data).format('ll')
            },
        },

        {
            data: 'phone',
            title: `Phone ${searchTag}`,
        },

    ],

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    fixedHeader: {
        header: true,
        headerOffset: $('#top-nav').height(),
    },

    initComplete(settings, data) {
        styleSearch()

        const toolbar = $('<div class="custom-dt-toolbar"></div>')
        $('.dt-length').after(toolbar)

        $('#dt-search-0')
            .on('input', function() {
                $(this).val($(this).val().replace(/\W/gi, ''))
            })

        $('.dt-length, .dt-search, .custom-dt-toolbar').css('visibility', 'visible')
    },

    language: {
        emptyTable: '<span class="ui red text">No applicants at this time</span>',
    },

    lengthMenu,
    processing: true,
    serverSide: true,

})


setInterval(() => {
    dtFnFilterData(table)
}, interval)