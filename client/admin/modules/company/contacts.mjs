import { telEvent, emailEvent } from '../events/contacts.mjs'
import { formSelectors } from '../registry/selectors.mjs'

const { phoneId, faxId, emailId } = formSelectors.company
const $tip = {
    email: $('#email-tip'),
}

const $submit = $('#contacts-submit')
$submit.prop('disabled', false)

telEvent(phoneId)
telEvent(faxId)
emailEvent(emailId, {
    onInput() {
        if ($tip.email.html()) $tip.email.html(null)
    },
    onChange(email, valid) {
        if (email && !valid) $tip.email.html('<i class="fa fa-triangle-exclamation"></i> Invalid email')
    },
})