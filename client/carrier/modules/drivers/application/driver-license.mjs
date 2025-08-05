import { inputEvent } from '/modules/events/form.mjs'
import { driverLicenseEvent, dlClassEvent } from '/modules/events/person.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { dl } = application
    const TS = selector.id.text, TC = selector.id.checkbox

    const $commercial = $(TC.dlCommercial)
    const $endorsement = $(TS.dlEndrs)
    const $denied = $(TC.dlDenied), $revoked = $(TC.dlRevoked)
    const $deniedExpl = $(TS.dlDeniedExpl), $revokedExpl = $(TS.dlRevokedExpl)

    const $dropdown = {
        state: [ $('#dl-state-dropdown'), dl.state ],
    }
    const $calendar = {
        issuedOn: $('#dl-issued-calendar'),
        expiresOn: $('#dl-expires-calendar'),
    }

    $commercial
        .prop('checked', dl.commercial)
        .on('change', function() {
            let value = 'N', disabled = true, action = 'hide'

            if ($(this).prop('checked')) {
                value = 'Y'
                disabled = false
                action = 'show'
            }

            $(this).val(value)
            $endorsement.prop('disabled', disabled).parent()[action]()
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

    if (dl.commercial) {
        $commercial.val('Y')
        $endorsement.prop('disabled', false).parent().show()
    }

    $denied
        .prop('checked', dl.denied)
        .on('change', function() {
            let value = 'N', disabled = true, action = 'hide'

            if ($(this).prop('checked')) {
                value = 'Y'
                disabled = false
                action = 'show'
            }

            $(this).val(value)
            $deniedExpl.prop('disabled', disabled).parent()[action]()
        })
    if (dl.denied) {
        $denied.val('Y')
        $deniedExpl.prop('disabled', false).parent().show()
    }

    $revoked
        .prop('checked', dl.revoked)
        .on('change', function() {
            let value = 'N', disabled = true, action = 'hide'

            if ($(this).prop('checked')) {
                value = 'Y'
                disabled = false
                action = 'show'
            }

            $(this).val(value)
            $revokedExpl.prop('disabled', disabled).parent()[action]()
        })
    if (dl.revoked) {
        $revoked.val('Y')
        $revokedExpl.prop('disabled', false).parent().show()
    }

    inputEvent(TS.dlDeniedExpl, { strip: true, capitalize: 'first', value: dl.deniedExpl })
    inputEvent(TS.dlRevokedExpl, { strip: true, capitalize: 'first', value: dl.revokedExpl })
})()