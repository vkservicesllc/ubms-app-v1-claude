/* jQuery & jQuery Caret required */
import { passwordEvent } from './events/user.mjs'
import selector from '/modules/registry/selectors/user.mjs'


const $validation = {
    password: $('#password-validation'),
    confPassword: $('#conf-password-validation'),
}
const $help = {
    all: $('.help'),
    password: $('#password-help'),
    confPassword: $('#conf-password-help'),
    passError: $('#password-error-tip'),
    formError: $('#password-form-error-tip'),
}
const $button = {
    submit: $('[type=submit]'),
}
const $form = $('#user-security-form')
const style = {
    message: {
        all: 'success red info',  // ? check if info needed
        success: 'success',
        failed: 'red',
        info: 'info',  // ?
    },
}
const $password = $(selector.id.text.password)
const $newPassword = $(selector.id.text.createPassword)


passwordEvent('current', {
    onInput() {
        $button.submit.prop('disabled', true)
    }, onChange() {
        $button.submit.prop('disabled', !formValid())
    },
})

passwordEvent('new', {
    onInput($password) {
        $help.password.hide().find('span').removeClass(style.message.all).html(null)
        $help.passError.hide()
        $password.parent().removeClass('error')
        $validation.password.val(null)
        $button.submit.prop('disabled', true)
    },
    onChange(valid, $password, $confirm) {
        formError()
        $confirm.val(null).parent().removeClass('error')
        $validation.confPassword.val(null)
        $help.confPassword.hide().find('span').removeClass(style.message.all).html(null)

        if (valid !== null) {
            const { success, failed } = style.message
            let styler = success,
                content = 'Password accepted <i class="ui check icon"></i>'

            $password.parent().removeClass('error')
            $validation.password.val('passed')

            if (!valid) {
                styler = failed
                content = 'Password validation failed <i class="ui close icon"></i>'
                $help.passError.show()
                $password.val(null).focus().parent().addClass('error')
                $validation.password.val('failed')
            } else if (formValid()) $button.submit.prop('disabled', false)

            $help.password
                .show()
                .find('span')
                    .addClass(styler)
                    .html(content)
        }
    },
})

passwordEvent('confirm', {
    onInput($password) {
        $help.confPassword.hide().find('span').removeClass(style.message.all).html(null)
        $password.parent().removeClass('error')
        $validation.confPassword.val(null)
        $button.submit.prop('disabled', true)
    },
    onChange(valid, $password) {
        if (valid !== null) {
            const { success, failed } = style.message
            let styler = success,
                content = 'Passwords matched <i class="ui check icon"></i>'

            $password.parent().removeClass('error')
            $validation.confPassword.val('passed')

            if (!valid) {
                styler = failed
                content = 'Passwords mismatched <i class="ui close icon"></i>'
                $password.val(null).focus().parent().addClass('error')
                $validation.confPassword.val('failed')
            } else if (formValid()) $button.submit.prop('disabled', false)

            $help.confPassword
                .show()
                .find('span')
                    .addClass(styler)
                    .html(content)
        } else {
            $password.val(null)
            $validation.confPassword.val(null)
        }
    },
})


$form.submit(function(evt) {
    evt.preventDefault()
    formError()

    const password = $password.val()
    const newPassword = $newPassword.val()

    if (newPassword && newPassword === password)
        return formError('<li>Please choose a password different from your current one</li>')

    $.ajax('/api/user/security', {
        method: 'POST', 
        data: { password, newPassword },
        success(response) {
            //! work in progress
        },
    })
})


function formValid() {
    let valid = !!$password.val()

    if (valid)
        for (const prop in $validation) {
            if ($validation[prop].val() === 'passed') continue

            valid = false
            break
        }

    return valid
}


function formError(list = null) {
    const $errList = $help.formError.find('.list')

    $errList.html(list)
    $help.formError[list ? 'show' : 'hide']()
}