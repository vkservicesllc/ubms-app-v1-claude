import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import patterns from '/modules/registry/patterns.mjs'
import formId, { check, onInput, onChange, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const RS = selector.id.radio
const TS = selector.class.text, SS = selector.class.select
const livedAbroadId = RS.livedAbroad1
const addrSinceId = selector.id.text.addrSince

const $addresses = $('#addresses')
const $country = $('#country')
const $addrList = $('#address-list')
const $addrForm = $('#address-form-template')


if ($(livedAbroadId.no).is(':checked')) drawAddressForms()

let selected = false

inputEvent(livedAbroadId.no, {
    onChange() {
        selected = true

        $country.hide()
        drawAddressForms()
    },
})

inputEvent(livedAbroadId.yes, {
    onChange(value, $el) {
        if (selected === true) {
            if (confirm('By confirming, you acknowledge that your address data will be erased!')) {
                $addresses.hide()
                $addrList.html(null)
                $country.show()

                selected = false
            } else {
                $el.prop('checked', false)
                $(livedAbroadId.no).prop('checked', true)
            }
        } else $country.show()
    }
})


function cloneAddrForm(i = 0, data = null) {
    const $clone = $addrForm.clone().attr('id', `accident-form-${i}`)
    $clone.attr('data-idx', i)

    $clone.find('input, select').each(function() {
        const $field = $(this)

        const id = $field.attr('id')
        if (id) {
            const newId = `${id}-${i}`

            $field.attr('id', newId)
            $clone.find(`label[for="${id}"]`).attr('for', newId)
        }

        const name = $field.attr('name').replace('[]', '')

        $field.prop('disabled', false)

        if (data) {}
    })

    return $clone.show()
}


function drawAddressForms() {
    $.ajax(`/api/application/${formId()}/addresses`, {
        method: 'POST',
        success(response) {
            const { data, error } = response
            if (error) return alert(error)

            if (!data.length)
                data.push({
                    since: null,
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

    inputEvent(TS.prevAddrSince, {
        mask: '99/99/9999',
        placeholder: 'MM/DD/YYYY',
        onKeyup(date, $date) {
            $date.removeClass('is-valid is-invalid').next().text(null)
        },
        onCompleted(since, $since) {
            const $help = $since.next()
            let idx = $since
                .parent().parent().parent().parent()
                .data('idx')
            idx = +idx

            since = moment(since, 'MM/DD/YYYY', true)

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
                    const minDate = moment($(selector.id.hidden.appliedOn).val()).clone().subtract(3, 'years')

                    $since.addClass('is-valid')
                }
            }

        },
    })

}