import { inputEvent } from '/modules/events/form.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { experience, cdlSchool, finishedAt } = application
    const TS = selector.id.text, RS = selector.id.radio, CS = selector.id.checkbox
    const expHoursCls = selector.class.text.expHours
    const $cmvExp = $('#cmv-experience'), $cmvExpVhl = $('.cmv-experience')
    const $cdlSchool = $('.cdl-school')
    const $totalHr = $('#total-weekly-experience-hours')

    const calculateHours = () => {
        let total = 0

        $(expHoursCls).each(function() {
            const hours = +$(this).val() || 0
            total += hours
        })

        $totalHr.val(total)
    }

    const $dropdown = {
        schState: [ $('#school-state-dropdown'), cdlSchool?.state ],
        schDuration: [ $('#school-duration-dropdown'), cdlSchool?.duration ],
    }

    const $calendar = {
        schEndDate: $('#school-end-date-calendar'),
    }

    if ($cmvExp.length && typeof experience.cmv === 'boolean') {
        $(RS.cmvExp[experience.cmv ? 'yes' : 'no']).prop('checked', true)
        if (experience.cmv === false) $cmvExpVhl.hide().find('input').prop('disabled', true)
    }

    if (!cdlSchool) $cdlSchool.hide().find('input').prop('disabled', true)
    else {
        $cdlSchool.find('input').prop('disabled', false)
        $(CS.cdlSchool).prop('checked', true)
    }

    dropdownEvent($dropdown)

    inputEvent(`${RS.cmvExp.yes}, ${RS.cmvExp.no}`, {
        onChange(value) {
            let action = 'show', disabled = false
            if (value === 'N') {
                action = 'hide'
                disabled = true
            }
            $cmvExpVhl[action]().find('input').prop('disabled', disabled)
        },
    })

    inputEvent(TS.expMileage, {
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
        },
        value: experience?.mileage ?(+experience.mileage).toLocaleString() : null,
    })

    let totalHr = 0
    if (experience?.hours)
        experience.hours.forEach((hr, i) => {
            $(`[name="hours[${i}]"]`).val(hr)
            totalHr += hr
        })
    $totalHr.val(totalHr)

    inputEvent(expHoursCls, {
        onInput(hours, $hours) {
            hours = +hours
            if (hours < 0) hours = 0
    
            $hours.val(hours)
            calculateHours()
        },
        onBlur(hours, $hours) {
            if (!hours) hours = '0'
            if (hours > 12) hours = 12
    
            $hours.val(hours)
            calculateHours()
        },
    })

    $(CS.cdlSchool).on('change', function() {
        let action = 'show', disabled = false
        if (!$(this).prop('checked')) {
            action = 'hide'
            disabled = true
        }
        $cdlSchool[action]().find('input').prop('disabled', disabled)
    })

    busNameEvent(TS.schName, true, {
        onChange(schName, type, $schName) {
            if (type) $schName.val(`${schName}, ${type}`)
        },
        value: cdlSchool?.name,
    })

    telEvent(TS.schPhone, { value: cdlSchool?.phone })

    $calendar.schEndDate.calendar({
        ...calSettings,
        maxDate: moment(finishedAt).toDate(),
    })
    if (cdlSchool?.endDate)
        $calendar.schEndDate
            .calendar('set date', new Date(moment(cdlSchool.endDate).toDate()))

})()