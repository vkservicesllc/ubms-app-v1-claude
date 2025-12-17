import table from './applications.mjs'
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

const $modal = $('#apl-lead-card-modal')
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


table.on('draw', function() {
    const { actions } = table.ajax.json()
    $('.reinvite-apl').off('click')

    if (actions.data.modify === true)
        $('.reinvite-apl').on('click', function(evt) {
            evt.preventDefault()
            const _id = $(this).data('id')
            const $firstName = $(firstNameId)
            const $middleName = $(middleNameId)
            const $lastName = $(lastNameId)
            const $phone = $(phoneId)
            const $email = $(emailId)

            $.ajax(`/api/data/drivers/application/${_id}`, {
                method: 'POST',
                success(response) {
                    const { firstName, middleName, lastName, suffix, gender, phone, email, position } = response.data.application

                    $firstName.val(firstName)
                    $middleName.val(middleName)
                    $lastName.val(lastName)
                    $phone.val(formatTel(phone))
                    $email.val(email)
                    $dropdown.suffix.dropdown('set selected', suffix)
                    $dropdown.gender.dropdown('set selected', gender)
                    console.log({ position })
                    if (position) $modal.find(`[type="radio"][value="${position}"]`).prop('checked', true)

                    $modal.modal({
                        autofocus: false,
                        closable: false,
                        onHidden() {
                            $firstName.val(null)
                            $middleName.val(null)
                            $lastName.val(null)
                            $phone.val(null)
                            $email.val(null)
                            $message.email.html(null)
                            $dropdown.suffix.dropdown('clear')
                            $dropdown.gender.dropdown('clear')
                            $dropdown.position.dropdown('clear')
                            $modal.find('[type="radio"]').prop('checked', false)
                        },
                    }).modal('show')
                },
            })
        })
})