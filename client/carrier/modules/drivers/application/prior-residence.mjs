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

    const minDate = moment(application.appliedOn).clone().subtract(3, 'years')
    let addrMaxDate = $('#addr-max-date').val() || null
    if (addrMaxDate) addrMaxDate = moment(addrMaxDate).toDate()

    const setEvents = validateForm => {

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
                validateForm()
            },
        })

        addr2Event(TS.prevAddress2, {
            onChange() {
                validateForm()
            },
        })
        
        zipEvent(TS.prevAddrZip, {
            onChange(zip, $zip, city, state) {
                if (city && state) {
                    const $city = $zip.parent().parent().next().find(TS.prevAddrCity)
                    const $state = $zip.parent().parent().next().next().find('.addr-state-dropdown')
    
                    $city.val(city)
                    $state.dropdown('set selected', state)
                }
                validateForm()
            },
        })

        $('.addr-state-dropdown').dropdown({
            onSelect() {
                validateForm()
            },
        })

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

            validateForm()
        })
    }

    $.ajax(`/api/resource/drivers/applications/${_id}/addresses`, {
        success(response) {
            const { data } = response
            const len = data.length
            const $addrForm = $('#address-form')

            const sinceCal = {
                ...calSettings,
                maxDate: addrMaxDate,
                onSelect(since) {
                    //! HERE I NEED TO FIGURE OUT enough and act based on that
                    since = moment(since)

                    validateForm()
                },
            }

            const appendRow = (evts = false) => {
                const $row = $template.clone()

                $row.find(TS.prevAddrSince).parent().parent()
                    .calendar(sinceCal)

                $addrForm.append($row)
                setEvents(validateForm)
            }

            if (len) {
                data.forEach((record, i) => {
                    const { address1, address2, zip, city, state, since, enough, livedAbroad } = record
                    const $row = $template.clone()

                    $row.find(TS.prevAddress1).val(address1)
                    $row.find(TS.prevAddress2).val(address2)
                    $row.find(TS.prevAddrZip).val(zip)
                    $row.find(TS.prevAddrCity).val(city)
                    $row.find(TS.prevAddrSince).parent().parent()
                        .calendar(sinceCal)
                        .calendar('set date', moment(since).format('ll'))
                    $row.find('.addr-state-dropdown').find('input').val(state)
                    if (!enough) {
                        if (livedAbroad) $livedAbroad.find('[type="checkbox"]').prop('checked', true)
                        if (i === len - 1) $livedAbroad.show()
                    }

                    $addrForm.append($row)
                })
                setEvents(validateForm)
            } else appendRow()
            
            if (country) {
                $livedAbroad.show().find('[type="checkbox"]').prop('checked', true)
                $country.find('input').val(country)
                $country.removeClass('disabled').parent().show()
                $country.find('input').prop('disabled', false)
            }
            $country.dropdown({
                onChange() {
                    console.log('selected')
                    validateForm()
                },
            })

            $('.table, .footer').fadeIn()

            function checkEnough() {
                let enough = false
                const $rows = $addrForm.children()

                for (const tr of $rows) {
                    const since = moment($(tr).find('.addr-date-calendar').calendar('get date'))
                    if (!since.isValid()) break

                    if (since.isBefore(minDate)) {
                        enough = true
                        break
                    }
                }

                return enough
            }

            function checkCountry() {
                const checked = $livedAbroad.find('[type="checkbox"]').prop('checked')
                const country = $country.dropdown('get value') || null

                return checked && !!country
            }

            function validateForm() {
                const $submit = $('[type="submit"]')
                const $warning = $('.unsaved-changes')
                let disabled = true, action = 'hide'

                if (checkEnough() || checkCountry()) {
                    disabled = false
                    action = 'show'
                }

                $submit.prop('disabled', disabled)
                $warning[action]()
            }
        },
    })
})()