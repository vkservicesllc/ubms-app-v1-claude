import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { capitalizeEach } from '/modules/tools/utils/string.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

const $form ={
    add: $('#new-form'),
    template: $('#form-template'),
}
{
    const templates = $form.template.find('input')
    templates.each(function(i, template) {
        $(template).attr('id', null)
    })
}


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt } = application
    const TS = selector.class.text
    const $table = $('table')

    const $add = $('#add'), $cancel = $('#cancel')

    $.ajax(`/api/drivers/application/${_id}/citations`, {
        method: 'POST',
        success(response) {
            const { data } = response

            data.forEach((record, i) => {
                const $tr = $('<tr></tr>')
                const { _id, violation, other, citedOn, state } = record
                const $cells = $form.template.clone().find('tr').children()

                const $violation = $($cells[0]).find('input')
                const $other = $($cells[1]).find('input')
                const $date = $($cells[2]).find('input')
                const $state = $($cells[3]).find('input')
                const $save = $($cells[4]).find('.save.button')
                const $delete = $($cells[4]).find('.delete.button')

                $violation.val(violation)
                if (violation === 'other') $other.val(other).prop('disabled', false)
                $date.val(citedOn)
                $state.val(state)
                $save.attr('data-id', _id)
                $delete.attr('data-id', _id)

                $tr.append($cells)
                $form.add.after($tr)

            })

            const $dropdown = {
                violation: $('.cit-violation'),
                state: $('.cit-state'),
            }
            const $calendar = {
                date: $('.cit-date'),
            }

            $dropdown.violation.dropdown({
                onChange(value, text, $choice) {
                    const $other = $choice.parent().parent().parent().parent().next().find('input')
                    const disabled = value !== 'other'

                    $other.prop('disabled', disabled)
                    // if (disabled) $other.val(null)
                },
            })
            $dropdown.state.dropdown()
            $calendar.date.calendar({
                ...calSettings,
                minDate: moment(finishedAt).subtract(3, 'years').toDate(),
                maxDate: moment(finishedAt).toDate(),
            })

            $add.click(function() {
                $form.add.show()
                $(this).hide()
            })
            $cancel.click(function() {
                $form.add.find('input').val(null)
                $form.add.find('.other-field').find('input').prop('disabled', true)
                $form.add.find('.dropdown').dropdown('clear')
                $form.add.hide()
                $add.show()
            })

            inputEvent(TS.citOtherReason, {
                strip: true,
                word: true,
                onInput(citation, $citation) {
                    $citation.val(capitalizeEach(citation))
                    onInput(citation, $citation)
                },
            })

            //! NEED TO ADD BUTTON EVENTS

            $table.fadeIn()
        },
    })
})()