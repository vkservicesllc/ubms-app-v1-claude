import { inputEvent } from '/modules/events/form.mjs'
import { check, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, CS = selector.id.checkbox
const noExpId = CS.noExp
const startDateId = TS.expStartDate
const endDateId = TS.expEndDate

const dateOpts = { mask: '99/99/9999', placeholder: 'MM/DD/YYYY' }
const appliedOn = $(selector.id.hidden.appliedOn).val()

const $card = $('#apl-card')
const $expDetails = $('#experience-details')
const $startDate = $(startDateId)
const $endDate = $(endDateId)
const $help = {
    expStart: $('#exp-start-help'),
    expEnd: $('#exp-end-help'),
    form: $('#exp-form-help'),
}
const $form = $('#experience-form')
const $submit = $('#experience-submit')


inputEvent(startDateId, {
    ...dateOpts,
    onInput(startDate, $startDate) {
        $help.expStart.text(null)
        $startDate.removeClass('is-valid is-invalid')
    },
    onChange(startDate, $startDate) {
        if (startDate) {
            startDate = moment(startDate, 'MM/DD/YYYY', true)

            if (!startDate.isValid()) {
                $startDate.addClass('is-invalid')
                $help.expStart.text('* Invalid date')
            } else {
                const today = moment(appliedOn)
                let endDate = $endDate.val()

                if (startDate.isAfter(today)) {
                    $startDate.addClass('is-invalid')
                    $help.expStart.text('* Future date forbidden')
                } else if (endDate) {
                    endDate = moment(endDate, 'MM/DD/YYYY', true)

                    if (startDate.isAfter(endDate)) {
                        $startDate.addClass('is-invalid')
                        $help.expStart.text('* Started before finished')
                    } else $startDate.addClass('is-valid')
                } else $startDate.addClass('is-valid')
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
})


inputEvent(endDateId, {
    ...dateOpts,
    onInput(endDate, $endDate) {
        $help.expEnd.text(null)
        $endDate.removeClass('is-valid is-invalid')
    },
    onChange(endDate, $endDate) {
        if (endDate) {
            endDate = moment(endDate, 'MM/DD/YYYY', true)

            if (!endDate.isValid()) {
                $endDate.addClass('is-invalid')
                $help.expEnd.text('* Invalid date')
            } else {
                const today = moment(appliedOn)
                let startDate = $startDate.val()

                if (endDate.isAfter(today)) {
                    $endDate.addClass('is-invalid')
                    $help.expEnd.text('* Future date forbidden')
                } else if (startDate) {
                    startDate = moment(startDate, 'MM/DD/YYYY', true)

                    if (endDate.isBefore(startDate)) {
                        $endDate.addClass('is-invalid')
                        $help.expEnd.text('* Finished before started')
                    } else $endDate.addClass('is-valid')
                } else $endDate.addClass('is-valid')
            }
        }
        
        if (check($form)) $help.form.hide().html(null)
    },
})


onSubmit($form, $help, $submit, $card, () => {
    if ($(noExpId).prop('checked'))
        $expDetails.find('input, select').prop('disabled', true)
})