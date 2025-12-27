import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { dateMask } from '/modules/events/imask.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import patterns from '/modules/registry/patterns.mjs'
import formId, { check, onInput, onChange, addressPredictions } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

const TS = selector.class.text, SS = selector.class.select, RS = selector.class.radio
const livedAbroadId = selector.id.radio.livedAbroad1
const addrSinceId = selector.id.text.addrSince

const $addresses = $('#addresses')
const $country = $('#country')
const $addrList = $('#address-list')
const $addrForm = $('#address-form-template')

const $form = $('#address-form')
const $help = {
    form: $('#address-form-help'),
}


let selected = false

if ($(livedAbroadId.no).is(':checked')) {
    drawAddressForms()
    selected = true
}

inputEvent(livedAbroadId.no, {
    onChange() {
        selected = true

        $country.hide().find('select').prop('disabled', true)
        drawAddressForms()
    },
})

inputEvent(livedAbroadId.yes, {
    onChange(value, $el) {
        if (selected === true) {
            if (confirm('By confirming, you acknowledge that your address data will be erased!')) {
                $addresses.hide()
                $addrList.html(null)
                $country.show().find('select').prop('disabled', false)

                selected = false
            } else {
                $el.prop('checked', false)
                $(livedAbroadId.no).prop('checked', true)
            }
        } else $country.show().find('select').prop('disabled', false)
    }
})

selectEvent(selector.id.select.country, { fill: true, onChange })


function cloneAddrForm(i = 0, data = null) {
    const patt = /\[([^\]]+)\]/
    const $clone = $addrForm.clone().attr('id', `address-form-${i}`)
    $clone.attr('data-idx', i)

    if (data) data = sortArrayByObjectKey(data, 'since', false)

    $clone.find('input, select').each(function() {
        const $field = $(this)
        const type = $field.attr('type')

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${i}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name')
        const match = name.match(patt)
        const prop = match ? match[1] : null

        if (type !== 'radio') $field.prop('disabled', false)
        $field.attr('name', name.replace('[]', `[${i}]`))

        if (data) {
            const type = $field.attr('type')
            const value = data[i][prop]

            if (value !== null) {
                if (type === 'radio') {
                    const _value = $field.attr('value')

                    $field.prop('disabled', false)
                    if ((_value === 'Y' && value === 1) || (_value === 'N' && value === 0))
                        $field.prop('checked', true)

                    $field.parent().parent().parent().show()
                } else {
                    $field.val(value).addClass('is-valid')

                    if ($field.is('select')) $field.find('option[value=""]').remove()
                    if ($field.parent().is(':hidden')) $field.parent().show()
                }
            }
        }
    })

    return $clone.show()
}


function drawAddressForms() {
    $.ajax(`/api/list/application/${formId()}/addresses`, {
        method: 'POST',
        success(response) {
            const { data } = response

            if (!data.length)
                data.push({
                    since: null,
                    enough: null,
                    address1: null,
                    address2: null,
                    city: null,
                    state: null,
                    zip: null,
                    livedAbroad: null,
                })
            else data.forEach(row => row.since = moment(row.since).format('MM/DD/YYYY'))

            const count = data.length
            for (let i = 0; i < count; i++) $addrList.append(cloneAddrForm(i, data))

            resetEvents()
            $addresses.show()
        },
    })
}


