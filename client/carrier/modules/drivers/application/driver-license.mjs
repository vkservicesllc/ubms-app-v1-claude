import { inputEvent } from '/modules/events/form.mjs'
import { driverLicenseEvent, dlClassEvent } from '/modules/events/person.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { dl } = application
    const TS = selector.id.text, TC = selector.id.checkbox
console.log(dl)

    const $dropdown = {
        state: [ $('#dl-state-dropdown'), dl.state ],
    }
    const $calendar = {
        issuedOn: $('#dl-issued-calendar'),
        expiresOn: $('#dl-expires-calendar'),
    }

    $(TC.dlCommercial)
        .prop('checked', dl.commercial)
        .on('change', function() {
            //
        })

    dropdownEvent($dropdown)

    driverLicenseEvent(TS.dlNumber, { value: dl.number })
    
    dlClassEvent(TS.dlClass, { value: dl.class })

    $calendar.issuedOn
        .calendar({
            ...calSettings,
            maxDate: moment().toDate(),
        })
        .calendar('set date', new Date(moment(dl.issuedOn).toDate()))

    $calendar.expiresOn
        .calendar({
            ...calSettings,
            minDate: moment().add(1, 'days').toDate(),
        })
        .calendar('set date', new Date(moment(dl.expiresOn).toDate()))

    inputEvent(TS.dlEndrs, { strip: true, capitalize: 'first', value: dl.endorsement })
    inputEvent(TS.dlRestr, { strip: true, capitalize: 'first', value: dl.restriction })

    if (dl.commercial) $(TS.dlEndrs).prop('disabled', false).parent().show()

})()