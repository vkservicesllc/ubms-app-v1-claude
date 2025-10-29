import { inputEvent } from '/modules/events/form.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import patterns from '/modules/registry/patterns.mjs'
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
    const TS = selector.class.text, CS = selector.class.checkbox

    const $button = {
        add: $('#add'),
    }
    const $modal = $('#add-modal')

    $modal.modal({
        autofocus: false,
        closable: false,
        onHidden() {
            $form.add.find('input:not([type="checkbox"]), textarea').val(null)
            $form.add.find('[type="checkbox"]').prop('checked', false)
            $form.add.find('.empl-addr-state-dropdown').dropdown('clear')
        },
    })

    $button.add.click(function() {
        $modal.modal('show')
    })

    $.ajax(`/api/drivers/application/${_id}/employments`, {
        method: 'POST',
        success(response) {
            let { data } = response
            data = sortArrayByObjectKey(data, 'startedOn', false)
            let len = data.length

            data.forEach((record, i) => {
                const { _id, employer, startedOn, leftOn, phone, address, position, earnings, rfl, fmcsr, dotDat } = record
                const { address1, address2, city, state, zip } = address
                const tag = !leftOn
                    ? ' <div class="ui teal tag right floated basic label">Still employed</div>'
                    : ''

                const $column = $('<div class="seven wide column"></div>')
                const $card = $('<div class="ui card" style="width: 100%;"><div class="content"></div></div>')
                $card.find('.content').html(`<div class="header">Previous Employer <small># ${len--}</small>${tag}</div>`)
                $card.append('<div class="content card-form"></div>')
                const $form = $template.clone()
                const formId = `employer-form-${i}`
                $form.attr('id', formId)
                $form.find('label').removeAttr('for')
                const $footer = $('<div class="content"></div>')
                $footer.append(`<button class="ui red button" data-id="${_id}">Delete</button>`)
                $footer.append(`<button type="submit" form="${formId}" class="ui right floated green button">Save</button>`)

                $form.find('[name="_id[]"]').removeAttr('id').val(_id)
                $form.find(TS.prevEmployer).removeAttr('id').val(employer)
                $form.find(TS.emplStartDate).removeAttr('id').val(moment(startedOn).format('ll'))
                $form.find(TS.emplEndDate).removeAttr('id').val(leftOn ? moment(leftOn).format('ll') : null)
                $form.find(TS.emplPhone).removeAttr('id').val(formatTel(phone))
                $form.find(TS.emplAddress1).removeAttr('id').val(address1)
                $form.find(TS.emplAddress2).removeAttr('id').val(address2)
                $form.find(TS.emplAddrZip).removeAttr('id').val(zip)
                $form.find(TS.emplAddrCity).removeAttr('id').val(city)
                $form.find('[name="state[]"]').removeAttr('id').val(state[0])
                $form.find(TS.emplPosition).removeAttr('id').val(position)
                $form.find(TS.emplEarnings).removeAttr('id').val(earnings.toLocaleString())
                $form.find(TS.emplRfl).removeAttr('id').val(rfl)
                $form.find(CS.emplFmcsr).removeAttr('id').prop('checked', !!fmcsr)
                $form.find(CS.emplDotDat).removeAttr('id').prop('checked', !!dotDat)

                $card.find('.card-form').append($form)
                $card.append($footer)
                $column.append($card)
                $list.append($column)
            })

            busNameEvent(TS.prevEmployer, true, {
                onChange(busName, coType, $busName) {
                    if (coType) $busName.val(`${busName}, ${coType}`)
                },
            })

            $('.empl-addr-state-dropdown').dropdown()
            $('.empl-start-calendar, .empl-end-calendar').calendar({
                ...calSettings,
                minDate: moment(finishedAt).subtract(10, 'years').toDate(),
                maxDate: moment(finishedAt).toDate(),
            })

            telEvent(TS.emplPhone)

            addr1Event(TS.emplAddress1, {
                onChange(addr1, $addr1) {
                    const $addr2 = $addr1.parent().next().find(TS.emplAddress2)
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

            addr2Event(TS.emplAddress2)

            cityEvent(TS.emplAddrCity)

            inputEvent(TS.emplPosition, {
                capitalize: 'each',
                strip: true,
                word: true,
            })
            
            inputEvent(TS.emplEarnings, {
                onFocus(amount, $amount) {
                    if (amount) $amount.val(Number(amount.replace(/,/g, '')))
                },
                onInput(amount, $amount) {
                    amount = amount.replace(/\D/g, '')
        
                    $amount.val(amount)
                },
                onBlur(amount, $amount) {
                    amount = (+amount).toLocaleString()
        
                    $amount.val(amount)
                },
            })
            
            inputEvent(TS.emplRfl, {
                capitalize: 'first',
                strip: true,
                word: true,
            })

            $list.fadeIn()
        },
    })
})()