import table from './prev-employers.mjs'


const $modal = {
    add: $('#empl-add-card-modal'),
}

const $dropdown = {
    addrState: $('#urempl-addr-state-dropdown'),
}

$dropdown.addrState.dropdown()

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
                    $dropdown.addrState.dropdown('clear')
                },
            }).modal('show')
        })
    }
})