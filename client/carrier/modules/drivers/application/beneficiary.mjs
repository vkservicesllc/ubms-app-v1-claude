import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/utils/formatter.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { beneficiary } = application
console.log(beneficiary)

    const TS = selector.id.text
    const $dropdown = {
        suffix: $('#beneficiary-suffix-dropdown'),
        relationship: $('#beneficiary-relationship-dropdown'),
    }
    const $field = {
        otherRel: $('#beneficiary-other-relationship-field'),
    }

    Object.keys($dropdown).forEach(prop => $dropdown[prop].dropdown())

    nameEvent(TS.benefFirstName)
    
    nameEvent(TS.benefMiddleName)
    
    nameEvent(TS.benefLastName, {
        sfxId: true,
        onChange(lastName, $lastName, suffix) {
            if (suffix)
                $dropdown.suffix.dropdown('set selected', suffix)
        },
    })

    // need event listener for relationship dropdown and for otherRel text input (easy)

    telEvent(TS.benefPhone)

    ssnEvent(TS.benefSsn)

    const { firstName, middleName, lastName, suffix, relation, otherRel, phone, ssn } = beneficiary

    $(TS.benefFirstName).val(firstName)
    $(TS.benefMiddleName).val(middleName)
    $(TS.benefLastName).val(lastName)

    if (otherRel) {
        $(TS.benefOtherRel).val(otherRel).prop('disabled', false)
        $field.otherRel.show()
    }

    $(TS.benefPhone).val(formatTel(phone))
    $(TS.benefSsn).val(formatSsn(ssn))

    $dropdown.suffix.dropdown('set selected', suffix)
    $dropdown.relationship.dropdown('set selected', relation)
})()