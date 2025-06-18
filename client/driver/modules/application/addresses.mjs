import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { check, onInput, onChange, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio
const livedAbroadId = RS.livedAbroad1

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
    const $clone = $accForm.clone().attr('id', `accident-form-${i}`)

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

        //! working with data...
    })

    return $clone.show()
}


function drawAddressForms() {}


function resetEvents() {}