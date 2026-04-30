import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { address } = application
    const TS = selector.id.text, CS = selector.id.checkbox

    const $form = $('#residence-form')
    const $dropdown = {
        state: [ $('#addr-state-dropdown'), address.state ],
        country: [ $('#addr-country-dropdown'), address.country ],
    }
    const $calendar = {
        since: $('#addr-since-calendar'),
    }
    const $livedAbroad = $(CS.livedAbroad1)
    const $priorAddr = $('#prior-addresses')
    const $enough = $(selector.id.hidden.addrEnough)
    const $currentSince = $(selector.id.hidden.addrSince)

    $enough.val(+address.enough)
    $currentSince.val(address.since)

    addr1Event(TS.address1, { addr2Id: TS.address2, value: address.address1 })
    addr2Event(TS.address2, { value: address.address2 })
    zipEvent(TS.addrZip, {
        value: address.zip,
        cityId: TS.addrCity,
        onChange(zip, $zip, city, state) {
            if (state) $dropdown.state[0].dropdown('set selected', state)
        },
    })
    cityEvent(TS.addrCity, { value: address.city })

    dropdownEvent($dropdown)

    $calendar.since
        .calendar({
            ...calSettings,
            maxDate: moment(application.finishedAt).toDate(),
            onChange(since) {
                const finishedOn = moment(application.finishedOn)
                const limit = finishedOn.clone().subtract(3, 'years')
                since = moment(since)

                if (since.isBefore(limit)) {
                    $enough.val('1')
                    //! disable and hide
                } else {
                    $enough.val('0')
                    //! enable and show
                }
            },
        })
        .calendar('set date', new Date(moment(address.since).toDate()))

    if (!address.enough) {
        const { livedAbroad } = address

        $livedAbroad.prop('checked', livedAbroad).parent().parent().show()
        if (livedAbroad) $dropdown.country[0].removeClass('disabled').parent().show()
        else {
            //? need to figure out check mark and color
            //? warning for tab
            $priorAddr.show()
        }
    }

    $livedAbroad.on('change', function() {
        if ($(this).prop('checked')) {
            $priorAddr.hide()
            $dropdown.country[0].removeClass('disabled').parent().show()
        } else {
            $dropdown.country[0].addClass('disabled').parent().hide()
            $priorAddr.show()
        }
    })

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false)
        $form.find('.unsaved-changes').show()
    })

    //! warning if country is enabled and not selected
})()