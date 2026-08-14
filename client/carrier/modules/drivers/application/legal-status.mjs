import { driverLicenseEvent } from '/modules/events/person.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { finishedAt, legalStatus } = application

    const $form = $('#status-form')
    const $calendar = {
        statusExp: $('#status-exp-calendar'),
        statusIss: $('#status-iss-calendar'),
    }
    const $dropdown = {
        status: [
            $('#legal-status-dropdown'),
            legalStatus[0],
            value => {
                let disabled = true, action = 'hide'

                if (value === '2') {
                    disabled = false
                    action = 'show'
                }

                $('.status-temp-fields')[action]().find('input').prop('disabled', disabled)
            },
        ]
    }

    dropdownEvent($dropdown)

    $calendar.statusExp.calendar({
        ...calSettings,
        minDate: moment(finishedAt).add(1, 'months').toDate(),
    })
    $calendar.statusIss.calendar({
        ...calSettings,
        maxDate: moment(finishedAt).toDate(),
    })

    if (legalStatus[1]) {
        $calendar.statusExp
            .calendar('set date', new Date(moment(legalStatus[1]).toDate()))
            .parent().show()
            .find('input').prop('disabled', false)
    }

    if (legalStatus[2]) {
        $calendar.statusIss
            .calendar('set date', new Date(moment(legalStatus[2]).toDate()))
            .parent().show()
            .find('input').prop('disabled', false)
    }

    driverLicenseEvent(selector.id.text.statusDoc, { value: legalStatus[3] || null })

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false)
        $form.find('.unsaved-changes').show()
    })
})()