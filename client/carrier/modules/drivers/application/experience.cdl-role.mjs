import { inputEvent } from '/modules/events/form.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { experience } = application
    const RS = selector.id.radio
    const $cmvExp = $('#cmv-experience'), $cmvExpVhl = $('.cmv-experience')

    if ($cmvExp.length && typeof experience.cmv === 'boolean') {
        $(RS.cmvExp[experience.cmv ? 'yes' : 'no']).prop('checked', true)
        if (experience.cmv === false) $cmvExpVhl.hide().find('input').prop('disabled', true)
    }

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
})()