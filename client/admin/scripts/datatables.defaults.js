$.extend(true, $.fn.dataTable.defaults, {

    ajax: {
        error(xhr, error, thrown) {
            if (xhr.status === 401) return location.reload()

            alert(`Error: ${error}; Thrown: ${thrown}`)
        },
    },

    autoWidth: false,

    columnDefs: [

        {
            defaultContent: '<i style="color: pink; font-size: .9em;">N/A</i>',
            targets: '_all',
        },

    ],

    fixedHeader: {
        header: true,
        headerOffset: 39,
    },

    fnDrawCallback,

    language: {
        emptyTable: '<span class="has-text-danger">No records available</span>',
        info: '<small class="has-text-grey">Showing: _START_ – _END_ &nbsp; Total: _TOTAL_</small>',
        infoEmpty: '',
        infoFiltered: '<small class="has-text-grey">Max: _MAX_</small>',
        lengthMenu: "Show _MENU_",
        zeroRecords: '<span class="has-text-danger">No matching records found</span>',
    },

})


let lengthMenu = [
    [ 10, 50, 100, -1],
    [ 10, 50, 100, 'All' ],
]


$(() => {
    $('.page-content').prepend('<div class="loader-wrapper is-active"><div class="loader is-loading"></div></div>')
})


const onDraw = (table, callback) => {
    table.on('draw', () => {
        $('.dt-column-title:not(:has(.dt-action))')
            .addClass('has-text-grey has-text-weight-semibold')
            .parent().addClass('is-size-7')

        setTimeout(() => {
            if (callback) callback()

            $('.dt-container').css('visibility', 'initial')
            $('.loader-wrapper').remove()
        }, 0)
    })
}