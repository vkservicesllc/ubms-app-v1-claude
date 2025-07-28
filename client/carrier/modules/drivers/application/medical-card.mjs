import { inputEvent } from '/modules/events/form.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent, errorMessage, errorIcon } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { medCard } = application

    if (!medCard)
        $('.item[data-tab="medical-card"]').append('<i class="ui dark orange first aid icon"></i>')
})()