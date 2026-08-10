import table from './applications.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

const $modal = $('#apl-details-modal')


$modal.modal({
    onHidden() {
        //
    },
})


table.on('draw', function() {
    $('.view-apl').off('click')

    $('.view-apl').on('click', function(evt) {
        evt.preventDefault()
        $modal.modal('show')
    })
})