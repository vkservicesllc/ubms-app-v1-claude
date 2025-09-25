import table from './applications.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

const $modal = $('#apl-id-card-modal')


$modal.modal({
    onHidden() {
        $('.apl-data').html(null)
    },
})

table.on('draw', function() {
    $('.apl-id-card').off('click')

    $('.apl-id-card').on('click', function(evt) {
        evt.preventDefault()

        const _id = $(this).data('id')

        $.ajax(`/api/drivers/application/${_id}`, {
            method: 'POST',
            success(response) {
                const { application } = response.data
                const { phone, dob, ssn } = application

                application.phone = formatTel(phone)
                application.dob = moment(dob).format('MM/DD/YYYY')
                application.pin = ssn.slice(-4)

                const items = ['fullName', 'formId', 'phone', 'dob', 'pin']
                items.forEach(item => $(`#apl-id-card\\:${item}`).html(escapeHTML(application[item])))

                $modal.modal('show')
            },
        })
    })
})