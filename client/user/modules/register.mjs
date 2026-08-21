/* jQuery & jQuery Caret required */
import { usernameEvent, passwordEvent, registerEvent } from './events/user.mjs';
import selector from './registry/selectors/user.mjs';

const $validation = {
    username: $('#username-validation'),
    password: $('#password-validation'),
    confPassword: $('#conf-password-validation'),
};
const $help = {
    all: $('.help'),
    username: $('#username-help'),
    password: $('#password-help'),
    confPassword: $('#conf-password-help'),
    passError: $('#password-error-tip'),
};
const $terms = $('#terms');
const $link = {
    terms: $('#terms-link'),
};
const $segment = {
    error: {
        form: $('#form-error'),
    },
    declined: $('#failed-registration, #terms-declined'),
};
const $button = {
    agree: $('#agree-button'),
    decline: $('#decline-button'),
    cancelDecline: $('#cancel-decline-button'),
    confirmDecline: $('#confirm-decline-button'),
    submit: $('[type=submit]'),
};
const $modal = {
    all: $('.modal'),
    terms: $('#terms-modal'),
    termsDecline: $('#terms-decline-modal'),
    content: $('.scrolling.content'),
};
const style = {
    message: {
        all: 'success red info', // ? check if info needed
        success: 'success',
        failed: 'red',
        info: 'info', // ?
    },
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

usernameEvent({
    onInput(username, $username) {
        let action = 'show',
            content = '<i class="ui loading spinner icon"></i>';
        if (!username) {
            action = 'hide';
            content = null;
        }

        $username.parent().removeClass('error');
        $help.username[action]().find('span').removeClass(style.message.all).html(content);
    },
    onChange(username, valid, $username) {
        $help.username.hide().find('span').removeClass(style.message.all);

        if (valid === false) {
            $username.val(null).focus().parent().addClass('error');
            $help.username
                .show()
                .find('span')
                .addClass(style.message.failed)
                .html(
                    `<i class="ui exclamation triangle icon"></i> <b>${username}</b> is invalid username`,
                );
        }

        if (!username) $validation.username.val(null);
    },
    onAjax(response, $username) {
        const username = $username.val();

        if (username) {
            const { unique } = response;
            const { success, failed } = style.message;
            let styler = success,
                message = 'Username available <i class="ui check icon"></i>';

            if (!unique) {
                styler = failed;
                message = 'Username taken <i class="ui close icon"></i>';
                $username.parent().addClass('error');
                $validation.username.val('failed');
            } else {
                $validation.username.val('passed');
                if (formValid()) $segment.error.form.hide();
            }

            $help.username.show().find('span').addClass(styler).html(message);
        }
    },
});

passwordEvent('new', {
    onInput($password) {
        $help.password.hide().find('span').removeClass(style.message.all).html(null);
        $help.passError.hide();
        $password.parent().removeClass('error');
        $validation.password.val(null);
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
            } else if (formValid()) $segment.error.form.hide();

            $help.password.show().find('span').addClass(styler).html(content);
        }
    },
});

passwordEvent('confirm', {
    onInput($password) {
        $help.confPassword.hide().find('span').removeClass(style.message.all).html(null);
        $password.parent().removeClass('error');
        $validation.confPassword.val(null);
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
            } else if (formValid()) $segment.error.form.hide();

            $help.confPassword.show().find('span').addClass(styler).html(content);
        } else {
            $password.val(null);
            $validation.confPassword.val(null);
        }
    },
});

registerEvent(($form, validPass) => {
    if (!validPass) alert('Invalid Password!');
    if (!formValid()) return $segment.error.form.show();

    $form.addClass('loading');
    setTimeout(() => {
        $form.unbind().submit();
    }, 1200);
});

$terms.on('click', function () {
    if ($(this).data('status') == 'unread') $(this).prop('checked', false);
});

$modal.all.modal({
    closable: false,
    onHide: function () {
        // Manually check if the click event target is the dimmer
        if ($(event.target).hasClass('dimmer')) {
            event.preventDefault(); // Prevent the modal from closing
            event.stopPropagation(); // Stop the click event from propagating further
        }
    },
});

$modal.content.scroll(function () {
    const diff = 2.4;
    const content = $(this);
    const height = content.prop('scrollHeight');
    const position = content.scrollTop() + content.innerHeight();

    if (height - position < diff) $button.agree.prop('disabled', false);
    if (height - position >= diff) $button.agree.prop('disabled', true);
});

$link.terms.click(function (e) {
    e.preventDefault();

    if (formValid()) $modal.terms.modal('show');
});

$button.agree.click(function () {
    $terms
        .attr('data-status', 'read-agreed')
        .off('click')
        .prop('checked', true)
        .click(function () {
            let disabled = true;
            if ($(this).prop('checked')) disabled = false;

            $button.submit.prop('disabled', disabled);
        });

    $button.submit.prop('disabled', false);
});

$button.decline.click(function () {
    $modal.termsDecline.modal('show');
});

$button.cancelDecline.click(function () {
    $modal.terms.modal('show');
});

$button.confirmDecline.click(function () {
    const _id = $(selector.id.hidden.id).val();

    $.ajax({
        url: `/api/user/decline/${_id}`,
        type: 'POST',
        success(response) {
            if (response == 'OK') {
                const $form = $('#sign-up-form, #form-header');
                $button.submit.prop('disabled', true);
                $terms.prop('checked', false).prop('disabled', true);
                $modal.termsDecline.hide();
                $form.hide();
                $segment.declined.show();
            }
        },
        error(err) {
            console.error(err);
            alert(err.responseJSON);
        },
    });
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
