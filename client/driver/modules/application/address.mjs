import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import { check, onInput, onChange, onSubmit } from './support.mjs'

const {
    addr1Id,
    addr2Id,
    zipId,
    cityId,
    stateId,
    addrSinceId,
} = formSelectors.driver

const $card = $('#apl-card')
const $help = {
    addrSince: $('#addr-since-help'),
    form: $('#address-form-help'),
}
const $submit = $('#address-submit')
const $form = $('#address-form')


addr1Event(addr1Id, {
    addr2Id,
    onInput,
    onChange(addr1, $addr1, addr2, $addr2) {
        onChange(addr1, $addr1)
        onChange(addr2, $addr2)
    },
})

addr2Event(addr2Id, { onInput, onChange })

zipEvent(zipId, {
    cityId,
    stateId,
    onInput,
    onChange(zip, $zip, city, state, $city, $state) {
        onChange(zip, $zip)
        onChange(city, $city)
        onChange(state, $state)
    },
})

cityEvent(cityId, { onInput, onChange })

selectEvent(stateId, { onChange })

inputEvent(addrSinceId, {
    mask: '99/99/9999',
    placeholder: 'MM/DD/YYYY',
    onInput(since, $since) {
        $help.addrSince.text(null)
        $since.removeClass('is-valid is-invalid')
    },
    onChange(since, $since) {
        if (since) {
            const date = moment(since, 'MM/DD/YYYY', true)

            if (!date.isValid()) {
                $since.addClass('is-invalid')
                $help.addrSince.text('* Invalid date')
            } else {
                const today = moment()

                if (date.isAfter(today)) {
                    $since.addClass('is-invalid')
                    $help.addrSince.text('* Future date forbidden')
                } else {
                    $since.addClass('is-valid')
                    sessionStorage.setItem(addrSinceId, since)
                }
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
})


onSubmit($form, $help, $submit, $card)