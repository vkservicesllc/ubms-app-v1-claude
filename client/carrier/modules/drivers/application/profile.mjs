import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'

const TS = selector.id.text, SS = selector.id.select
const firstNameId = TS.firstName
const middleNameId = TS.middleName
const lastNameId = TS.lastName
const suffixId = SS.suffix
const dobId = TS.dob
const ssnId = TS.ssn
const phoneId = TS.phone
const emailId = TS.email

const _id = $('#id').val()

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

ssnEvent(ssnId)

telEvent(phoneId)

$.ajax(`/api/drivers/application/${_id}`, {
    method: 'POST',
    success(response) {
        const { data, error } = response
        if (error) return alert(error)

        const { firstName, middleName, lastName, suffix, dob, gender, ssn, marital, phone, email } = data

        $(firstNameId).val(firstName)
        $(middleNameId).val(middleName)
        $(lastNameId).val(lastName)

        $(ssnId).val(formatSsn(ssn))

        $(phoneId).val(formatTel(phone))
        $(emailId).val(email)

        $dropdown.suffix.dropdown('set selected', suffix)
        $dropdown.gender.dropdown('set selected', gender[0])
        $dropdown.marital.dropdown('set selected', marital)

        $calendar.dob.calendar('set date', new Date(moment(dob).toDate()))

        $('#profile-form').removeClass('loading')
    },
})