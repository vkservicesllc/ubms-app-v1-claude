import { makeEvent, modelEvent } from '/modules/events/vehicle.mjs'
import application, { dropdownEvent } from './hub.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const TS = selector.id.text, TH = selector.id.hidden

    const { position } = application
    const vehicle = application.vehicle || {}
    const { mmt, length } = vehicle
    let { year, type, make, model } = vehicle
    const $vehicle = $('#vehicle-section')

    if (year) year = `:${year}`
    if (mmt && mmt !== 'other') [ type, make, model ] = mmt.split(':')

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
        vehicleMMT: [
            $('#vehicle-mmt-dropdown'),
            mmt,
            value => {
                let type, make, model

                if (value !== 'other')
                [ type, make, model ] = value.split(':')

                if (type) $dropdown.vehicleType[0].dropdown('set selected', type)
                else $dropdown.vehicleType[0].dropdown('clear')
                $(TS.currentVhlMake).val(make)
                $(TS.currentVhlModel).val(model)

                if (type !== 'straightBox') $dropdown.vehicleLength[0].dropdown('clear')
            },
        ],
        vehicleYear: [
            $('#vehicle-year-dropdown'),
            year,
        ],
        vehicleType: [
            $('#vehicle-type-dropdown'),
            type,
        ],
        vehicleLength: [
            $('#vehicle-length-dropdown'),
            length,
        ],
    }

    if (mmt) {
        if (mmt !== 'other') {
            disabledDropdown('vehicleType')
            $(TS.currentVhlMake).parent().addClass('disabled')
            $(TS.currentVhlModel).parent().addClass('disabled')
        }
        if (type !== 'straightBox') disabledDropdown('vehicleLength').parent().hide()

        $vehicle.show()
    } else $vehicle.find('input').prop('disabled', true)

    dropdownEvent($dropdown)

    makeEvent(TS.currentVhlMake, { value: make })
    modelEvent(TS.currentVhlModel, { value: model })

    function disabledDropdown(prop) {
        $dropdown[prop][0].parent().addClass('disabled').find('input').prop('disabled', true)

        return $dropdown[prop][0]
    }
})()