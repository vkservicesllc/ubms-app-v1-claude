import { inputEvent } from '/modules/events/form.mjs'
import { busNameEvent } from '/modules/events/company.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { experience, cdlSchool } = application
    const TS = selector.id.text, RS = selector.id.radio, CS = selector.id.checkbox
    const $cmvExp = $('#cmv-experience'), $cmvExpVhl = $('.cmv-experience')
    const $cdlSchool = $('.cdl-school')

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
        maxDate: moment().toDate(),
    })
    if (cdlSchool?.endDate)
        $calendar.schEndDate.calendar('set date', new Date(moment(cdlSchool.endDate).toDate()))

})()