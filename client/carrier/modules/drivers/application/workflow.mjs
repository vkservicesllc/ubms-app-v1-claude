import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent, errorMessage } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { _userId, _carrierId } = application

    const $dropdown = {
        user: [ $('#user-dropdown'), _userId ],
        carrier: [ $('#Carrier-dropdown'), _carrierId ],
    }
})()