import table from './applications.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'

const $modal = $('#apl-id-card-modal')
const $copyBtn = $('#copy-apl-login')
const $copySuccess = $('#apl-copy-sucess')


$modal.modal({
    onHidden() {
        $('.apl-data').html(null)
        $copySuccess.hide()
    },
})

table.on('draw', function() {
    $('.apl-id-card').off('click')

    $('.apl-id-card').on('click', function(evt) {
        evt.preventDefault()

        const _id = $(this).data('id')
        const href = $(this).next().attr('href')

        $.ajax(`/api/drivers/application/${_id}`, {
            method: 'POST',
            success(response) {
                const { application } = response.data
                const { phone, dob, ssn } = application

                application.url = `<a href="${href}" target="_blank">${href}</a>`
                application.phone = formatTel(phone)
                application.dob = moment(dob).format('MM/DD/YYYY')
                application.pin = ssn.slice(-4)

                const items = ['fullName', 'formId', 'url', 'phone', 'dob', 'pin']
                items.forEach(item => $(`#apl-id-card\\:${item}`).html(application[item]))

                $modal.modal('show')
            },
        })
    })

    $copyBtn.on('click', () => {
        let text = '[QuickPaste]'
        text += '|' + $('#apl-id-card\\:phone').text()
        text += '|' + $('#apl-id-card\\:dob').text()
        text += '|' + $('#apl-id-card\\:pin').text()

        navigator.clipboard.writeText(text)
            .then(() => {
                $copySuccess.fadeIn()
                setTimeout(() => $copySuccess.fadeOut(), 3500)
            })
    })
})