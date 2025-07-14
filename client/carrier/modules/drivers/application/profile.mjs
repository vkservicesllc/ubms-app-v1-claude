import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { identity, count, dropdownEvent, errorMessage, errorIcon } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { firstName, middleName, lastName, suffix, dob, gender, ssn, marital, phone, email } = application
    const TS = selector.id.text, SS = selector.id.select

    const $label = {
        dob: $(`label[for="${TS.dob.replace('#', '')}"]`),
        gender: $(`label[for="${SS.gender.replace('#', '')}"]`),
    }
    const $help = {
        email: $('#email-help'),
    }
    const $dropdown = {
        suffix: [ $('#suffix-dropdown'), suffix ],
        gender: [ $('#gender-dropdown'), gender[0] ],
        marital: [ $('#marital-dropdown'), marital ],
    }
    const $calendar = {
        dob: $('#dob-calendar'),
    }

    dropdownEvent($dropdown)

    $calendar.dob
        .calendar({
            ...calSettings,
            maxDate: moment().subtract(18, 'years').toDate(),
        })
        .calendar('set date', new Date(moment(dob).toDate()))

    nameEvent(TS.firstName, { value: firstName })
    
    nameEvent(TS.middleName, { value: middleName })
    
    nameEvent(TS.lastName, {
        sfxId: true,
        value: lastName,
        onChange(lastName, $lastName, suffix) {
            if (suffix)
                $dropdown.suffix.dropdown('set selected', suffix)
        },
    })

    ssnEvent(TS.ssn, { value: ssn })

    telEvent(TS.phone, { value: phone })

    emailEvent(TS.email, {
        value: email,
        onInput() {
            $help.email.text(null)
        },
        onChange(email, valid) {
            if (!valid) $help.email.text('Invalid email')
        },
    })

    if (identity.mismatch.dob) $label.dob.prepend(errorIcon).parent().addClass('error')
    else if (count.matched) $calendar.dob.parent().addClass('disabled')

    if (identity.mismatch.sex) $label.gender.prepend(errorIcon).parent().addClass('error')
    else if (count.matched) $dropdown.gender[0].parent().addClass('disabled')

    if (identity.mismatch.dob || identity.mismatch.sex) {
        const message = 'The system identified the SSN, but the gender or DOB entered does not match'
        const list = [
            'Review the SSN for possible errors',
            'Or revise the indicated fields accordingly',
        ]

        $('.item[data-tab="profile"]').append(errorIcon)
        $('#profile-form').after(errorMessage('Identity Error', message, list))
    }

    if (count.matched) $(TS.ssn).parent().addClass('disabled')

    if (marital === 'm') {
        const locked = ['husband', 'wife', 'spouse']
        let { relation, otherRel } = application.beneficiary

        relation = relation.toLowerCase().trim()
        if (otherRel) otherRel = otherRel.toLowerCase().trim()

        if (locked.includes(relation) || locked.includes(otherRel))
            $dropdown.marital[0].parent().addClass('disabled')
    }

    $('#identity-name-mismatch .nag').nag()
})()