import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio, CS = selector.id.checkbox
const noExpId = CS.noExp
const startDateId = TS.expStartDate
const endDateId = TS.expEndDate

const $expDetails = $('#experience-details')


inputEvent(noExpId, {
    onChange(value, $el) {
        const checked = $el.prop('checked')

        $expDetails[checked ? 'hide' : 'show']()
    },
})