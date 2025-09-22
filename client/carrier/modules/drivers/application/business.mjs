import { busNameEvent, einEvent } from '/modules/events/company.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { activeBusiness, business } = application
    const TS = selector.id.text, TC = selector.id.checkbox

    const $inactiveLLC = $(TC.inactiveLLC)
    const $fields = $('#llc-fields')

    const $dropdown = {
        state: [ $('#llc-state-dropdown'), business?.state ],
    }

    if (!activeBusiness) {
        $('.item[data-tab="business"]').append('<i class="ui dark orange briefcase icon"></i>')
        $fields.hide().find('input').prop('disabled', true)
        $inactiveLLC.prop('checked', true)
    } else
        $fields.find('input').prop('disabled', false)

    dropdownEvent($dropdown)

    $inactiveLLC.on('change', function() {
        if (!$(this).prop('checked')) {
            $(this).parent().parent().parent().hide()
            $fields.show().find('input').prop('disabled', false)
        }
    })

    busNameEvent(TS.llcName, true, { value: business?.busName })
    einEvent(TS.llcEin, { value: business?.ein })
})()