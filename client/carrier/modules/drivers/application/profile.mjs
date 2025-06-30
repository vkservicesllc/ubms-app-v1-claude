import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { firstName, middleName, lastName, suffix, dob, gender, ssn, marital, phone, email } = application
    const TS = selector.id.text

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

    $('#profile-form').removeClass('loading')
})()