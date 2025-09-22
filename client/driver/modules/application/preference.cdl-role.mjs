import { inputEvent } from '/modules/events/form.mjs'
import { telMask } from '/modules/events/imask.mjs'
import { nameEvent } from '/modules/events/person.mjs'
import { onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const $card = $('#apl-card')
const $form = $('#preference-form')
const $submit = $('#preference-submit')

const $partner = $('#partner')


inputEvent(selector.class.radio.operType, {
    onChange(value) {
        let disabled = true, action = 'hide'

        if (value === 't') {
            disabled = false
            action = 'show'
        }

        $(selector.class.combo.teamPartner).prop('disabled', disabled)
        $partner[action]()
    },
})

nameEvent(selector.id.text.teamName, {
    sfxId: true,
    onChange(name, $name, suffix) {
        if (suffix) $name.val(`${name}, ${suffix}`)
    },
})

telMask(selector.id.text.teamPhone)


onSubmit($form, null, $submit, $card, {
    dismiss: () => {
        const checked = {
            haulRegion: $(`${selector.class.checkbox.haulRegion}:checked`).length > 0,
            equipmentType: $(`${selector.class.checkbox.equipmentType}:checked`).length > 0,
        }

        if (!checked.haulRegion || !checked.equipmentType) {
            alert('At least one option must be selected!')
            return true
        }
    },
})