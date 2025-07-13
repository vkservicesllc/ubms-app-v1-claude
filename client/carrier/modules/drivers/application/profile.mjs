import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent, errorMessage } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { firstName, middleName, lastName, suffix, dob, gender, ssn, marital, phone, email, identityMismatch } = application
    let { relation, otherRel } = application.beneficiary
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
    const $form = $('#profile-form')

    const errorIcon = '<i class="ui red text exclamation triangle icon"></i>'

    dropdownEvent($dropdown)

    $calendar.dob
        .calendar({
            ...calSettings,
            maxDate: moment().subtract(18, 'years').toDate(),
        })
        .calendar('set date', new Date(moment(dob).toDate()))

    if (marital === 'm') {
        const locked = ['husband', 'wife', 'spouse']
        const message = "The applicant's gender must align with the selected beneficiary relationship"
        const list = [`Applicant's Gender: ${gender[1]}`, `Beneficiary Relationship: ${otherRel || relation}`]
        const $errorMsg = errorMessage('Logical Error', message, list)
        const displayErrorMsg = () => {
            $form.after($errorMsg)
            $('.item[data-tab="beneficiary"]').append(errorIcon)
        }

        relation = relation.toLowerCase().trim()
        if (otherRel) otherRel = otherRel.toLowerCase().trim()

        if (locked.includes(relation) || locked.includes(otherRel))
            $dropdown.marital[0].parent().addClass('disabled')

        if (relation === locked[0] || otherRel === locked[0]) {
            if (gender[0] === 'F') disableGender()
            else displayErrorMsg()
        }

        if (relation === locked[1] || otherRel === locked[1]) {
            if (gender[0] === 'M') disableGender()
            else displayErrorMsg()
        }

        function disableGender() {
            $dropdown.gender[0].parent().addClass('disabled')
        }
    }

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

    if (identityMismatch.dob) $label.dob.prepend(errorIcon).parent().addClass('error')
    if (identityMismatch.sex) $label.gender.prepend(errorIcon).parent().addClass('error')
    if (identityMismatch.dob || identityMismatch.sex) {
        $(TS.ssn).parent().removeClass('disabled')
        $('.item[data-tab="profile"]').append(errorIcon)
    }

    $('.loading.form').removeClass('loading')
})()

$('#identity-name-mismatch .nag').nag()