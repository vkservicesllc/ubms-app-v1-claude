import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { position, vehicle } = application
    const $form = $('#position-form')
    const $vehicle = $('#vehicle-section')

    if (vehicle?.type) $vehicle.show()
    else $vehicle.find('input').prop('disabled', true)

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

                $vehicle[action]().find('input').prop('disabled', disabled)
            },
        ],
        vehicleType: [
            $('#vehicle-type-dropdown'),
            vehicle?.type,
        ],
    }

    dropdownEvent($dropdown)

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false)
        $form.find('.unsaved-changes').show()
    })
})()