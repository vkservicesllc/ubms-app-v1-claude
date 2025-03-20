import table from './applications.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/formatter.mjs'

const modalId = '#delete-apl-modal'
const $modal = $(modalId)
const $id = $('#delete-apl-id')
const $confirm = $('#delete-apl-confirm')
const $submit = $('#delete-apl-submit')

$confirm.prop('checked', false)


$modal.modal({
    onHidden() {
        $('.delete-apl-data').html(null)
        $id.val(null)
        $confirm.prop('checked', false)
        $submit.addClass('disabled')
    },
})

$confirm.click(function() {
    if ($(this).is(':checked')) $submit.removeClass('disabled')
    else $submit.addClass('disabled')
})

table.on('draw', function() {
    $('.delete-apl').off('click')

    $('.delete-apl').on('click', function(evt) {
        evt.preventDefault()

        const _id = $(this).data('id')

        $.ajax(`/api/drivers/application/${_id}`, {
            method: 'POST',
            success(application) { console.log(application)
                const na = '<span class="ui dark red text"><small><i>N/A</i></small></span>'
                const { appliedOn, position, dob, phone, ssn, carrier, user } = application

                application.appliedOn = moment(appliedOn).format('ll')
                application.dob = moment(dob).format('ll')
                application.ssn = formatSsn(ssn)
                application.phone = formatTel(phone)
                if (carrier) application.company = carrier.name
                if (position) application.position = position[1]
                if (user) application.user = user.name

                const items = [
                    'formId', 'appliedOn',
                    'fullName', 'dob','ssn',
                    'phone', 'email',
                    'company', 'position', 'user',
                ]

                items.forEach(item => $(`#delete-apl\\:${item}`).html(escapeHTML(application[item]) || na))
                $id.val(application._id)

                $modal.modal('show')
            },
        })
    })
})