import { inputEvent } from '/modules/events/form.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

const $template = $('#form-template').find('tr').clone()
{
    $template.find('input').each(function() { $(this).removeAttr('id') })
}



(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt, address } = application
    const { country } = address
console.log({ country })
    $.ajax(`/api/drivers/application/${_id}/addresses`, {
        method: 'POST',
        success(response) {
            const { data } = response
console.log(data)
            $('#address-form').append($template)
        },
    })
})()