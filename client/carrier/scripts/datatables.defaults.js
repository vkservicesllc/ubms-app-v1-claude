$.extend(true, $.fn.dataTable.defaults, {

    ajax: {
        method: 'POST',
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

    fnDrawCallback,

    language: {
        emptyTable: '<span class="ui red text">No records found</span>',
        infoFiltered: '',
        lengthMenu: "Show _MENU_",
        zeroRecords: '<span class="ui red text">No records found</span>',
    },

    pageLength: 20,

})


let lengthMenu = [ 20, 50, 100, 150, 250, 500 ]