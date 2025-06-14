import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { onInput, onChange, onKeyup, onCompleted, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select
const firstNameId = TS.firstName
const middleNameId = TS.middleName
const lastNameId = TS.lastName
const suffixId = SS.suffix
const dobId = TS.dob
const ssnId = TS.ssn
const phoneId = TS.phone
const emailId = TS.email

const $card = $('#apl-card')
const $help = {
    dob: $('#profile-dob-help'),
    email: $('#profile-email-help'),
    form: $('#profile-form-help'),
}
const $submit = $('#profile-submit')
const $form = $('#profile-form')

nameEvent(firstNameId, { onInput, onChange })

nameEvent(middleNameId, { onChange })

nameEvent(lastNameId, { sfxId: suffixId, onInput,
    onChange(lastName, $lastName, suffix, $suffix) {
        onChange(lastName, $lastName)

        if (suffix) onChange(suffix, $suffix)
    },
})

selectEvent(suffixId, { onChange })

ssnEvent(ssnId, { onKeyup, onCompleted })

telEvent(phoneId, { onKeyup, onCompleted })

emailEvent(emailId, {
    onInput(email, $email) {
        $help.email.text(null)
        $email.removeClass('is-valid is-invalid')
    },
    onChange(email, valid, $email) {
        if (email)
            if (!valid) {
                $help.email.text('* Invalid email address')
                $email.addClass('is-invalid')
            } else $email.addClass('is-valid')
    },
})

inputEvent(dobId, {
    mask: '99/99/9999',
    placeholder: 'MM/DD/YYYY',
    onKeyup(dob, $dob) {
        $help.dob.text(null)
        $dob.removeClass('is-valid is-invalid')
    },
    onCompleted(dob, $dob) {
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
                    $help.dob.text("* Too young to apply")
                } else
                    $dob.addClass('is-valid')
            }
        }
    },
})


onSubmit($form, $help, $submit, $card)