import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import { driverLicenseEvent, dlClassEvent } from '/modules/events/person.mjs'
import { check, onInput, onChange, onBlur, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio
const dlStateId = SS.dlState
const dlNumId = TS.dlNumber
const dlClassId = TS.dlClass
const dlIssId = TS.dlIss
const dlExpId = TS.dlExp
const dlEndrsId = TS.dlEndrs
const dlRestrId = TS.dlRestr
const dlDeniedId = RS.dlDenied
const dlRevokedId = RS.dlRevoked
const dlDeniedExplId = TS.dlDeniedExpl
const dlRevokedExplId = TS.dlRevokedExpl

const $card = $('#apl-card')
const $help = {
    issued: $('#dl-iss-help'),
    expires: $('#dl-exp-help'),
    form: $('#dl-form-help'),
}
const $submit = $('#dl-submit')
const $form = $('#dl-form')

const $issued = $(dlIssId)
const $expires = $(dlExpId)

const $expl = {
    denied: $(dlDeniedExplId),
    revoked: $(dlRevokedExplId),
}
for (const key in $expl)
    if ($expl[key].val()) $expl[key].parent().show()

const dateOpts = { mask: '99/99/9999', placeholder: 'MM/DD/YYYY' }


selectEvent(dlStateId, { fill: true, onChange })

driverLicenseEvent(dlNumId, { onInput, onChange })

dlClassEvent(dlClassId)

//! repetative
inputEvent(dlIssId, {
    ...dateOpts,
    onInput(issued, $issued) {
        $help.issued.text(null)
        $issued.removeClass('is-valid is-invalid')
    },
    onChange(issued, $issued) {
        if (issued) {
            issued = moment(issued, 'MM/DD/YYYY', true)

            if (!issued.isValid()) {
                $issued.addClass('is-invalid')
                $help.issued.text('* Invalid date')
            } else {
                const today = moment()
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
    onBlur,
})

//! repetative
inputEvent(dlExpId, {
    ...dateOpts,
    onInput(expires, $expires) {
        $help.expires.text(null).removeClass('text-danger text-warning')
        $expires.removeClass('is-valid is-invalid')
    },
    onChange(expires, $expires) {
        if (expires) {
            expires = moment(expires, 'MM/DD/YYYY', true)

            if (!expires.isValid()) {
                $expires.addClass('is-invalid')
                $help.expires.addClass('text-danger').text('* Invalid date')
            } else {
                const today = moment()
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
    onBlur,
})

inputEvent(dlEndrsId, { strip: true })

inputEvent(dlRestrId, { strip: true })


//! repetative
const onRadioChange = (id, explId) => {
console.log(id)
    const $radio = $(`${id.yes}, ${id.no}`)
    const $expl = $(explId)

    $radio.on('change', function() {
        const value = $(this).val()
        const action = value === 'Y' ? 'show' : 'hide'
        const disabled = action === 'hide'

        $expl.prop('disabled', disabled).parent()[action]()
    })
}

onRadioChange(dlDeniedId, dlDeniedExplId)

onRadioChange(dlRevokedId, dlRevokedExplId)

inputEvent(dlDeniedExplId, { strip: true })

inputEvent(dlRevokedExplId, { strip: true })


onSubmit($form, $help, $submit, $card)