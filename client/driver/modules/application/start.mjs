import { inputEvent } from '/modules/events/form.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'

const {
    class: aplClass,
    id,
    firstNameId,
    middleNameId,
    lastNameId,
    suffixId,
    dobId,
    ssnId,
    phoneId,
    emailId,
    statusExpId,
} = formSelectors.driver

const $help = {
    dob: $('#dob-help'),
    email: $('#email-help'),
}
const $expiration = $(`#${statusExpId}`)
const $submit = $('[type=submit]')

const dateOpts = { mask: '99/99/9999', placeholder: 'MM/DD/YYYY' }


/* Reset Form on Refresh */
$(`.${aplClass}`).val(null)
$('.form-check-input').prop('checked', false)
$expiration.prop('disabled', true)
$submit.prop('disabled', true)


$('#apply').click(() => {
    const time = 1000

    $('#card-intro, #new-apl-card').fadeOut(time)
    setTimeout(() => {
        $('#card-form, #new-apl-card').fadeIn(time)
    }, time)
})

$('.status-radio').click(function() {
    let disabled = true, action = 'removeClass'

    if ($(this).val() == '2') {
        disabled = false
        action = 'addClass'
    }
    $expiration.prop('disabled', disabled).prev()[action]('required')
})

const onInput = (value, $el) => $el.removeClass('is-valid is-invalid')
const onChange = (value, $el) => {
    if (value) $el.addClass('is-valid')
}

nameEvent(firstNameId, { onInput, onChange })

nameEvent(middleNameId)

nameEvent(lastNameId, { sfxId: suffixId, onInput, onChange })

ssnEvent(ssnId, { onInput, onChange })

telEvent(phoneId, { onInput, onChange })

emailEvent(emailId, {
    onInput(email, $email) {
        $help.email.text(null)
        $email.removeClass('is-valid is-invalid')
    },
    onChange(email, valid, $email) {
        if (!valid) {
            $help.email.text('* Invalid email address')
            $email.addClass('is-invalid')
        } else $email.addClass('is-valid')
    },
})

inputEvent(dobId, {
    ...dateOpts,
    onInput(dob, $dob) { console.log(dob)
        $help.dob.text(null)
        $dob.removeClass('is-valid is-invalid')
    },
    onChange(dob, $dob) {
        if (dob) {
            const date = moment(dob, 'MM/DD/YYYY', true)

            if (!date.isValid()) {
                $dob.addClass('is-invalid')
                $help.dob.text('* Invalid date')
            } else {
                const today = moment()
                const diff = today.subtract(18, 'years')

                if (date.isAfter(diff)) {
                    $dob.addClass('is-invalid')
                    $help.dob.text("* You're too young to apply")
                } else
                    $dob.addClass('is-valid')
            }
        }
    },
})

inputEvent(statusExpId, dateOpts)