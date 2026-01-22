import table from './applications.mjs'
import Person from '/modules/tools/core/person.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text
const firstNameId = TS.leadFirstName
const middleNameId = TS.leadMiddleName
const lastNameId = TS.leadLastName
const phoneId = TS.leadPhone
const emailId = TS.leadEmail

const $modal = {
    invite: $('#apl-reinvite-card-modal'),
    modify: $('#apl-lead-card-modal'),
}
const $form = {
    invite: $('#reinvite-form'),
}
const $dropdown = {
    suffix: $('#lead-suffix-dropdown'),
    gender: $('#lead-gender-dropdown'),
}
const $message = {
    email: $('#lead-email-help'),
}

$dropdown.suffix.dropdown()
$dropdown.gender.dropdown()

nameEvent(firstNameId)

nameEvent(middleNameId)

nameEvent(lastNameId, {
    sfxId: true,
    onChange(lastName, $lastName, suffix) {
        if (suffix) $dropdown.suffix.dropdown('set selected', suffix)
    },
})

telEvent(phoneId)

emailEvent(emailId, {
    onInput() {
        $message.email.html(null)
    },
    onChange(email, valid, $email) {
        if (!valid) {
            $message.email
                .html(`<span class="ui red text">
                    <i class="close icon"></i>
                    "<b>${email}</b>" is not valid
                </span>`)
            $email.val(null)
        }
    },
})

const $id = $(selector.id.hidden.leadId)
const $firstName = $(firstNameId)
const $middleName = $(middleNameId)
const $lastName = $(lastNameId)
const $phone = $(phoneId)
const $email = $(emailId)
const $redundant = $('#lead-redundant')
const $button = {
    delete: $('#delete-lead-button'),
}

$redundant.on('click', function() {
    $button.delete[$(this).prop('checked') ? 'show' : 'hide']()
})

$button.delete.click(function() {
    const _id = $id.val()

    $.ajax({
        method: 'DELETE',
        url: `/api/resource/drivers/applications/${_id}`,
        success(response) {
            const { deleted } = response
            if (!deleted) return alert('Something went wrong! Applicant could not be deleted!')

            location.reload()
        },
        error(err) {
            console.error(err.responseJSON)
        },
    })
})


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('.modify-preapl, .reinvite-apl').off('click')

    if (actions.data.modify === true)
        $('.modify-preapl, .reinvite-apl').on('click', function(evt) {
            evt.preventDefault()
            const _id = $(this).data('id')
            const assigned = $(this).data('assigned')

            $.ajax(`/api/resource/drivers/applications/${_id}`, {
                success(response) {
                    const { firstName, middleName, lastName, suffix, gender, phone, email, position } = response.data.application

                    if (assigned === undefined) {
                        const name = new Person({ firstName, middleName, lastName, suffix }).fullName()
                        const $name = $('#reinvite-name')
                        const $email = $('#reinvite-email')

                        $name.text(name)
                        $email.text(email)

                        const action = $form.invite.attr('action') + `?_id=${_id}`
                        $form.invite.attr('action', action)

                        return $modal.invite.modal({
                            autofocus: false,
                            closable: false,
                            onHidden() {
                                const action = $form.invite.attr('action').split('?')[0]
                                $form.invite.attr('action', action)
                                $name.text(null)
                                $email.text(null)
                            },
                        }).modal('show')
                    }

                    $id.val(_id)
                    $firstName.val(firstName)
                    $middleName.val(middleName)
                    $lastName.val(lastName)
                    $phone.val(formatTel(phone))
                    $email.val(email)
                    $dropdown.suffix.dropdown('set selected', suffix)
                    $dropdown.gender.dropdown('set selected', gender)
                    if (position) $modal.modify.find(`[type="radio"][value="${position}"]`).prop('checked', true)
                    if (+assigned) $redundant.parent().show()

                    $modal.modify.modal({
                        autofocus: false,
                        closable: false,
                        onHidden() {
                            $id.val(null)
                            $firstName.val(null)
                            $middleName.val(null)
                            $lastName.val(null)
                            $phone.val(null)
                            $email.val(null)
                            $message.email.html(null)
                            $dropdown.suffix.dropdown('clear')
                            $dropdown.gender.dropdown('clear')
                            $modal.modify.find('[type="radio"]').prop('checked', false)
                            $redundant.prop('checked', false).parent().hide()
                        },
                    }).modal('show')
                },
            })
        })
})