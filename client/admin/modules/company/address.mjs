import { addr1Event, addr2Event, zipEvent, cityEvent } from '../events/address.mjs'
import { inputEvent, selectEvent } from '../events/form.mjs'
import selector from '../registry/selectors/company.mjs'

const TS = selector.id.text, SS = selector.id.select
const addr1Id = TS.address1, addr2Id = TS.address2
const zipId = TS.addrZip, cityId = TS.addrCity, stateId = SS.addrState
const mailAddr1Id = TS.mailAddress1, mailAddr2Id = TS.mailAddress2
const mailZipId = TS.mailAddrZip, mailCityId = TS.mailAddrCity, mailStateId = SS.mailAddrState
const mailStatusId = '#mail-address'

const $mailFields = $('#mail-address-fields')
const $submit = $('#address-submit')
$submit.prop('disabled', false)


if (!$(mailStatusId).prop('checked'))
    $mailFields.find('input, select').prop('disabled', true)

addr1Event(addr1Id, { addr2Id })
addr2Event(addr2Id)
zipEvent(zipId, { cityId, stateId })
cityEvent(cityId)
selectEvent(stateId)

inputEvent(mailStatusId, {
    onChange(value, $input) {
        const checked = $input.is(':checked')

        $mailFields
            [checked ? 'show' : 'hide']()
            .find('input, select')
            .prop('disabled', !checked)
    },
})

addr1Event(mailAddr1Id, { addr2Id: mailAddr2Id, mail: true })
addr2Event(mailAddr2Id)
zipEvent(mailZipId, { cityId: mailCityId, stateId: mailStateId })
cityEvent(mailCityId)
selectEvent(mailStateId)