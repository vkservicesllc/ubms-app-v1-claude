import { inputEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit, onYesNoRadioChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const RS = selector.id.radio
const duiId = RS.dui
const criminalId = RS.criminal
const criminalExplId = selector.id.text.criminalExpl
const citationId = RS.citation

const $card = $('#apl-card')
const $citations = $('#citations')
const $citList = $('#citation-list')
const $citForm = $('#citation-form-sample')

onYesNoRadioChange(duiId, selector.class.radio.duiInDecade, 2)

onYesNoRadioChange(criminalId, criminalExplId)

inputEvent(selector.class.radio.citation, {
    onChange(value) {
        if (value === 'N') {
            $citations.hide()
            $citList.html(null)
            return
        }

        $.ajax('/api/driver/application/citations', {
            method: 'POST',
            data: { formId: formId() },
            success(response) {
                console.log(response)
                $citList.html($citForm.html())

                $citations.show()
            },
        })
    },
})