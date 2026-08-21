/* jQuery & jQuery Caret required */
import { usernameEvent, passwordEvent, loginEvent } from './events/user.mjs';

const $error = $('#error-message');
const $dimmer = $('.dimmer');

usernameEvent({
    onInput() {
        $error.html(null).hide();
    },
});

passwordEvent('current', {
    onInput() {
        $error.html(null).hide();
    },
});

loginEvent({
    onSubmit() {
        $error.html(null).hide();
        $dimmer.addClass('active');
    },
    onAjax(response, params) {
        const { username, password, condition, error } = response;
        const { $form, $password } = params;

        if (!username) $error.text(error.username || 'User error').show();
        if (!password) $error.text(error.password || 'Password error').show();
        if (condition != 'A') $error.text(error.username || 'Condition error').show();

        if (!$.isEmptyObject(error)) {
            $password.val(null);
            return $dimmer.removeClass('active');
        } else {
            const { username } = params;

            $.ajax('/api/login/validation', {
                data: { username },
                method: 'POST',
                success(response) {
                    const { validated } = response;

                    if (!validated) {
                        $error.text('User not permitted').show();
                        return $dimmer.removeClass('active');
                    }

                    $form.unbind().submit();
                },
            });
        }
    },
});
