import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { experience, finishedAt } = application
    const CS = selector.id.checkbox
    const $details = $('.experience-details')

    const $calendar = {
        startDate: $('#exp-start-date-calendar'),
        endDate: $('#exp-end-date-calendar'),
    }

    $(CS.noExp).on('change', function() {
        let action = 'show', disabled = false
        if ($(this).prop('checked')) {
            action = 'hide'
            disabled = true
        }

        $details[action]().find('input').prop('disabled', disabled)
    })

    if (!experience) {
        $details.hide().find('input').prop('disabled', true)
        $(CS.noExp).prop('checked', true)
    }

    $calendar.startDate.calendar({
            ...calSettings,
            maxDate: moment(finishedAt).toDate(),
        })
    if (experience?.firstDate)
        $calendar.startDate
            .calendar('set date', new Date(moment(experience.firstDate).toDate()))

    $calendar.endDate.calendar({
            ...calSettings,
            maxDate: moment(finishedAt).toDate(),
        })
    if (experience?.firstDate)
        $calendar.endDate
            .calendar('set date', new Date(moment(experience.lastDate).toDate()))

    if (experience?.vehicles)
        for (const group in experience.vehicles) {
            const vhlExp = experience.vehicles[group]

            for (const value of vhlExp) {
                $(`[name="vehicles[${group}][]"][value="${value}"]`).prop('checked', true)
                $(`[name="vehicles[${group}][${value}]"]`).prop('checked', true)
            }
        }

})()