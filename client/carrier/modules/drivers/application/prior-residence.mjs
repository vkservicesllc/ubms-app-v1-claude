import { inputEvent } from '/modules/events/form.mjs'
import Address from '/modules/tools/core/address.us.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

const $template = $('#form-template').find('tr').clone()
{
    $template.find('input').each(function() { $(this).removeAttr('id') })
}



(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt, address } = application
    const { country } = address
    const TS = selector.class.text

    $.ajax(`/api/drivers/application/${_id}/addresses`, {
        method: 'POST',
        success(response) {
            let { data } = response
            data = sortArrayByObjectKey(data, 'since', false)

            data.forEach(record => {
                    const { address1, address2, zip, city, state, since, enough, livedAbroad } = record
                    const $row = $template.clone()

                    $row.find(TS.prevAddress1).val(address1)
                    $row.find(TS.prevAddress2).val(address2)
                    $row.find(TS.prevAddrZip).val(zip)
                    $row.find(TS.prevAddrCity).val(city)
                    $row.find(TS.prevAddrSince).val(moment(since).format('ll'))
                    $row.find('.addr-state-dropdown').find('input').val(state)
                    if (!enough) {
                        if (livedAbroad) $row.find('.lived-abroad').find('[type="checkbox"]').prop('checked', true)
                        $row.find('.lived-abroad').show()
                    }

                    $('#address-form').append($row)

            })
            $('.addr-state-dropdown').dropdown()
            if (country) {
                $('#addr-country-dropdown').find('input').val(country)
                $('#addr-country-dropdown').removeClass('disabled').parent().show()
            }
            $('#addr-country-dropdown').dropdown()

            $('.table, .footer').fadeIn()
        },
    })
})()