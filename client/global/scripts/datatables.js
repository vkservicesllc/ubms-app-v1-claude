function fnDrawCallback(oSettings) {
    const pagination = $(oSettings.nTableWrapper).find('.dataTables_paginate')

    if (oSettings._iDisplayLength >= oSettings.fnRecordsDisplay())
        pagination.hide()
    else pagination.show()
}


function dtFnFilterData(table) {
    table.ajax.reload(null, false)
}


$.fn.DataTable.ext.pager.numbers_length = 7
$.fn.dataTable.ext.errMode = 'none'