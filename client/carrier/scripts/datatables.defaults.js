$.extend(true, $.fn.dataTable.defaults, {

    ajax: {
        // error() { location.reload() },
        method: 'POST',
    },

    columnDefs: [

        {
            defaultContent: '<i style="color: pink; font-size: .8em;">N/A</i>',
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