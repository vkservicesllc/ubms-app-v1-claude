import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { position, vehicle } = application

    const $dropdown = {
        position: [
            $('#position-dropdown'),
            position[0],
            value => {
                let disabled = true, action = 'hide'

                if (value === 'OO') {
                    disabled = false
                    action = 'show'
                }

                //
            },
        ],
        vehicleType: [
            $('#vehicle-type-dropdown'),
            vehicle.type,
        ],
    }

    dropdownEvent($dropdown)
})()