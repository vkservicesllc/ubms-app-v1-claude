import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { _id } = application
    const $dropdown = {
        state: $('.cit-state'),
    }

    $dropdown.state.dropdown()

    $.ajax(`/api/drivers/application/${_id}/citations`, {
        method: 'POST',
        success(response) {
            console.table(response.data)
        },
    })
})()