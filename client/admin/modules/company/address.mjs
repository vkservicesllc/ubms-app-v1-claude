import { addr1Event, addr2Event, zipEvent, cityEvent } from '../events/address.mjs'
import { inputEvent, selectEvent } from '../events/form.mjs'
import { formSelectors } from '../registry/selectors.mjs'

const { addr1Id, addr2Id, zipId, cityId, stateId, mailStatusId, mailAddr1Id, mailAddr2Id, mailZipId, mailCityId, mailStateId } = formSelectors.company

const $submit = $('#address-submit')
$submit.prop('disabled', false)

addr1Event(addr1Id, { addr2Id })
addr2Event(addr2Id)
zipEvent(zipId, { cityId, stateId })
cityEvent(cityId)
selectEvent(stateId)

inputEvent(mailStatusId, {
    onChange(value, $input) {
        $('.mail-address').prop('disabled', !$input.is(':checked'))
    },
})

addr1Event(mailAddr1Id, { addr2Id: mailAddr2Id, mail: true })
addr2Event(mailAddr2Id)
zipEvent(mailZipId, { cityId: mailCityId, stateId: mailStateId })
cityEvent(mailCityId)
selectEvent(mailStateId)