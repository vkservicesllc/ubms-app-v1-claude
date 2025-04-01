export const onInput = (value, $el) => $el.removeClass('is-valid is-invalid')

export const onChange = (value, $el) => {
    const required = $el.prop('required')
    if (value && required) $el.addClass('is-valid')
}

export const onBlur = (value, $el) => onChange(value, $el)

export const onSubmit = ($form, $help, $submit, $card) => {
    $form.submit(function(evt) {
        evt.preventDefault()
    
        const valid = $(this).find('input[required]').filter('.is-invalid').length === 0
        if (!valid)
            return $help.form
                .html('<i class="fas fa-triangle-exclamation"></i> Some of the provided information is invalid')
                .show()
    
        $help.form.hide().html(null)
        $submit
            .prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm"></span> Submitting...')
    
        const duration = 750
        $card.fadeOut(duration)
        setTimeout(() => $form.unbind().submit(), duration)
    })
}