function resetEvents() {

    addr1Event(TS.prevAddress1, {
        onInput,
        onChange(addr1, $addr1) {
            const $addr2 = $addr1.parent().next().find(TS.prevAddress2)
            const addr2Patt = patterns.match.addr2
            let addr2 = addr2Patt.test(addr1)
                ? addr2Patt.exec(addr1)[0].toUpperCase()
                : null

            addr1 = addr1.replace(addr2Patt, '').trim()
            if (addr2) addr2 = patterns.replace(addr2, 'addr2')
            $addr1.val(addr1)
            $addr2.val(addr2)

            onChange(addr1, $addr1)
        },
    })

    addr2Event(TS.prevAddress2, { onInput, onChange })

    zipEvent(TS.prevAddrZip, {
        onInput,
        onChange(zip, $zip, city, state) {
            if (city && state) {
                const $city = $zip.parent().parent().next().find(TS.prevAddrCity)
                const $state = $zip.parent().parent().next().find(SS.prevAddrState)

                $city.val(city).addClass('is-valid')
                $state.val(state).addClass('is-valid').find('option[value=""]').remove()
            }

            onChange(zip, $zip)
        },
    })

    cityEvent(TS.prevAddrCity, { onInput, onChange })
    
    selectEvent(SS.prevAddrState, { fill: true, onChange })

    dateMask(TS.prevAddrSince, {
        pattern: 'us',
        onAccept(mask, $date) {
            $date.removeClass('is-valid is-invalid').next().text(null)
        },
        onComplete(mask, $since) {
            {
                const $help = $since.next()
                const $form = $since.parent().parent().parent().parent()
                const idx = +$form.data('idx')

                const since = moment(mask.value, 'MM/DD/YYYY', true)

                if (!since.isValid()) {
                    $since.addClass('is-invalid')
                    $help.text('* Invalid date')
                } else {
                    const maxDate = idx
                        ? moment($(`${selector.id.text.prevAddrSince}-${idx - 1}`).val() , 'MM/DD/YYYY').format('YYYY-MM-DD')
                        : moment($(addrSinceId).val(), 'MM/DD/YYYY').format('YYYY-MM-DD')

                    if (since.isSameOrAfter(maxDate)) {
                        let msg = '* Date overlap'
                        msg += `<br/>Date expected<br/>before ${moment(maxDate).format('ll')}`

                        $since.addClass('is-invalid')
                        $help.html(msg)
                    } else {
                        let nextSince = $form.next().find(TS.prevAddrSince).val()
                        if (nextSince) nextSince = moment(nextSince, 'MM/DD/YYYY')

                        if (nextSince && since.isSameOrBefore(nextSince)) {
                            let msg = '* Date overlap'
                            msg += `<br/>Date expected<br/>after ${moment(nextSince).format('ll')}`

                            $since.addClass('is-invalid')
                            $help.html(msg)
                        } else {
                            const $livedAbroad = $since.parent().parent().next()
                            //! It's too bad I had to use a custom class
                            const $enough = $since.parent().parent().parent().find('.driver-application-prev-addr-enough-hidden-input')
                            const minDate = moment($(selector.id.hidden.appliedOn).val()).clone().subtract(3, 'years')

                            if (since.isSameOrAfter(minDate)) {
                                $livedAbroad.show().find('input').prop('disabled', false)
                                $enough.val('0')
                            } else {
                                $enough.val('1')
                                $livedAbroad.hide().find('input').prop('disabled', true)
                                $country.hide().find('select').prop('disabled', true)
                            }

                            $since.addClass('is-valid')
                        }
                    }
                }
            }

            if (check($form)) $help.form.hide().html(null)
        },
    })

    inputEvent(RS.prevLivedAbroad, {
        onChange(value, $el) {
            const $form = $el.parent().parent().parent().parent().parent()
            const $nextForms = $form.nextAll()
            const idx = +$form.data('idx')
            let action = 'show', disabled = false

            if (value === 'Y') {
                if ($nextForms.length) {
                    const $lastForm = $nextForms.eq($nextForms.length - 1)
                    let filled = true

                    $lastForm.find('input[required], select[required]').each(function() {
                        if (filled && !$(this).val()) filled = false
                    })

                    if (filled) {
                        const $livedAbroad = $lastForm.find('input[type="radio"]:not(:disabled)')
                        if ($livedAbroad.length) {
                            filled = false

                            $livedAbroad.each(function() {
                                if ($(this).prop('checked')) filled = true
                            })
                        }
                    }

                    if (!filled) $lastForm.remove() //! WORKS BAD WITH $nextForms.length > 1
                    $nextForms.hide()
                }
            } else {
                action = 'hide'
                disabled = true

                if (!$nextForms.length) {
                    $form.after(cloneAddrForm(idx + 1))
                    resetEvents()
                } else $nextForms.show()
            }

            $country[action]().find('select').prop('disabled', disabled)
        },
    })

}


export default () => {
    if ($addrList.length) {
        $addrList.children().each(function() {
            const $livedAbroad = $(this).find(`${RS.prevLivedAbroad}[value="Y"]`).eq(0)

            if ($livedAbroad.prop('checked')) $(this).nextAll().remove()
        })
    }
}