import { onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const $card = $('#apl-card')
const $form = $('#preference-form')
const $submit = $('#preference-submit')


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