import { selectEvent } from '/modules/events/form.mjs'
import { makeEvent, modelEvent } from '/modules/events/vehicle.mjs'
import { onInput, onChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select
const vhlMmtId = SS.currentVhlMMT
const vhlMmtClass = selector.class.combo.currentVhlMMT
const vhlTypeId = SS.currentVhlType
const vhlMakeId = TS.currentVhlMake
const vhlModelId = TS.currentVhlModel
const vhlYearId = SS.currentVhlYear
const vhlLenId = SS.currentVhlLen

const requestLenght = type => {
    const $length = $(vhlLenId)
    const $container = $length.parent().parent()

    let disabled = true, action = 'hide'
    if (type === 'straightBox') {
        disabled = false
        action = 'show'
    }

    $length.prop('disabled', disabled)
    $container[action]()
}


selectEvent(vhlMmtId, {
    fill: true,
    onChange(mmt, $mmt) {
        const $fields = $(vhlMmtClass)
        const $type = $(vhlTypeId)
        const $make = $(vhlMakeId)
        const $model = $(vhlModelId)

        if (mmt === 'other') {
            $fields.prop('disabled', false).val(null)
            if (!$type.find('option[value=""]').length)
                $type.prepend('<option value="">--</option>')

            $(vhlLenId).prop('disabled', true).parent().parent().hide()
        } else {
            const [ type, make, model ] = mmt.split(':')

            $fields.prop('disabled', true).removeClass('is-valid')
            $type.val(type)
            $make.val(make)
            $model.val(model)

            requestLenght(type)
        }

        onChange(mmt, $mmt)
    },
})


selectEvent(vhlTypeId, {
    fill: true,
    onChange(type, $type) {
        requestLenght(type)
        onChange(type, $type)
    }
})


makeEvent(vhlMakeId, { onInput, onChange })

modelEvent(vhlModelId, { onInput, onChange })

selectEvent(vhlYearId, { fill: true, onChange })

selectEvent(vhlLenId, { fill: true, onChange })