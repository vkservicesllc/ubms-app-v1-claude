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
        const $t = $(template)
        const id = $t.attr('id')
        $t.attr('id', `${id}-x`)
    })
}


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt } = application

    const $add = $('#add'), $cancel = $('#cancel')

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

            data.forEach((record, i) => {
                const $tr = $('<tr></tr>')
                const { _id, violation, other, citedOn, state } = record
                const template = $form.template.find('tr').children()

                // const $violation = $(template[0]).find('input')

                // const id = {
                //     violation: $violation.attr('id'),
                // }
console.log('$violation', $violation)
                // $violation.attr('id', id.violation.replace('-x', `-${i}`))

                // $tr.append($violation)
                // $form.add.after($tr)
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
                $form.add.find('.other-field').find('input').prop('disabled', true)
                $form.add.find('.dropdown').dropdown('clear')
                $form.add.hide()
                $add.show()
            })
        },
    })
})()