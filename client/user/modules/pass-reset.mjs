/* jQuery & jQuery Caret required */
import { passwordEvent } from './events/user.mjs';
import selector from './registry/selectors/user.mjs';

const $validation = {
    password: $('#password-validation'),
    confPassword: $('#conf-password-validation'),
};
const $help = {
    all: $('.help'),
    password: $('#password-help'),
    confPassword: $('#conf-password-help'),
    passError: $('#password-error-tip'),
};
const style = {
    message: {
        all: 'success red info', // ? check if info needed
        success: 'success',
        failed: 'red',
        info: 'info', // ?
    },
};
const $button = {
    submit: $('[type=submit]'),
};
const $eye = $('#eye-icon');

$eye.click(function () {
    const $password = $(selector.id.text.createPassword);

    if ($(this).hasClass('slash')) {
        $(this).removeClass('slash');
        $password.attr('type', 'text');
    } else {
        $(this).addClass('slash');
        $password.attr('type', 'password');
    }
});

passwordEvent('new', {
    onInput($password) {
        $help.password.hide().find('span').removeClass(style.message.all).html(null);
        $help.passError.hide();
        $password.parent().removeClass('error');
        $validation.password.val(null);
        $button.submit.prop('disabled', true);
    },
    onChange(valid, $password, $confirm) {
        $confirm.val(null).parent().removeClass('error');
        $validation.confPassword.val(null);
        $help.confPassword.hide().find('span').removeClass(style.message.all).html(null);

        if (valid !== null) {
            const { success, failed } = style.message;
            let styler = success,
                content = 'Password accepted <i class="ui check icon"></i>';

            $password.parent().removeClass('error');
            $validation.password.val('passed');

            if (!valid) {
                styler = failed;
                content = 'Password validation failed <i class="ui close icon"></i>';
                $help.passError.show();
                $password.val(null).focus().parent().addClass('error');
                $validation.password.val('failed');
            } else if (formValid()) $button.submit.prop('disabled', false);

            $help.password.show().find('span').addClass(styler).html(content);
        }
    },
});

passwordEvent('confirm', {
    onInput($password) {
        $help.confPassword.hide().find('span').removeClass(style.message.all).html(null);
        $password.parent().removeClass('error');
        $validation.confPassword.val(null);
        $button.submit.prop('disabled', true);
    },
    onChange(valid, $password) {
        if (valid !== null) {
            const { success, failed } = style.message;
            let styler = success,
                content = 'Passwords matched <i class="ui check icon"></i>';

            $password.parent().removeClass('error');
            $validation.confPassword.val('passed');

            if (!valid) {
                styler = failed;
                content = 'Passwords mismatched <i class="ui close icon"></i>';
                $password.val(null).focus().parent().addClass('error');
                $validation.confPassword.val('failed');
            } else if (formValid()) $button.submit.prop('disabled', false);

            $help.confPassword.show().find('span').addClass(styler).html(content);
        } else {
            $password.val(null);
            $validation.confPassword.val(null);
        }
    },
});

function formValid() {
    let valid = true;

    for (const prop in $validation) {
        if ($validation[prop].val() === 'passed') continue;

        valid = false;
        break;
    }

    return valid;
}
