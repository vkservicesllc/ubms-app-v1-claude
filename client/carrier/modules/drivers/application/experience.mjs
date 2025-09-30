import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return
console.log(application.experience)

    const { experience } = application
    const TS = selector.id.text, CS = selector.id.checkbox
    const $details = $('.experience-details')

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
    } else {
        //
    }
})()