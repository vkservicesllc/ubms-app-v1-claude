import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'


const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio, CS = selector.id.checkbox
const noExpId = CS.noExp
const cmvExpId = RS.cmvExp
const startDateId = TS.expStartDate
const endDateId = TS.expEndDate
const mileageId = TS.expMileage
const expHoursCls = selector.class.text.expHours
const cdlSchoolId = RS.cdlSchool

const $expDetails = $('#experience-details')

const $hours = $(expHoursCls)
const $totalHours = $('#total-weekly-experience-hours')

const calculateHours = () => {
    let total = 0

    $hours.each(function() {
        const hours = +$(this).val() || 0
        total += hours
    })

    $totalHours.val(total)
}


calculateHours()

inputEvent(mileageId, {
    onFocus(miles, $miles) {
        if (miles) $miles.val(Number(miles.replace(/,/g, '')))
    },
    onInput(miles, $mileage) {
        miles = miles.replace(/\D/g, '')

        $mileage.val(miles)
    },
    onBlur(miles, $mileage) {
        miles = (+miles).toLocaleString()

        $mileage.val(miles)
        onBlur(miles, $mileage)
    },
})

inputEvent(expHoursCls, {
    onInput(hours, $hours) {
        hours = +hours
        if (hours < 0) hours = 0

        $hours.val(hours)
        calculateHours()
    },
    onChange,
    onBlur(hours, $hours) {
        if (!hours) hours = '0'
        if (hours > 12) hours = 12

        $hours.val(hours)
        calculateHours()
        onBlur(hours, $hours)
    },
})

inputEvent(noExpId, {
    onChange(value, $el) {
        const checked = $el.prop('checked')

        $expDetails[checked ? 'hide' : 'show']()
    },
})

inputEvent(`${cmvExpId.yes}, ${cmvExpId.no}`, {
    onChange(value) {
        const $cols = $('.vehicle-experience-col-width')
        const $form = $('.cmv-experience')
        const $checkboxes = $form.find('[type="checkbox"]')
        let disabled = false, action = 'show', colClass = 'col-md-4'

        if (value === 'N') {
            disabled = true
            action = 'hide'
            colClass = 'col-md-6'
        }

        $cols.removeClass('col-md-4 col-md-6')
        $cols.addClass(colClass)
        $checkboxes.prop('disabled', disabled)
        $form[action]()
    },
})

inputEvent(`${cdlSchoolId.yes}, ${cdlSchoolId.no}`, {
    onChange(value) {
        const $form = $('#cdl-school-form')
        const $fields = $form.find('input, select')
        let disabled = true, action = 'hide'

        if (value === 'Y') {
            disabled = false
            action = 'show'
        }

        $fields.prop('disabled', disabled)
        $form[action]()
    },
})