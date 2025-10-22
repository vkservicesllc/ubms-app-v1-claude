import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { address, finishedAt } = application
    const TS = selector.id.text, CS = selector.id.checkbox

    const $dropdown = {
        state: [ $('#addr-state-dropdown'), address.state[0] ],
    }
    const $calendar = {
        since: $('#addr-since-calendar'),
    }

    addr1Event(TS.address1, { value: address.address1 })
    addr2Event(TS.address2, { value: address.address2 })
    zipEvent(TS.addrZip, { value: address.zip })
    cityEvent(TS.addrCity, { value: address.city })

    dropdownEvent($dropdown)

    $calendar.since
        .calendar({
            ...calSettings,
            maxDate: moment(finishedAt).toDate(),
        })
        .calendar('set date', new Date(moment(address.since).toDate()))

    //! unfinished
})()