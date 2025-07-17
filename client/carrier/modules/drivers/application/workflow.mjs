import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent, errorMessage } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const $dropdown = {
        carrier: $('#carrier-dropdown'),
    }

    $dropdown.carrier.dropdown()

    // const { _userId, _carrierId } = application

    // const $dropdown = {
    //     user: [ $('#user-dropdown'), _userId ],
    //     carrier: [ $('#carrier-dropdown'), _carrierId ],
    // }

    // $.ajax('/api/team/carriers', {
    //     method: 'POST',
    //     success(carriers) {
    //         let items = ''

    //         carriers.forEach(carrier => {
    //             const { _id, name } = carrier
    //             items += `<div class="item" data-value="${_id}">${name}</div>`
    //         })
    //         $dropdown.carrier[0].find('.menu').html(items)

    //         dropdownEvent($dropdown)
    //     },
    // })
})()