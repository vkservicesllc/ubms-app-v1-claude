export default function(offset = 1) {
    const { href } = window.location
    const x = href.split('/')

    return x[x.length - offset].split('?')[0]
}

export const check = $form => $form.find('input[required]').filter('.is-invalid').length === 0

export const onInput = (value, $el) => $el.removeClass('is-valid is-invalid')

export const onKeyup = (value, $el) => onInput(value, $el)

export const onAccept = (mask, $el) => onInput(mask.value, $el)

export const onChange = (value, $el) => {
    if (!$el) return
    if (['MM/DD/YYYY', '(###) ###-####', '###-##-####'].includes(value))
        value = null

    const required = $el.prop('required')

    if (value && required) $el.addClass('is-valid')
}

export const onCompleted = (value, $el) => onChange(value, $el)

export const onBlur = (value, $el) => onChange(value, $el)

export const onSubmit = ($form, $help, $submit, $card, cb) => {
    $form.submit(function(evt) {
        evt.preventDefault()
        let dismiss = false

        if ($help?.form) {
            const valid = check($(this))
            if (!valid)
                return $help.form
                    .html('<i class="fas fa-triangle-exclamation"></i> Some of the provided information is invalid')
                    .show()

            $help.form.hide().html(null)
        }

        if (cb && typeof cb === 'object' && cb.dismiss) dismiss = cb.dismiss()

        if (!dismiss) {
            const duration = 750

            $submit
                .prop('disabled', true)
                .html('<span class="spinner-border spinner-border-sm"></span> Submitting...')
            $card.fadeOut(duration)

            if (cb && typeof cb !== 'object') cb()
            setTimeout(() => $form.unbind().submit(), duration)
        }
    })
}

export const onYesNoRadioChange = (id, explSelector, depth = 1) => {
    const $radio = $(`${id.yes}, ${id.no}`)
    const $expl = $(explSelector)

    $radio.on('change', function() {
        const value = $(this).val()
        const action = value === 'Y' ? 'show' : 'hide'
        const disabled = action === 'hide'
        let $parent = $expl.parent()
        if (depth === 2) $parent = $parent.parent()

        $expl.prop('disabled', disabled)
        $parent[action]()
    })
}