import { inputEvent } from '/modules/events/form.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'

const {
    class: aplClass,
    phoneId,
    dobId,
    aplPinId,
} = formSelectors.driver

const $card = $('#apl-login-card')
const $submit = $('[type=submit]')
const $form = $('#apl-login-form')
const $help = $('#form-help')

$(`.${aplClass}`).val(null)

const duration = 750
$card.fadeIn(duration)

const onInput = () => $help.hide().html(null)

telEvent(phoneId, { onInput })

inputEvent(dobId, {
    mask: '99/99/9999',
    placeholder: 'MM/DD/YYYY',
    onInput,
})

inputEvent(aplPinId, {
    onInput(pin, $pin) {
        onInput()

        const length = $pin.attr('maxlength')
        if (pin.length == length) $pin.blur()
    },
})

$form.submit(function(evt) {
    evt.preventDefault()

    const phone = $(`#${phoneId}`).val(),
          dob = $(`#${dobId}`).val(),
          pin = $(`#${aplPinId}`).val()

    if (!phone && !dob && !pin) return

    const url = $(this).attr('action').replace('resource', 'api')

    $submit
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm"></span> Signing in...')

    $.ajax(url, {
        method: 'POST',
        data: { phone, dob, pin },
        success(response) {
            const { error, passed } = response
            if (error) return alert(error)

            if (!passed) {
                $submit.prop('disabled', false).html('Continue Application')

                return $help
                    .html('<i class="fas fa-triangle-exclamation"></i> Incorrect credentials used<br/>Please try again...')
                    .show()
            }

            $card.fadeOut(duration)
            setTimeout(() => $form.unbind().submit(), duration)
        },
    })
})

setTimeout(() => $(`#${aplPinId}`).prop('disabled', false), 100)