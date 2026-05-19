import { selectEvent } from '/modules/events/form.mjs'
import { onChange  } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import settings from "/modules/settings/driver-application.mjs"


selectEvent(selector.id.select.currentVhlType, {
    fill: true,
    onChange(type, $type) {
        const found = settings.vhlType_wTrailer.includes(type)
        $('#own-trailer')[found ? 'show' : 'hide']()
            .find('[type="radio"]').prop('disabled', !found)

        onChange(type, $type)
    },
})