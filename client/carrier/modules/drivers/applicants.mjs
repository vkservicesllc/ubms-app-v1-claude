import Person from '/modules/tools/core/person.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import styleSearch, { tag as searchTag } from '/modules/tools/search.mjs'


const interval = 300000

const table = $('#driver-aplicants-table').DataTable({

    ajax: {
        url: '/api/drivers',
        dataSrc(response) {console.log(response)
            const { data } = response

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