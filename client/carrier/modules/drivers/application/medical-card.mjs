import { inputEvent } from '/modules/events/form.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { _mecId, underMeds, medList, finishedAt } = application
    const { expiresOn, issuedOn, nrcme } = application.mec || {}
    const TS = selector.id.text, TC = selector.id.checkbox

    const $form = $('#mec-form')
    const $noMec = $(TC.noMec)
    const $fields = $('#mec-fields')
    const $calendar = {
        expiresOn: $('#mec-expires-calendar'),
        issuedOn: $('#mec-issued-calendar'),
    }
    const $underMeds = $(TC.underMeds)
    const $medList = $(TS.medList)

    $calendar.expiresOn
        .calendar({
            ...calSettings,
            minDate: moment(finishedAt).add(1, 'days').toDate(),
        })
    if (expiresOn)
        $calendar.expiresOn.calendar('set date', new Date(moment(expiresOn).toDate()))

    $calendar.issuedOn
        .calendar({
            ...calSettings,
            maxDate: moment(finishedAt).toDate(),
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

    if (!_mecId) {
        $('.item[data-tab="medical-card"]').append('<i class="ui dark orange first aid icon"></i>')
        $fields.hide().find('input').prop('disabled', true)
        $noMec.prop('checked', true)
    } else
        $fields.find('input').prop('disabled', false)

    if (underMeds) {
        $underMeds.prop('checked', true).val('Y')
        $medList.val(medList).prop('disabled', false).parent().show()
    } else $underMeds.val('N')

    $noMec.on('change', function() {
        if (!$(this).prop('checked')) {
            $(this).parent().parent().parent().hide()
            $fields.show().find('input').prop('disabled', false)
        }
    })

    $underMeds.on('change', function() {
        let value = 'N', disabled = true, action = 'hide'

        if ($(this).prop('checked')) {
            value = 'Y'
            disabled = false
            action = 'show'
        }

        $(this).val(value)
        $medList.prop('disabled', disabled).parent()[action]()
    })

    inputEvent(TS.medList, { strip: true, capitalize: 'first' })

    $form.find('input').on('change', () => {
        $form.find('[type="submit"]').prop('disabled', false)
        $form.find('.unsaved-changes').show()
    })
})()