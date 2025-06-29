import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const TS = selector.id.text
    const $help = {
        email: $('#email-help'),
    }
    const $dropdown = {
        suffix: $('#suffix-dropdown'),
        gender: $('#gender-dropdown'),
        marital: $('#marital-dropdown'),
    }
    const $calendar = {
        dob: $('#dob-calendar'),
    }

    Object.keys($dropdown).forEach(prop => $dropdown[prop].dropdown())

    $calendar.dob.calendar({
        ...calSettings,
        maxDate: moment().subtract(18, 'years').toDate(),
    })

    nameEvent(TS.firstName)
    
    nameEvent(TS.middleName)
    
    nameEvent(TS.lastName, {
        sfxId: true,
        onChange(lastName, $lastName, suffix) {
            if (suffix)
                $dropdown.suffix.dropdown('set selected', suffix)
        },
    })

    ssnEvent(TS.ssn)

    telEvent(TS.phone)

    emailEvent(TS.email, {
        onInput() {
            $help.email.text(null)
        },
        onChange(email, valid) {
            if (!valid) $help.email.text('Invalid email')
        },
    })

    const { firstName, middleName, lastName, suffix, dob, gender, ssn, marital, phone, email } = application

    $(TS.firstName).val(firstName)
    $(TS.middleName).val(middleName)
    $(TS.lastName).val(lastName)

    $(TS.ssn).val(formatSsn(ssn))

    $(TS.phone).val(formatTel(phone))
    $(TS.email).val(email)

    $dropdown.suffix.dropdown('set selected', suffix)
    $dropdown.gender.dropdown('set selected', gender[0])
    $dropdown.marital.dropdown('set selected', marital)

    $calendar.dob.calendar('set date', new Date(moment(dob).toDate()))

    $('#profile-form').removeClass('loading')
})()

