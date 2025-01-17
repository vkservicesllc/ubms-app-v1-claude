/* jQuery & jQuery Caret required */
import { usernameEvent, passwordEvent, loginEvent } from './events/user.mjs'


const $error = $('#error-message')

usernameEvent({
    onInput() {
        $error.html(null).hide()
    },
})

passwordEvent('current', {
    onInput() {
        $error.html(null).hide()
    },
})

loginEvent({
    onSubmit() {
        $error.html(null).hide()
    },
    onAjax(response, params) {
        const { username, password, condition, error } = response
        const { $form, $password } = params

        if (!username)
            $error.text(error.username || 'User error').show()
        if (!password)
            $error.text(error.password || 'Password error').show()
        if (condition != 'A')
            $error.text(error.username || 'Condition error').show()

        if (!$.isEmptyObject(error)) return $password.val(null)

        $form.unbind().submit()
    },
})