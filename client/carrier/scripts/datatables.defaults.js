$.extend(true, $.fn.dataTable.defaults, {

    ajax: {
        // error() { location.reload() },
        method: 'POST',
    },

    fnDrawCallback,

    language: {
        emptyTable: '<span class="ui red text">No records found</span>',
        infoFiltered: '',
        lengthMenu: "Show _MENU_",
        zeroRecords: '<span class="ui red text">No records found</span>',
    },

})


let lengthMenu = [
    [ 20, 50, 100, 150, 250, 500 ],
    [ 20, 50, 100, 150, 250, 500 ],
]