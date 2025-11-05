import { inputEvent } from '/modules/events/form.mjs'
import { telMask, dateMask } from '/modules/events/imask.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text
const phoneId = TS.phone
const dobId = TS.dob
const pinId = TS.pin

const $card = $('#apl-login-card')
const $submit = $('[type=submit]')
const $form = $('#apl-login-form')
const $help = $('#form-help')

$(selector.class.global).val(null)
$('label.input-required').removeClass('input-required')

const duration = 750
$card.fadeIn(duration)

const onInput = () => $help.hide().html(null)

const onBlur = (value, $el) => {
    if (value) {
        const $next = $el.parent().parent().next().find('input')

        if ($next.length) {
            const next = $next.val()
            if (!next) $next.focus()
        } else $submit.focus()
    }
}


telMask(phoneId, { onAccept: onInput, onComplete: onBlur })

dateMask(dobId, { pattern: 'us', onAccept: onInput, onComplete: onBlur })

inputEvent(pinId, {
    onInput(pin, $pin) {
        onInput()

        const length = $pin.attr('maxlength')
        if (pin.length == length) $pin.blur()
    },
    onBlur,
})


$form.submit(function(evt) {
    evt.preventDefault()

    const phone = $(phoneId).val(),
          dob = $(dobId).val(),
          pin = $(pinId).val()

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

setTimeout(async () => {
    $(pinId).prop('disabled', false)

    const creds = await navigator.clipboard.readText()

    if (creds.includes('[QuickPaste]')) {
        const parts = creds.split('|')

        $(phoneId).val(parts[1])
        $(dobId).val(parts[2])
        $(pinId).val(parts[3])
    }
}, 100)