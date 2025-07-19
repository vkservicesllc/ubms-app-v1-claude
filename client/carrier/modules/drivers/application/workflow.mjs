import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent, errorMessage } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const $dropdown = {
        user: $('#user-dropdown'),
        carrier: $('#carrier-dropdown'),
        condition: $('#condition-dropdown'),
        experience: $('#experience-dropdown'),
        apprPosition: $('#approved-position-dropdown'),
    }

    for (const prop in $dropdown)
        $dropdown[prop].dropdown()
})()