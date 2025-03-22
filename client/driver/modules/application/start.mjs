import { inputEvent } from '/modules/events/form.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'

const {
    class: aplClass,
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
    statusExp: $('#status-exp-help'),
}
const $expiration = $(`#${statusExpId}`)
const $submit = $('[type=submit]')

const dateOpts = { mask: '99/99/9999', placeholder: 'MM/DD/YYYY' }


/* Reset Form on Refresh */
$(`.${aplClass}`).val(null)
$('.form-check-input').prop('checked', false)
$expiration.prop('disabled', true)
$submit.prop('disabled', true)

const duration = 1000
$('#apply').click(() => {
    $('#intro-card, #new-apl-card').fadeOut(duration)
    setTimeout(() => {
        $('#privacy-card, #new-apl-card').fadeIn(duration)
    }, duration)
})
$('#confirm').click(() => {
    $('#privacy-card, #new-apl-card').fadeOut(duration)
    setTimeout(() => {
        $('#form-card, #new-apl-card').fadeIn(duration)
    }, duration)
})


$('.status-radio').click(function() {
    let disabled = true, action = 'removeClass'

    if ($(this).val() == '2') {
        disabled = false
        action = 'addClass'
    }

    $expiration
        .val(null)
        .prop('disabled', disabled)
        .removeClass('is-valid is-invalid')
        .prev()[action]('required')
    $help.statusExp.text(null)
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
    onInput(dob, $dob) {
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
                const diff = today.clone().subtract(18, 'years').startOf('day')

                if (date.isAfter(diff)) {
                    $dob.addClass('is-invalid')
                    $help.dob.text("* You're too young to apply")
                } else
                    $dob.addClass('is-valid')
            }
        }
    },
})

inputEvent(statusExpId, {
    ...dateOpts,
    onInput() {
        $help.statusExp.text(null)
        $expiration.removeClass('is-valid is-invalid')
    },
    onChange(expiration) {
        if (expiration) {
            const date = moment(expiration, 'MM/DD/YYYY', true)

            if (!date.isValid()) {
                $expiration.addClass('is-invalid')
                $help.statusExp.text('* Invalid date')
            } else {
                const today = moment()
                const diff = {
                    day: today.clone().add(1, 'days').startOf('day'),
                    week: today.clone().add(1, 'weeks').startOf('day'),
                    month: today.clone().add(1, 'months').startOf('day'),
                }
                let invalid

                if (date.isSameOrBefore(today)) invalid = '* Expired'
                else if (date.isSame(diff.day)) invalid = '* Expires tomorrow'
                else if (date.isBefore(diff.week)) invalid = '* Expires less than a week'
                else if (date.isSame(diff.week)) invalid = '* Expires in a week'
                else if (date.isBefore(diff.month)) invalid = '* Expires in less than a month'
                else $expiration.addClass('is-valid')

                if (invalid) {
                    $expiration.addClass('is-invalid')
                    $help.statusExp.text(invalid)
                }
            }
        }
    },
})