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
const $citForm = $('#citation-form-template')
const $button = {
    addCitation: $('#add-citation-button'),
}

onYesNoRadioChange(duiId, selector.class.radio.duiInDecade, 2)

onYesNoRadioChange(criminalId, criminalExplId)

inputEvent(selector.class.radio.citation, {
    onChange(value) {
        if (value === 'N') {
            $citations.hide()
            $citList.html(null)
            return
        }

        $.ajax(`/api/application/${formId()}/citations`, {
            method: 'POST',
            success(response) {
                const { data, error } = response
                if (error) return alert(error)

                if (!$citList.html())
                    if (!data.length) {
                        data.push({
                            _id: null,
                            citedOn: null,
                            state: null,
                            reason: null,
                            otherReason: null,
                        })

                    const count = data.length
                    for (let i = 0; i < count; i++) {
                        const $clone = $citForm.clone().attr('id', null)

                        $clone.find('input, select').each(function() {
                            const $field = $(this)

                            const id = $field.attr('id')
                            if (id) {
                                const newId = `${id}-${i}`
                                $field.attr('id', newId)
                                $clone.find(`label[for="${id}"]`).attr('for', newId)
                            }

                            const name = $field.attr('name')
                            $field.attr('name', `${name}[${i}]`)

                            const value = data[i][name]
                            if (value) $field.val(value)
                        })

                        $clone.show()
                        $citList.append($clone)
                    }
                }

                $citations.show()
            },
        })
    },
})