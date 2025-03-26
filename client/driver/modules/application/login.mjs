import { inputEvent } from '/modules/events/form.mjs'
import { ssnEvent } from '/modules/events/person.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'

const {
    class: aplClass,
    dobId,
    ssnId,
    phoneId,
} = formSelectors.driver

const $card = $('#apl-login-card')
const $submit = $('[type=submit]')
const $form = $('#apl-login-form')

$(`.${aplClass}`).val(null)

const duration = 750
$card.fadeIn(duration)

telEvent(phoneId)

inputEvent(dobId, {
    mask: '99/99/9999',
    placeholder: 'MM/DD/YYYY',
})

ssnEvent(ssnId, { last4: true })

$form.submit(function(evt) {
    evt.preventDefault()

    $submit
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm"></span> Signing in...')

    //! use API to verify credentials

    $card.fadeOut(duration)
    setTimeout(() => $form.unbind().submit(), duration)
})