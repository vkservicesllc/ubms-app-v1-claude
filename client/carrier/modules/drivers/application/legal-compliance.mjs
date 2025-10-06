import { inputEvent } from '/modules/events/form.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { dui, duiInDecade, criminal, criminalExpl, dotDat, citations } = application
    const TS = selector.id.text, CS = selector.id.checkbox, RS = selector.id.radio
    const $duiInDecade = $('.dui-in-decade'), $criminalExpl = $('#criminal-details')
console.log({ citations })

    if (dui) {
        $(CS.dui).prop('checked', true)
        $duiInDecade.show().find('input').prop('disabled', false)
        $(RS.duiInDecade[duiInDecade ? 'yes' : 'no']).prop('checked', true)
    }

    if (criminal) {
        $(CS.criminal).prop('checked', true)
        $criminalExpl.show()
        $(TS.criminalExpl).val(criminalExpl).prop('disabled', false)
    }

    if (dotDat) $(CS.dotDat).prop('checked', true)

    $(CS.dui).on('change', function() {
        let action = 'hide', disabled = true
        if ($(this).prop('checked')) {
            action = 'show'
            disabled = false
        }
        $duiInDecade[action]().find('input').prop('disabled', disabled)
    })

    $(CS.criminal).on('change', function() {
        let action = 'hide', disabled = true
        if ($(this).prop('checked')) {
            action = 'show'
            disabled = false
        }
        $criminalExpl[action]()
        $(TS.criminalExpl).prop('disabled', disabled)
    })

})()