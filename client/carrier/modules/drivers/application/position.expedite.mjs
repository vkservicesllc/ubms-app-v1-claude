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

                //! need to reset if other than "other"
            },
        ],
        vehicleMMT: [
            $('#vehicle-mmt-dropdown'),
            mmt,
            value => {
                let type, make, model
                const $make = $(TS.currentVhlMake), $model = $(TS.currentVhlModel)
                const $field = {
                    type: $dropdown.vehicleType[0].parent(),
                    make: $make.parent(),
                    model: $model.parent(),
                    length: $dropdown.vehicleLength[0].parent(),
                }
                let classAction = 'removeClass',
                    lenClassAction = 'addClass',
                    lenFieldAction = 'hide'

                if (value !== 'other') {
                    [ type, make, model ] = value.split(':')
                    classAction = 'addClass'
                    if (type !== 'straightBox') $dropdown.vehicleLength[0].dropdown('clear')
                    else {
                        lenClassAction = 'removeClass'
                        lenFieldAction = 'show'
                    }
                }

                if (type) $dropdown.vehicleType[0].dropdown('set selected', type)
                else $dropdown.vehicleType[0].dropdown('clear')
                $(TS.currentVhlMake).val(make)
                $(TS.currentVhlModel).val(model)

                $field.type[classAction]('disabled')
                $field.make[classAction]('disabled')
                $field.model[classAction]('disabled')
                $field.length[lenClassAction]('disabled')[lenFieldAction]()
                //! Check whether need to activate/deactive hidden input
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
            value => {
                const $field = $dropdown.vehicleLength[0].parent()
                let classAction = 'addClass', fieldAction = 'hide', disabled = 'true'

                if (value === 'straightBox') {
                    classAction = 'removeClass'
                    fieldAction = 'show'
                }

                $field.length[classAction]('disabled')[fieldAction]()
                //! Check whether need to activate/deactive hidden input
            },
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