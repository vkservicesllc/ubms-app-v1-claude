import { inputEvent } from '/modules/events/form.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return
})()