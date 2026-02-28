import Person from '/modules/tools/core/person.mjs'
import { inputEvent } from '/modules/events/form.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import patterns from '/modules/registry/patterns.mjs'
import selector from '/modules/registry/selectors/driver-application-employment.mjs'
import application, { dropdownEvent } from './hub.mjs'

const $form = { add: $('#new-employer-form') }
const $template = $form.add.clone()
$template.removeAttr('id').find('[name="_aplId[]"]').remove()

{
    $form.add.find('input:not([name="_aplId[]"]):not([type="checkbox"]), textarea').val(null)
    $form.add.find('[type="checkbox"]').prop('checked', false)
}


(() => {
    if (!application || !Object.keys(application).length) return
    $form.add.find('[name="_aplId[]"]').val(application._id)

    const { _id, finishedAt } = application
    const $list = $('#employer-list')
    const TS = selector.class.text, CS = selector.class.checkbox

    const $button = {
        add: $('#add'),
    }
    const $modal = {
        add: $('#add-modal'),
        delete: $('#delete-modal'),
    }

    $modal.add.modal({
        autofocus: false,
        closable: false,
        onHidden() {
            $form.add.find('input:not([name="_aplId[]"]):not([type="checkbox"]), textarea').val(null)
            $form.add.find('[type="checkbox"]').prop('checked', false)
            $form.add.find('.empl-addr-state-dropdown').dropdown('clear')
        },
    })

    $modal.delete.modal({
        autofocus: false,
        closable: false,
        onHidden() {
            $('#delete-id').val(null)
            $('#delete-content').html(null)
        },
    })

    $button.add.click(function() {
        $modal.add.modal('show')
    })

    $.ajax(`/api/resource/drivers/applications/${_id}/employments`, {
        success(response) {
            const { data } = response

            // data = sortArrayByObjectKey(data, 'startedOn', false)
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
                $footer.append(`<button class="ui red circular delete button" data-id="${_id}">Delete</button>`)
                $footer.append(`<button type="submit" form="${formId}" class="ui right floated dark green circular button" disabled>Save</button>`)
                $footer.append('<span class="right floated unsaved-changes" style="display: none; margin-right: 10px;"><i class="red exclamation triangle icon"></i></span>')

                $form.find(selector.class.hidden.id).removeAttr('id').val(_id)
                $form.find(TS.employer).removeAttr('id').val(employer)
                $form.find(TS.startDate).removeAttr('id').val(moment(startedOn).format('ll'))
                $form.find(TS.endDate).removeAttr('id').val(leftOn ? moment(leftOn).format('ll') : null)
                $form.find(TS.phone).removeAttr('id').val(formatTel(phone))
                $form.find(TS.address1).removeAttr('id').val(address1)
                $form.find(TS.address2).removeAttr('id').val(address2)
                $form.find(TS.addrZip).removeAttr('id').val(zip)
                $form.find(TS.addrCity).removeAttr('id').val(city)
                $form.find('[name="state"]').removeAttr('id').val(state)
                $form.find(TS.position).removeAttr('id').val(position)
                $form.find(TS.earnings).removeAttr('id').val(earnings.toLocaleString('en-US'))
                $form.find(TS.rfl).removeAttr('id').val(rfl)
                $form.find(CS.fmcsr).removeAttr('id').prop('checked', !!fmcsr)
                $form.find(CS.dotDat).removeAttr('id').prop('checked', !!dotDat)

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

            zipEvent(TS.emplAddrZip, {
                onChange(zip, $zip, city, state) {
                    if (city && state) {
                        const $city = $zip.parent().parent().find(TS.emplAddrCity)
                        const $stateDropdown = $zip.parent().parent().find('.empl-addr-state-dropdown')

                        $city.val(city)
                        $stateDropdown.dropdown('set selected', state)
                    }
                },
            })

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
                    amount = (+amount).toLocaleString('en-US')
                    $amount.val(amount)
                },
            })
            
            inputEvent(TS.emplRfl, { capitalize: 'first', strip: true, word: true })

            $('input, textarea').on('change', function() {
                const $form = $(this).closest('form')
                if ($form.attr('id') === 'new-employer-form') return

                $form.parent().next().find('[type="submit"]').prop('disabled', false)
                $form.parent().next().find('.unsaved-changes').show()
            })

            $('.delete.button').on('click', function() {
                const _id = $(this).data('id')

                $.ajax(`/api/drivers/applications/prev-employer/${_id}`, {
                    method: 'POST',
                    success(response) {
                        const { data } = response
                        const { applicant, formId, employer, startedOn, leftOn } = data

                        let html = '<p>Are you sure you would like to delete the following employer?</p>'
                        html += `<b>${new Person(applicant).fullName()}</b> <small>(${formId})</small><br/>`
                        html += `<b>${employer}</b> <small>(${moment(startedOn).format('ll')} –`
                        html += `${leftOn ? moment(leftOn).format('ll') : 'Present'})</small>`

                        $('#delete-id').val(_id)
                        $('#delete-content').html(html)
                        $modal.delete.modal('show')
                    },
                })
            })

            $list.fadeIn()
        },
    })
})()