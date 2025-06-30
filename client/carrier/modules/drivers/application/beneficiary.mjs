import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { firstName, middleName, lastName, suffix, relation, otherRel, phone, ssn } = application.beneficiary

    const TS = selector.id.text
    const $otherRel = $(TS.benefOtherRel)

    const relationOnChange = value => {
        let disabled = true, action = 'hide'

        if (value === 'Other') {
            disabled = false
            action = 'show'
        }

        $otherRel.prop('disabled', disabled)
        $field.otherRel[action]()
    }

    const $dropdown = {
        suffix: [ $('#beneficiary-suffix-dropdown'), suffix ],
        relationship: [ $('#beneficiary-relationship-dropdown'), relation, relationOnChange ],
    }
    const $field = {
        otherRel: $('#beneficiary-other-relationship-field'),
    }

    dropdownEvent($dropdown)

    nameEvent(TS.benefFirstName, { value: firstName })
    
    nameEvent(TS.benefMiddleName, { value: middleName })
    
    nameEvent(TS.benefLastName, {
        sfxId: true,
        value: lastName,
        onChange(lastName, $lastName, suffix) {
            if (suffix)
                $dropdown.suffix.dropdown('set selected', suffix)
        },
    })

    telEvent(TS.benefPhone, { value: phone })

    ssnEvent(TS.benefSsn, { value: ssn })

    if (otherRel) {
        $otherRel.val(otherRel).prop('disabled', false)
        $field.otherRel.show()
    }
})()