import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt } = application

    const $add = $('#add'), $cancel = $('#cancel')
    const $newForm = $('#new-form')
    const $dropdown = {
        violation: $('.cit-violation'),
        state: $('.cit-state'),
    }
    const $calendar = {
        date: $('.cit-date'),
    }

    $.ajax(`/api/drivers/application/${_id}/citations`, {
        method: 'POST',
        success(response) {
            const { data } = response
console.table(data)

            data.forEach(record => {
                //? use template and populate with data
            })

            $dropdown.violation.dropdown({
                onChange(value, text, $choice) {
                    const $other = $choice.parent().parent().parent().parent().next().find('input')
                    const disabled = value !== 'other'

                    $other.prop('disabled', disabled)
                    if (disabled) $other.val(null)
                },
            })
            $dropdown.state.dropdown()
            $calendar.date.calendar({
                ...calSettings,
                minDate: moment(finishedAt).subtract(3, 'years').toDate(),
                maxDate: moment(finishedAt).toDate(),
            })

            $add.click(function() {
                $newForm.show()
                $(this).hide()
            })
            $cancel.click(function() {
                $newForm.find('input').val(null)
                $newForm.find('.other-field').prop('disabled', true)
                $newForm.find('.dropdown').dropdown('clear')
                $newForm.hide()
                $add.show()
            })
        },
    })
})()