import { selectEvent } from '/modules/events/form.mjs'
import { idMask, dateMask } from '/modules/events/imask.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { check, onInput, onAccept, onComplete, onChange, addressPredictions } from './support.mjs'

const TS = selector.id.text, SS = selector.id.select
const positionId = SS.position
const ssnId = TS.ssn //, ssnConfId = TS.ssnConf
const dobId = TS.dob
// const ssnSelector = `${ssnId}, ${ssnConfId}`

const $card = $('#new-apl-card')
const $position = $(positionId)
const $positionIntro = $('#position-intro, #position-desc')
const $section = $('#application-form')
const $label = {
    position: $(`label[for=${positionId.replace('#', '')}]`),
}
const $certifyDl = $('#confirm-dl')
const $certifyStatus = $('#confirm-status')
const $certifyPersonal = $('#confirm-personal')
const $help = {
    dob: $('#dob-help'),
    // form: $('#form-help'),
}
const $submit = $('[type="submit"]')
const $form = $('#apl-start-form')


const aplStatus = sessionStorage.getItem('aplStatus')
if (aplStatus === 'started') {
    $('#intro-card').hide()
    $('#privacy-card').show()
} else if (aplStatus === 'confirmed') {
    $('#intro-card').hide()
    $('#form-card').show()
}

const duration = 750
let positionDetermined = false

const params = new URLSearchParams(window.location.search)
if (params.has('form')) {
    const formId = params.get('form')
    const response = $.ajax(`/api/resource/application/${formId}`, {
        async: false,
        error(err) { console.error(err.responseJSON) },
    }).responseJSON

    const { position } = response.data
    if (position) sessionStorage.setItem(positionId.replace('#', ''), position)
}

const position = sessionStorage.getItem(positionId.replace('#', ''))

if (position) {
    $position.val(position).addClass('is-valid')
    $position.find('option[value=""]').remove()
    $positionIntro.hide()
    $section.show()

    positionDetermined = true
} else $label.position.hide()

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

selectEvent(positionId, { fill: true, onChange(position, $position) {
    if (!positionDetermined) {
        positionDetermined = true

        $card.fadeOut(duration)
        setTimeout(() => {
            $position.find('option[value=""]').remove()
            $positionIntro.hide()
            $section.show()
            $label.position.show()
            $card.fadeIn(duration)
        }, duration)
    }

    $position.addClass('is-valid').blur()
    sessionStorage.setItem(positionId.replace('#', ''), position)
} })

// idMask(ssnSelector, 'ssn', {
//     onAccept,
//     onComplete(mask, $el) {
//         const ssn = $(ssnId).val()
//         const ssnConf = $(ssnConfId).val()
//         let message = null, action = 'hide', style = 'is-valid'

//         if (ssn && ssnConf) {
//             if (ssn !== ssnConf) {
//                 message = '<i class="fas fa-exclamation-triangle"></i> Social Security Numbers did not match.<br/>Please try again.'
//                 action = 'show'
//                 style = 'is-invalid'
//                 if (!$submit.prop('disabled')) $submit.prop('disabled', true)
//                 $(ssnSelector).removeClass('is-valid is-invalid').addClass('is-invalid')
//             } else {
//                 $(ssnSelector).removeClass('is-valid is-invalid').addClass('is-valid')
//                 if ($certifyDl.prop('checked') && $certifyStatus.prop('checked')) $submit.prop('disabled', false)
//             }
//         } else $el.addClass('is-valid')

//         $help.form.html(message)[action]()
//     },
// })

idMask(ssnId, 'ssn', {
    onAccept(mask, $ssn) {
        $ssn.removeClass('is-valid is-invalid')
        $submit.prop('disabled', true)
    },
    onComplete(mask, $ssn) {
        $ssn.addClass('is-valid')
        $submit.prop('disabled', !validForm())
    },
})

dateMask(dobId, {
    pattern: 'us',
    onAccept(mask, $dob) {
        $help.dob.text(null)
        $dob.removeClass('is-valid is-invalid')
        $submit.prop('disabled', true)
    },
    onComplete(mask, $dob) {
        const dob = mask.value

        if (dob) {
            const date = moment(dob, 'MM/DD/YYYY', true)
            let invalid

            if (!date.isValid()) {
                $dob.addClass('is-invalid')
                invalid = '* Invalid date'
            } else {
                const today = moment()
                const diff = today.clone().subtract(18, 'years').startOf('day')

                if (date.isAfter(diff)) {
                    $dob.addClass('is-invalid')
                    invalid = "* Too young to apply"
                } else
                    $dob.addClass('is-valid')
            }

            if (invalid) $help.dob.text(invalid)
            else $submit.prop('disabled', !validForm())
        }
    },
})

$(`${ssnId}, ${dobId}`).on('paste drop', function (evt) {
    evt.preventDefault()
})

$certifyDl.on('change', function() {
    $submit.prop('disabled', !validForm())
})

$certifyStatus.on('change', function() {
    $submit.prop('disabled', !validForm())
})

$certifyPersonal.on('change', function() {
    $submit.prop('disabled', !validForm())
})


$form.submit(function(evt) {
    evt.preventDefault()

    const valid = $('input[required]').filter('.is-invalid').length === 0 && !$help.dob.html() // && $(ssnId).val() === $(ssnConfId).val()
    if (!valid) return

    $submit
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm"></span> Submitting...')
    sessionStorage.clear()
    $card.fadeOut(duration)
    setTimeout(() => $form.unbind().submit(), duration)
})


function validForm() {
    const validSsn = $(ssnId).hasClass('is-valid')
    const validDob = $(dobId).hasClass('is-valid')

    return validSsn && validDob && $certifyDl.prop('checked') && $certifyStatus.prop('checked') && $certifyPersonal.prop('checked')
}