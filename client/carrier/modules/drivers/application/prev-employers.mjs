import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

const $form = { add: $('#new-employer-form') }
const $template = $form.add.clone()
$template.removeAttr('id')

{
    $form.add.find('input:not([type="checkbox"]), textarea').val(null)
    $form.add.find('[type="checkbox"]').prop('checked', false)
}


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt } = application
    const $list = $('#employer-list')
    const TS = selector.class.text

    $.ajax(`/api/drivers/application/${_id}/employments`, {
        method: 'POST',
        success(response) {
            let { data } = response
            data = sortArrayByObjectKey(data, 'startedOn')
            let len = data.length

            data.forEach((record, i) => {
                const { _id, employer, phone, address, position, earnings, rfl, fmscr, dotDat } = record
                const { address1, address2, city, state, zip } = address

                const $column = $('<div class="seven wide column"></div>')
                const $card = $('<div class="ui card" style="width: 100%;"><div class="content"></div></div>')
                $card.find('.content').html(`<div class="header">Previous Employer <small># ${len--}</small></div>`)
                $card.append('<div class="content card-form"></div>')
                const $form = $template.clone()

                $form.find(TS.prevEmployer).val(employer)
                $form.find(TS.emplPhone).val(formatTel(phone))
                $form.find(TS.emplAddress1).val(address1)
                $form.find(TS.emplAddress2).val(address2)
                $form.find(TS.emplAddrZip).val(zip)
                $form.find(TS.emplAddrCity).val(city)
                $form.find(TS.emplPosition).val(position)
                $form.find(TS.emplRfl).val(rfl)

                $card.find('.card-form').append($form)
                $column.append($card)
                $list.append($column)
            })

            $list.fadeIn()
        },
    })
})()