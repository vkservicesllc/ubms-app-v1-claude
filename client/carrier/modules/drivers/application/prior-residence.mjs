import { inputEvent } from '/modules/events/form.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import patterns from '/modules/registry/patterns.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt, address } = application
    const { country } = address
    const TS = selector.class.text

    const $livedAbroad = $('#lived-abroad')
    const $country = $('#addr-country-dropdown')
    const $template = $('#form-template').find('tr').clone()
    $template.find('input').each(function() { $(this).removeAttr('id') })

    let addrMaxDate = $('#addr-max-date').val() || null
    if (addrMaxDate) addrMaxDate = moment(addrMaxDate).toDate()

    const  setEvents = () => {

        addr1Event(TS.prevAddress1, {
            onChange(addr1, $addr1) {
                const $addr2 = $addr1.parent().parent().next().find(TS.prevAddress2)
                const addr2Patt = patterns.match.addr2
                let addr2 = addr2Patt.test(addr1)
                    ? addr2Patt.exec(addr1)[0].toUpperCase()
                    : null

                addr1 = addr1.replace(addr2Patt, '').trim()
                if (addr2) addr2 = patterns.replace(addr2, 'addr2')
                $addr1.val(addr1)
                $addr2.val(addr2)
            },
        })

        addr2Event(TS.prevAddress2)
        
        zipEvent(TS.prevAddrZip, {
            onChange(zip, $zip, city, state) {
                if (city && state) {
                    const $city = $zip.parent().parent().next().find(TS.prevAddrCity)
                    const $state = $zip.parent().parent().next().next().find('.addr-state-dropdown')
    
                    $city.val(city)
                    $state.dropdown('set selected', state)
                }
            },
        })

        $('.addr-state-dropdown').dropdown()

        $livedAbroad.find('[type="checkbox"]').click(function () {
            if ($(this).prop('checked')) {
                $country.find('input').prop('disabled', false)
                $country.removeClass('disabled')
                    .parent().show()
            } else {
                $country.find('input').prop('disabled', true)
                $country.addClass('disabled')
                    .parent().hide()
            }
        })
    }

    $.ajax(`/api/resource/drivers/applications/${_id}/addresses`, {
        success(response) {
            const { data } = response

            data.forEach((record, i) => {
                const { address1, address2, zip, city, state, since, enough, livedAbroad } = record
                const $row = $template.clone()

                $row.find(TS.prevAddress1).val(address1)
                $row.find(TS.prevAddress2).val(address2)
                $row.find(TS.prevAddrZip).val(zip)
                $row.find(TS.prevAddrCity).val(city)
                $row.find(TS.prevAddrSince).parent().parent()
                    .calendar({
                        ...calSettings,
                        onSelect() {},
                    })
                    .calendar('set date', moment(since).format('ll'))
                $row.find('.addr-state-dropdown').find('input').val(state)
                if (!enough) {
                    if (livedAbroad) $livedAbroad.find('[type="checkbox"]').prop('checked', true)
                    if (i === data.length - 1) $livedAbroad.show()
                }

                $('#address-form').append($row)

            })

            setEvents()
            
            if (country) {
                $country.find('input').val(country)
                $country.removeClass('disabled').parent().show()
                $country.find('input').prop('disabled', false)
            }
            $country.dropdown()

            $('.table, .footer').fadeIn()
        },
    })
})()