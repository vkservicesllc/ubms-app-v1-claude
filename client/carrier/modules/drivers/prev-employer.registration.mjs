import table from './prev-employers.mjs'


const $modal = {
    add: $('#empl-add-card-modal'),
}


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('.add-empl').off('click')

    if (actions.data.create === true) {
        $('.add-empl').on('click', function(evt) {
            evt.preventDefault()
            const _appId = $(this).data('app-id')

            //* Blank Form; insert _appId to hidden input

            $modal.add.modal({
                autofocus: false,
                closable: false,
                onHidden() {
                    //* Clear Form
                },
            }).modal('show')
        })
    }
})