/* jQuery & jQuery Caret required */
import { usernameEvent, passwordEvent, loginEvent } from './events/user.mjs'


const $error = {
    all: $('.error-message'),
    username: $('#username-error'),
    password: $('#password-error'),
}

usernameEvent({
    onInput() {
        $error.username.text(null).hide()
    },
})

passwordEvent('current', {
    onInput() {
        $error.password.text(null).hide()
    },
})

loginEvent({
    onSubmit() {
        $error.all.text(null).hide()
    },
    onAjax(response, params) {
        const { username, password, condition, error } = response
        const { $form, $password } = params

        if (!username)
            $error.username.text(error.username || 'User error').show()
        if (!password)
            $error.password.text(error.password || 'Password error').show()
        if (condition != 'A')
            $error.username.text(error.username || 'Condition error').show()

        if (!$.isEmptyObject(error)) return $password.val(null)

        $form.unbind().submit()
    },
})