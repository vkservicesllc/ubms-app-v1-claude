import { inputEvent } from '/modules/events/form.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { medCard } = application
    const { expiresOn, issuedOn, nrcme } = application.mec || {}
    const TS = selector.id.text

    const $noMec = $('#no-mec')
    const $fields = $('#mec-fields')
    const $calendar = {
        expiresOn: $('#mec-expires-calendar'),
        issuedOn: $('#mec-issued-calendar'),
    }

    $calendar.expiresOn
        .calendar({
            ...calSettings,
            minDate: moment().add(1, 'days').toDate(),
        })
    if (expiresOn)
        $calendar.expiresOn.calendar('set date', new Date(moment(expiresOn).toDate()))

    $calendar.issuedOn
        .calendar({
            ...calSettings,
            maxDate: moment().toDate(),
        })
    if (issuedOn)
        $calendar.issuedOn.calendar('set date', new Date(moment(issuedOn).toDate()))

    inputEvent(TS.mecNumber, {
        value: nrcme,
        onInput(number, $number) {
            number = number.replace(/\D/, '')
            $number.val(number)
        },
    })

    if (!medCard) {
        $('.item[data-tab="medical-card"]').append('<i class="ui dark orange first aid icon"></i>')
        $fields.hide().find('input').prop('disabled', true)
        $noMec.prop('checked', true)
    } else {
        $fields.find('input').prop('disabled', false)
        $noMec.parent().parent().parent().hide()
    }

    $noMec.on('change', function() {
        if (!$(this).prop('checked')) {
            $(this).parent().parent().parent().hide()
            $fields.show().find('input').prop('disabled', false)
        }
    })
})()