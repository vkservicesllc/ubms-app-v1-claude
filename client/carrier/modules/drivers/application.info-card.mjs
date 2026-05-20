import table from './applications.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

const $modal = $('#apl-info-card-modal')

table.on('draw', function() {
    $('.apl-info-card').off('click')

    $('.apl-info-card').on('click', function(evt) {
        evt.preventDefault()

        const _id = $(this).data('id')
        
        $.ajax(`/api/resource/drivers/applications/${_id}?sensitive=true`, {
            success(response) {
                const { application } = response.data
console.log(application)

                $modal.modal('show')
            },
        })
    })
})