import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { check } from './support.mjs'

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
    positionId,
    statusExpId,
} = formSelectors.driver

const $card = $('#new-apl-card')
const $help = {
    dob: $('#dob-help'),
    email: $('#email-help'),
    statusExp: $('#status-exp-help'),
    form: $('#form-help'),
}
const $expiration = $(`#${statusExpId}`)
const $submit = $('[type=submit]')
const $form = $('#apl-start-form')

const dateOpts = { mask: '99/99/9999', placeholder: 'MM/DD/YYYY' }


/* Reset Form on Refresh */
$(`.${aplClass}`).val(null)
$('.form-check-input').prop('checked', false)
$expiration.prop('disabled', true)

const aplStatus = sessionStorage.getItem('aplStatus')
if (aplStatus === 'started') {
    $('#intro-card').hide()
    $('#privacy-card').show()
} else if (aplStatus === 'confirmed') {
    $('#intro-card').hide()
    $('#form-card').show()
}

[
    firstNameId,
    middleNameId,
    lastNameId,
    suffixId,
    dobId,
    phoneId,
    emailId,
    positionId,
].forEach(id => {
    const value = sessionStorage.getItem(id)

    if (value) {
        const $el = $(`#${id}`)
        const required = $el.prop('required')

        $el.val(value)
        if (required) $el.addClass('is-valid')
    }
})

const duration = 750
$card.fadeIn(duration)

$('#apply').click(() => {
    $('#intro-card, #new-apl-card').fadeOut(duration)

    setTimeout(() => {
        $('#privacy-card, #new-apl-card').fadeIn(duration)
        sessionStorage.setItem('aplStatus', 'started')
    }, duration)
})

$('#confirm').click(() => {
    $('#privacy-card, #new-apl-card').fadeOut(duration)

    setTimeout(() => {
        $('#form-card, #new-apl-card').fadeIn(duration)
        sessionStorage.setItem('aplStatus', 'confirmed')
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
    const required = $el.prop('required')
    if (value && required) $el.addClass('is-valid')

    const id = $el.attr('id')
    if (id != ssnId && id != dobId && id != statusExpId)
        sessionStorage.setItem(id, value)
}
const onBlur = (value, $el) => onChange(value, $el)

nameEvent(firstNameId, { onInput, onChange })

nameEvent(middleNameId, { onChange })

nameEvent(lastNameId, { sfxId: suffixId, onInput,
    onChange(lastName, $lastName, suffix, $suffix) {
        onChange(lastName, $lastName)

        if (suffix) onChange(suffix, $suffix)
    },
})

selectEvent(suffixId, { onChange })

ssnEvent(ssnId, { onInput, onChange, onBlur })

telEvent(phoneId, { onInput, onChange, onBlur })

emailEvent(emailId, {
    onInput(email, $email) {
        $help.email.text(null)
        $email.removeClass('is-valid is-invalid')
    },
    onChange(email, valid, $email) {
        if (!email || (email && valid)) sessionStorage.setItem(emailId, email)

        if (email)
            if (!valid) {
                $help.email.text('* Invalid email address')
                $email.addClass('is-invalid')
            } else $email.addClass('is-valid')

        if (check($form)) $help.form.hide().html(null)
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
            let invalid

            if (!date.isValid()) {
                $dob.addClass('is-invalid')
                invalid = '* Invalid date'
            } else {
                const today = moment()
                const diff = today.clone().subtract(18, 'years').startOf('day')

                if (date.isAfter(diff)) {
                    $dob.addClass('is-invalid')
                    invalid = "* You're too young to apply"
                } else
                    $dob.addClass('is-valid')
            }

            if (invalid) $help.dob.text(invalid)
            else sessionStorage.setItem(dobId, dob)
        }

        if (check($form)) $help.form.hide().html(null)
    },
    onBlur,
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

        if (check($form)) $help.form.hide().html(null)
    },
})

selectEvent(positionId, { onChange })


$form.submit(function(evt) {
    evt.preventDefault()

    const valid = $('input[required]').filter('.is-invalid').length === 0
    if (!valid)
        return $help.form
            .html('<i class="fas fa-triangle-exclamation"></i> Some of the provided information is invalid')
            .show()

    $help.form.hide().html(null)
    $submit
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm"></span> Submitting...')
    sessionStorage.clear()
    $card.fadeOut(duration)
    setTimeout(() => $form.unbind().submit(), duration)
})