import getIdFromUrl from '../tools/id.mjs'
import { inputEvent } from '../events/form.mjs'
import selector from '../registry/selectors/carrier.mjs'

const $modal = $('#carrier-state-permits-modal')
const $submit = $('#credentials-submit')
const $form = $('#credentials-form')
const $formTip = $('#carrier-form-tip')

const _companyId = getIdFromUrl()
const _id = $(selector.id.hidden.id).val()
const tip = {
    success: '<i class="fa fa-check"></i> ID is unique',
    failed: '<i class="fa fa-close"></i> ID is taken',
    failedForm: '<i class="fas fa-close"></i>&nbsp; Credentials can not have dublicates<br /><i class="fas fa-close"></i>&nbsp; Data can not be submitted',
}

const TCS = selector.class.text
const TS = selector.id.text

for (const prop in TS) {
    const $number = $(TS[prop])
    const number = $number.val()

    if (number) {
        const $tip = $number.parent().next()

        $tip
            .addClass('is-success')
            .html(tip.success)
            .show()
    }
}

let credClass = []
for (const prop of ['alpha', 'alphaNumber', 'number', 'permit'])
    credClass.push(TCS[prop])
credClass = credClass.join(', ')

inputEvent(credClass, {
    onInput(number, $number) {
        const id = $number.attr('id')
        const $tip = $(`#${id.replace('carrier-', '')}-tip`)
        let pattern = /\D/g

        if ($number.hasClass(TCS.alpha.replace('.', ''))) pattern = /[^A-Za-z]/g
        if ($number.hasClass(TCS.alphaNumber.replace('.', ''))) pattern = /[^A-Za-z0-9]/g

        $number.val(number.replace(pattern, '').toUpperCase())
        $tip.hide().removeClass('is-danger is-success').html(null)
    },
    onChange(number, $number) {
        const $tip = $number.parent().next()

        $tip.hide().html(null).removeClass('is-success is-danger')

        if (number) {
            const name = $number.attr('name')

            $.ajax('/api/unique/carrier', {
                method: 'POST',
                data: { [name]: number, _id },
                success(response) {
                    const { unique, original } = response

                    if (unique || original) {
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