import { inputEvent } from '/modules/events/form.mjs'
import { dateMask } from '/modules/events/imask.mjs'
import { check, onInput, onChange, onSubmit, onYesNoRadioChange } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text
const noMecId = selector.id.checkbox.noMec
const mecNumId = TS.mecNumber
const mecIssId = TS.mecIss
const mecExpId = TS.mecExp
const underMedsId = selector.id.radio.underMeds
const medListId = TS.medList

const $card = $('#apl-card')
const $help = {
    issued: $('#mec-iss-help'),
    expires: $('#mec-exp-help'),
    form: $('#mec-form-help'),
}
const $mecRow = $('#driver-med-card-fields')
const $noMecMsg = $('#no-mec-msg')
const $submit = $('#mec-submit')
const $form = $('#mec-form')

const $issued = $(mecIssId)
const $expires = $(mecExpId)

const appliedOn = $(selector.id.hidden.appliedOn).val()

$(noMecId).on('change', function() {
    const checked = $(this).prop('checked')
    let action = 'show', msgAction = 'hide', disabled = false

    if (checked) {
        action = 'hide'
        msgAction = 'show'
        disabled = true
    }

    $mecRow[action]().find('input').prop('disabled', disabled)
    $noMecMsg[msgAction]()
})

dateMask(mecIssId, {
    pattern: 'us',
    onAccept(mask, $issued) {
        $help.issued.text(null)
        $issued.removeClass('is-valid is-invalid')
    },
    onComplete(mask, $issued) {
        let issued = mask.value

        if (issued) {
            issued = moment(issued, 'MM/DD/YYYY', true)

            if (!issued.isValid()) {
                $issued.addClass('is-invalid')
                $help.issued.text('* Invalid date')
            } else {
                const today = moment(appliedOn)
                let expires = $expires.val() 

                if (issued.isAfter(today)) {
                    $issued.addClass('is-invalid')
                    $help.issued.text('* Future date forbidden')
                } else if (expires) {
                    expires = moment(expires, 'MM/DD/YYYY', true)

                    if (issued.isSameOrAfter(expires)) {
                        $issued.addClass('is-invalid')
                        $help.issued.text('* Issued when expires')
                    } else $issued.addClass('is-valid')
                } else $issued.addClass('is-valid')
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
})

dateMask(mecExpId, {
    pattern: 'us',
    onAccept(mask, $expires) {
        $help.expires.text(null).removeClass('text-danger text-warning')
        $expires.removeClass('is-valid is-invalid')
    },
    onComplete(mask, $expires) {
        let expires = mask.value

        if (expires) {
            expires = moment(expires, 'MM/DD/YYYY', true)

            if (!expires.isValid()) {
                $expires.addClass('is-invalid')
                $help.expires.addClass('text-danger').text('* Invalid date')
            } else {
                const today = moment(appliedOn)
                let issued = $issued.val()

                const diff = {
                    day: today.clone().add(1, 'days').startOf('day'),
                    week: today.clone().add(1, 'weeks').startOf('day'),
                    month: today.clone().add(1, 'months').startOf('day'),
                }
                let invalid, valid

                if (expires.isSameOrBefore(today)) invalid = '* Expired'
                else if (expires.isSame(diff.day)) invalid = '* Expires tomorrow'
                else if (expires.isBefore(diff.week)) invalid = '* Almost expired'
                else if (expires.isSame(diff.week)) invalid = '* Expires in a week'
                else if (expires.isBefore(diff.month)) valid = '<i class="fas fa-triangle-exclamation"></i> Expires soon'
                else if (issued) {
                    issued = moment(issued, 'MM/DD/YYYY', true)

                    if (expires.isSameOrBefore(issued)) invalid = '* Expired when issued'
                }

                if (invalid) {
                    $help.expires.addClass('text-danger').text(invalid)
                    $expires.addClass('is-invalid')
                } else {
                    if (valid) $help.expires.addClass('text-warning').html(valid)
                    $expires.addClass('is-valid')
                }
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
})

inputEvent(mecNumId, {
    onInput(number, $number) {
        number = number.replace(/\D/, '')
        $number.val(number)
    },
})

onYesNoRadioChange(underMedsId, medListId)

inputEvent(medListId, { strip: true, capitalize: 'first', onInput, onChange })


onSubmit($form, $help, $submit, $card)