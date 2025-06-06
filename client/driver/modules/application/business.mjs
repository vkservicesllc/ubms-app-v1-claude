import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { check, onInput, onChange, onSubmit, onYesNoRadioChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio


inputEvent(selector.class.radio.activeLLC, {
    onChange(value) {
        const $businessDetails = $('#business-details')
        const $businessAssistance = $('#business-assistance')
        const $business = $(selector.class.combo.llcDetails)
        const $assistance = $(selector.class.radio.llcAssistance)

        switch (value) {
            case 'Y':
                $businessAssistance.hide()
                $assistance.prop('disabled', true)
                $business.prop('disabled', false)
                $businessDetails.show()
                break
            case 'N':
                $businessDetails.hide()
                $business.prop('disabled', true)
                $assistance.prop('disabled', false)
                $businessAssistance.show()
                break
        }
    },
})


onYesNoRadioChange(RS.llcAssistance, TS.llcProposedName) //! not working