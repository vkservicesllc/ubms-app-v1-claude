import table from './applications.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/utils/formatter.mjs'

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
            success(response) {
                const { application, identity, log } = response.data
                const { position, dob, ssn, gender, phone, address, carrier, user } = application
                const { createdAt, finishedAt } = log
                const na = '<span class="ui dark red text"><small><i>N/A</i></small></span>'

                application.appliedOn = moment(finishedAt || createdAt).format('ll')
                application.gender = gender[1]
                application.dob = moment(dob).format('ll')
                application.ssn = formatSsn(ssn)
                application.phone = formatTel(phone)
                application.residence = `${address.city}, ${address.state[1]}`
                if (carrier) application.company = carrier.name
                if (position) application.position = position[1]
                if (user) application.user = user.name

                const items = [
                    'formId', 'appliedOn',
                    'fullName', 'gender', 'dob','ssn',
                    'phone', 'email', 'residence',
                    'company', 'position', 'user',
                ]

                items.forEach(item => {
                    let html = escapeHTML(application[item]) || na
                    if (html) {
                        const { mismatch } = identity
                        if (item === 'gender' && mismatch.sex) html += ' <i class="ui red text exclamation triangle icon"></i>'
                        if (item === 'fullName')
                            if (mismatch.firstName || mismatch.middleName || mismatch.lastName || mismatch.suffix)
                                html += ` <small><span class="ui dark orange text">(aka ${escapeHTML(data.individual.name)})</span></small>`
                        if (item === 'dob' && mismatch.dob) html += ' <i class="ui red text exclamation triangle icon"></i>'
                    }

                    $(`#delete-apl\\:${item}`).html(html)
                })
                $id.val(application._id)

                $modal.modal('show')
            },
        })
    })
})