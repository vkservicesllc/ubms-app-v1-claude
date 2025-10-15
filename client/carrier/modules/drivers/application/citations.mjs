import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import Address from '/modules/tools/core/address.us.mjs'
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
    const $modal = {
        delete: $('#delete-modal'),
    }

    const $add = $('#add'), $cancel = $('#cancel')

    $.ajax(`/api/drivers/application/${_id}/citations`, {
        method: 'POST',
        success(response) {
            let { data } = response
            data = sortArrayByObjectKey(data, 'citedOn')

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

            $table.fadeIn()

            //! NEED TO ADD BUTTON EVENTS
            if (data.length) {
                const violations = $.ajax('/api/drivers/applications/source/violations', { method: 'POST', async: false }).responseJSON

                $('.delete').on('click', function() {
                    const _id = $(this).data('id')

                    const citation = $.ajax(`/api/drivers/applications/citation/${_id}`, { method: 'POST', async: false }).responseJSON
                    if (!citation) return alert('Oops! Something went wrong!')

                    const { other, state } = citation
                    let { violation, citedOn } = citation

                    if (violation === 'other') violation = other
                    else
                        loop: for (const group in violations) {
                            for (const value in violations[group]) {
                                if (violation !== value) continue
                                violation = `${violations[group][value]} <small>(${group})</small>`
                                break loop
                            }
                        }

                    $('#delete-info').html(`${violation}<br/>on ${moment(citedOn).format('ll')} in ${Address.stateList[state]}`)
                    $('#delete-id').val(_id)
                    $modal.delete.modal('show')
                })
                $modal.delete.modal({
                    onHidden() {
                        $('#delete-id').val(null)
                        $('#delete-info').html(null)
                    },
                })

                $('.save').on('click', function() {
                    const _id = $(this).data('id')
                    if (!_id) return

                    const $fields = $(this).parent().parent().find('input')
                    const data = {
                        violation: $($fields[0]).val(),
                        other: $($fields[1]).val(),
                        citedOn: moment($($fields[2]).val()).format('YYYY-MM-DD'),
                        state: $($fields[3]).val(),
                    }
                    if (data.violation !== 'other') data.other = null
console.log(_id, data)

                    //! to be continued
                })
            }
        },
    })
})()