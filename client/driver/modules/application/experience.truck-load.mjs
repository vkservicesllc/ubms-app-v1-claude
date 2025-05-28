import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import { check, onInput, onChange, onBlur } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio, CS = selector.id.checkbox
const noExpId = CS.noExp
const cmvExpId = RS.cmvExp
const mileageId = TS.expMileage
const expHoursCls = selector.class.text.expHours
const cdlSchoolId = RS.cdlSchool
const cdlSchoolCls = selector.class.combo.cdlSchool
const schNameId = TS.schName
const schPhoneId = TS.schPhone
const schStateId = SS.schState
const schEndDateId = TS.schEndDate
const schDurationId = SS.schDuration

const $expDetails = $('#experience-details')
const $hours = $(expHoursCls)
const $totalHours = $('#total-weekly-experience-hours')
const appliedOn = $(selector.id.hidden.appliedOn).val()

const $form = $('#experience-form')
const $help = {
    schEnd: $('#sch-end-help'),
    form: $('#exp-form-help'),
}

const calculateHours = () => {
    let total = 0

    $hours.each(function() {
        const hours = +$(this).val() || 0
        total += hours
    })

    $totalHours.val(total)
}


calculateHours()

if ($(cdlSchoolId.yes).prop('checked')) $(cdlSchoolCls).prop('disabled', false)


inputEvent(noExpId, {
    onChange(value, $el) {
        const checked = $el.prop('checked')

        if (!checked) {
            const selectors = ['input', 'select']
            const $noCmvExp = $(cmvExpId.no)
            const $noCdlSchool = $(cdlSchoolId.no)

            if ($noCmvExp.prop('checked')) {
                selectors[0] += `:not(${selector.class.checkbox.semiExp})`
                selectors[0] += `:not(${selector.id.checkbox.tandemExp})`
            }

            if ($noCdlSchool.prop('checked')) {
                selectors[0] += `:not(${cdlSchoolCls})`
                selectors[1] += `:not(${cdlSchoolCls})`
            }

            $expDetails.find(selectors.join(', ')).prop('disabled', false)
        }
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

        $cols.removeClass('col-md-4 col-md-6').addClass(colClass)
        $checkboxes.prop('disabled', disabled)
        $form[action]()
    },
})

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


inputEvent(schNameId, {
    capitalize: 'each',
    strip: true,
    onInput,
    onChange,
})

telEvent(schPhoneId, { onInput, onChange, onBlur })

inputEvent(schEndDateId, {
    mask: '99/99/9999',
    placeholder: 'MM/DD/YYYY',
    onInput(endDate, $endDate) {
        $help.schEnd.text(null)
        $endDate.removeClass('is-valid is-invalid')
    },
    onChange(endDate, $endDate) {
        if (endDate) {
            endDate = moment(endDate, 'MM/DD/YYYY', true)

            if (!endDate.isValid()) {
                $endDate.addClass('is-invalid')
                $help.schEnd.text('* Invalid date')
            } else {
                const today = moment(appliedOn)

                if (endDate.isAfter(today)) {
                    $endDate.addClass('is-invalid')
                    $help.schEnd.text('* Future date forbidden')
                } $endDate.addClass('is-valid')
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
    onBlur,
})

selectEvent(schStateId, { fill: true, onChange })

selectEvent(schDurationId, { fill: true, onChange })