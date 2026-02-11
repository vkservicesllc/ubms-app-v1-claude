import { idMask } from '/modules/events/imask.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { check, onInput, onAccept, onComplete, onChange, addressPredictions } from './support.mjs'

const TS = selector.id.text
const ssnId = TS.ssn, ssnConfId = TS.ssnConf
const ssnSelector = `${ssnId}, ${ssnConfId}`


const $card = $('#new-apl-card')
const $submit = $('[type="submit"]')
const $form = $('#apl-start-form')
const $help = $('#form-help')
const $certifyDl = $('#confirm-dl')
const $certifyStatus = $('#confirm-status')


const aplStatus = sessionStorage.getItem('aplStatus')
if (aplStatus === 'started') {
    $('#intro-card').hide()
    $('#privacy-card').show()
} else if (aplStatus === 'confirmed') {
    $('#intro-card').hide()
    $('#form-card').show()
}

const duration = 750
$card.fadeIn(duration)

$('#apply').click(() => {
    $('#intro-card, #new-apl-card').fadeOut(duration)

    setTimeout(() => {
        $('#privacy-card, #new-apl-card').fadeIn(duration)
        sessionStorage.setItem('aplStatus', 'started')
    }, duration)
})

$('#confirm').click(() => {
    $('#privacy-card, #new-apl-card').fadeOut(duration)

    setTimeout(() => {
        $('#form-card, #new-apl-card').fadeIn(duration)
        sessionStorage.setItem('aplStatus', 'confirmed')
    }, duration)
})

idMask(ssnSelector, 'ssn', {
    onAccept,
    onComplete(mask, $el) {
        const ssn = $(ssnId).val()
        const ssnConf = $(ssnConfId).val()
        let message = null, action = 'hide', style = 'is-valid'

        if (ssn && ssnConf) {
            if (ssn !== ssnConf) {
                message = '<i class="fas fa-exclamation-triangle"></i> Social Security Numbers did not match.<br/>Please try again.'
                action = 'show'
                style = 'is-invalid'
                if (!$submit.prop('disabled')) $submit.prop('disabled', true)
                $(ssnSelector).removeClass('is-valid is-invalid').addClass('is-invalid')
            } else {
                $(ssnSelector).removeClass('is-valid is-invalid').addClass('is-valid')
                if ($certifyDl.prop('checked') && $certifyStatus.prop('checked')) $submit.prop('disabled', false)
            }
        } else $el.addClass('is-valid')

        $help.html(message)[action]()
    },
})

$(ssnSelector).on('paste drop', function (evt) {
    evt.preventDefault()
})

$certifyDl.on('change', function() {
    $submit.prop('disabled', !($(this).prop('checked') && $certifyStatus.prop('checked')))
})

$certifyStatus.on('change', function() {
    $submit.prop('disabled', !($(this).prop('checked') && $certifyDl.prop('checked')))
})


$form.submit(function(evt) {
    evt.preventDefault()

    const valid = $('input[required]').filter('.is-invalid').length === 0
    if (!valid) return

    $submit
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm"></span> Submitting...')
    sessionStorage.clear()
    $card.fadeOut(duration)
    setTimeout(() => $form.unbind().submit(), duration)
})