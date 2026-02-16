import { selectEvent } from '/modules/events/form.mjs'
import { dateMask, idMask, telMask } from '/modules/events/imask.mjs'
import { nameEvent } from '/modules/events/person.mjs'
import { emailEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { check, onInput, onAccept, addressPredictions } from './support.mjs'

const TS = selector.id.text, SS = selector.id.select
const firstNameId = TS.firstName
const middleNameId = TS.middleName
const lastNameId = TS.lastName
const suffixId = SS.suffix
// const dobId = TS.dob
// const ssnId = TS.ssn
const genderId = SS.gender
const phoneId = TS.phone
const emailId = TS.email
const addr1Id = TS.address1
const addr2Id = TS.address2
const zipId = TS.addrZip
const cityId = TS.addrCity
const stateId = SS.addrState
const addrSinceId = TS.addrSince
const addrEnoughId = selector.id.hidden.addrEnough
// const positionId = SS.position
const statusExpId = TS.statusExp

const $card = $('#new-apl-card')
const $help = {
    email: $('#email-help'),
    addrSince: $('#addr-since-help'),
    statusExp: $('#status-exp-help'),
    form: $('#form-help'),
}
const $gender = $(genderId)
const $status = $('.status-radio')
const $expiration = $(statusExpId)
const $submit = $('[type=submit]')
const $form = $('#apl-start-form')
const duration = 750

const lead = {
    phone: $('#lead-phone').val() || null,
    email: $('#lead-email').val() || null,
}


/* Reset Form on Refresh */
$(selector.class.global).val(null)
$('.form-check-input').prop('checked', false)
$expiration.prop('disabled', true)


{
    [
        firstNameId,
        middleNameId,
        lastNameId,
        suffixId,
        genderId,
        phoneId,
        emailId,
        addrEnoughId,
        addr1Id,
        addr2Id,
        zipId,
        cityId,
        stateId,
        addrSinceId,
    ].forEach(id => {
        let value = sessionStorage.getItem(id.replace('#', ''))
        if (id === phoneId && !value) value = lead.phone
        if (id === emailId && !value) value = lead.email

        if (value) {
            const $el = $(id)
            const required = $el.prop('required')

            $el.val(value)
            if (required && $el.val() === value) $el.addClass('is-valid')
        }
    })
}

if ($gender.val()) $gender.find('option[value=""]').remove()

$status.click(function() {
    let disabled = true, action = 'removeClass', parentAction = 'hide'

    if ($(this).val() == '2') {
        disabled = false
        action = 'addClass'
        parentAction = 'show'
    }

    $expiration
        .val(null)
        .prop('disabled', disabled)
        .removeClass('is-valid is-invalid')
        .prev()[action]('input-required')
        .parent()[parentAction]()
    $help.statusExp.text(null)
})

const onChange = (value, $el) => {
    if (!$el) return

    const required = $el.prop('required')
    if (value && required) $el.addClass('is-valid')

    let id = $el.attr('id')
    id = `#${id}`
    if (value !== null && id !== statusExpId)
        sessionStorage.setItem(id.replace('#', ''), value)
}

const onComplete = (mask, $el) => onChange(mask.value, $el)


nameEvent(firstNameId, { onInput, onChange })

nameEvent(middleNameId, { onChange })

nameEvent(lastNameId, { sfxId: suffixId, onInput,
    onChange(lastName, $lastName, suffix, $suffix) {
        onChange(lastName, $lastName)

        if (suffix) onChange(suffix, $suffix)
    },
})

selectEvent(suffixId, { onChange })

selectEvent(genderId, { fill: true, onChange })


telMask(phoneId, { region: 'us', onAccept, onComplete })

emailEvent(emailId, {
    onInput(email, $email) {
        $help.email.text(null)
        $email.removeClass('is-valid is-invalid')
    },
    onChange(email, valid, $email) {
        if (!email || (email && valid)) sessionStorage.setItem(emailId.replace('#', ''), email)

        if (email)
            if (!valid) {
                $help.email.text('* Invalid email address')
                $email.addClass('is-invalid')
            } else $email.addClass('is-valid')

        if (check($form)) $help.form.hide().html(null)
    },
})


let timer

addr1Event(addr1Id, {
    addr2Id,
    onInput(addr1, $addr1) {
        clearTimeout(timer)
        timer = setTimeout(() => addressPredictions($addr1, addr1, () => {
            const zip = $(zipId).val()
            sessionStorage.setItem(zipId.replace('#', ''), zip || '')
        }), 500)

        onInput(addr1, $addr1)
    },
    onChange(addr1, $addr1, addr2, $addr2) {
        onChange(addr1, $addr1)
        onChange(addr2, $addr2)
    },
    onBlur(addr1, $addr1) {
        setTimeout(() => $addr1.parent().find('.address-predictions').html(null), 500)
    },
})

addr2Event(addr2Id, { onInput, onChange })

zipEvent(zipId, {
    cityId,
    stateId,
    onInput,
    onChange(zip, $zip, city, state, $city, $state) {
        onChange(zip, $zip)
        onChange(city, $city)
        onChange(state, $state)
    },
})

cityEvent(cityId, { onInput, onChange })

selectEvent(stateId, { fill: true, onChange })

dateMask(addrSinceId, {
    pattern: 'us',
    onAccept(mask, $since) {
        $help.addrSince.text(null)
        $since.removeClass('is-valid is-invalid')
    },
    onComplete(mask, $since) {
        let since = mask.value

        if (since) {
            since = moment(since, 'MM/DD/YYYY', true)

            if (!since.isValid()) {
                $since.addClass('is-invalid')
                $help.addrSince.text('* Invalid date')
            } else {
                const today = moment()

                if (since.isAfter(today)) {
                    $since.addClass('is-invalid')
                    $help.addrSince.text('* Future date forbidden')
                } else {
                    $since.addClass('is-valid')
                    sessionStorage.setItem(addrSinceId.replace('#', ''), moment(since, 'MM/DD/YYYY').format('MM/DD/YYYY'))

                    const limit = today.clone().subtract(3, 'years')
                    const addrEnough = since.isBefore(limit) ? '1' : '0'
                    $(addrEnoughId).val(addrEnough)
                    sessionStorage.setItem(addrEnoughId.replace('#', ''), addrEnough)
                }
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
})


dateMask(statusExpId, {
    pattern: 'us',
    onAccept() {
        $help.statusExp.text(null)
        $expiration.removeClass('is-valid is-invalid')
    },
    onComplete(mask) {
        const expiration = mask.value

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

$card.fadeIn(duration)