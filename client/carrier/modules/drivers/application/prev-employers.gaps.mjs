import selector from '/modules/registry/selectors/driver-application-employment.mjs'
import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id } = application
    const $table = $('#empl-gap-table')

    $.ajax(`/api/resource/drivers/applications/${_id}/employments`, {
        success(response) {
            const { data } = response
            const body = $('<tr></tr>'), gaps = false

            if (gaps) $table.html(null).append(body)
        },
    })
})()