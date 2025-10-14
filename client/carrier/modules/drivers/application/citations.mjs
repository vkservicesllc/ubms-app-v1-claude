import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt } = application

    const $add = $('#add'), $cancel = $('#cancel')
    const $form ={
        add: $('#new-form'),
        template: $('#form-template'),
    }

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
                const { _id, violation, other, citedOn, state } = record
                const template = $form.template.find('tr').children()

                //? template[2].text(citedOn)
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
                $form.add.show()
                $(this).hide()
            })
            $cancel.click(function() {
                $form.add.find('input').val(null)
                $form.add.find('.other-field').prop('disabled', true)
                $form.add.find('.dropdown').dropdown('clear')
                $form.add.hide()
                $add.show()
            })
        },
    })
})()