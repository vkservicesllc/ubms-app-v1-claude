import { inputEvent } from '/modules/events/form.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const CS = selector.id.checkbox
const noExpId = CS.noExp

const $expDetails = $('#experience-details')

inputEvent(noExpId, {
    onChange(value, $el) {
        const checked = $el.prop('checked')

        if (!checked)
            $expDetails.find('input, select').prop('disabled', false)
    },
})