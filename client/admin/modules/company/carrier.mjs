import length from '../registry/length.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import { inputEvent } from '../events/form.mjs'

const { mcId, usdotId, scacId, iftaId, irpId, efsId, fleetOneId, transfloId } = formSelectors.carrier
const numberIds = [ mcId, usdotId, scacId, iftaId, irpId, efsId, fleetOneId, transfloId ]

Object.keys(length.carrier.permit.max).forEach(key => numberIds.push(formSelectors.carrier.permit(key)))

const $modal = $('#carrier-state-permits-modal')
const $submit = $('#credentials-submit')
const $form = $('#credentials-form')
const $formTip = $('#carrier-form-tip')

const tip = {
    success: '<i class="fa fa-check"></i> ID is unique',
    failed: '<i class="fa fa-close"></i> ID is taken',
    failedForm: '<i class="fas fa-close"></i>&nbsp; Credentials can not have dublicates<br /><i class="fas fa-close"></i>&nbsp; Data can not be submitted',
}

for (const id of numberIds) {
    const number = $(`#${id}`).val()

    if (number) {
        const $tip = $(`#${id.replace('carrier-', '')}-tip`)

        $tip
            .addClass('is-success')
            .html(tip.success)
            .show()
    }
}

inputEvent(numberIds, {
    onInput(number, $number) {
        const id = $number.attr('id')
        const $tip = $(`#${id.replace('carrier-', '')}-tip`)

        let pattern = /\D/g
        if (id == scacId) pattern = /[^A-Za-z]/g
        if (id == transfloId) pattern = /[^A-Za-z0-9]/g

        $number.val(number.replace(pattern, '').toUpperCase())
        $tip.hide().removeClass('is-danger is-success').html(null)
    },
    onChange(number, $number) {
        const id = $number.attr('id')
        const currentNumber = $(`#current-${id}`).val()
        const $tip = $(`#${id.replace('carrier-', '')}-tip`)

        if (number) {
            if (number == currentNumber)
                $tip
                    .addClass('is-success')
                    .html(tip.success)
                    .show()
            else {
                let name = $number.attr('name')
                const data = { [name]: number }
    
                $.ajax(`/api/unique/carrier`, {
                    method: 'POST',
                    data,
                    success(response) {
                        const { unique, error } = response
    
                        $tip.hide().html(null).removeClass('is-success is-danger')
                        if (error) {
                            $number.val(null)
                            return alert(error)
                        }
    
                        if (unique) {
                            $tip
                                .addClass('is-success')
                                .html(tip.success)
                                .show()
                            if (formValid()) $formTip.html(null)
                        } else
                            $tip
                                .addClass('is-danger')
                                .html(tip.failed)
                                .show()
                    },
                })
            }
        }
    },
})


$('#carrier-state-permits-open').click(() => {
    $modal.addClass('is-active')
})

$('#carrier-state-permits-close').click(() => {
    $modal.removeClass('is-active')
})

$form.submit(function(event) {
    event.preventDefault()

    if (!formValid())
        $formTip
            .html(tip.failedForm)
    else
        $(this).unbind().submit()
})

$submit.prop('disabled', false)


function formValid() {
    let valid = true

    $('.carrier-tip').each(function() {
        if (!valid) return

        if ($(this).hasClass('is-danger'))
            valid = false
    })

    return valid
}