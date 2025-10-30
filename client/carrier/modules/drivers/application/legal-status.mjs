import calSettings from '/modules/settings/calendar.mjs'
import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { finishedAt, legalStatus } = application

    const $form = $('#status-form')
    const $calendar = {
        statusExp: $('#status-exp-calendar'),
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

                $calendar.statusExp.parent()[action]().find('input').prop('disabled', disabled)
            },
        ]
    }

    dropdownEvent($dropdown)

    $calendar.statusExp.calendar({
        ...calSettings,
        minDate: moment(finishedAt).add(1, 'months').toDate(),
    })

    if (legalStatus[1]) {
        $calendar.statusExp
            .calendar('set date', new Date(moment(legalStatus[1]).toDate()))
            .parent().show()
            .find('input').prop('disabled', false)
    }

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false)
        $form.find('.unsaved-changes').show()
    })
})()