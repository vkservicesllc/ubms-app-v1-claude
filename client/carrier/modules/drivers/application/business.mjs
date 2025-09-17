import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'

(() => {
    if (!application || !Object.keys(application).length) return

    const { activeBusiness } = application
    const TC = selector.id.checkbox

    const $inactiveLLC = $(TC.inactiveLLC)

    // $inactiveLLC.prop('checked', !activeBusiness)
    if (!activeBusiness) {
        $('.item[data-tab="business"]').append('<i class="ui dark orange exclamation triangle icon"></i>')
        // ... more to add
        $inactiveLLC.prop('checked', true)
    } else {
        // ... more to add
        $inactiveLLC.parent().parent().parent().hide()
    }
})()