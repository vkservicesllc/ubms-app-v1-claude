/* jQuery & jQuery Caret required */
import { passwordEvent } from './events/user.mjs';
import selector from '/modules/registry/selectors/user.mjs';

const $validation = {
  password: $('#password-validation'),
  confPassword: $('#conf-password-validation'),
};
const $help = {
  all: $('.help'),
  password: $('#password-help'),
  confPassword: $('#conf-password-help'),
  passError: $('#password-error-tip'),
  formError: $('#password-form-error-tip'),
  formSuccess: $('#password-form-success-tip'),
};
const $button = {
  submit: $('[type=submit]'),
};
const $form = $('#user-security-form');
const style = {
  message: {
    all: 'success red info', // ? check if info needed
    success: 'success',
    failed: 'red',
    info: 'info', // ?
  },
};
const $password = $(selector.id.text.password);
const $newPassword = $(selector.id.text.createPassword);
const $eye = $('#eye-icon');

$eye.click(function () {
  const $password = $newPassword;

  if ($(this).hasClass('slash')) {
    $(this).removeClass('slash');
    $password.attr('type', 'text');
  } else {
    $(this).addClass('slash');
    $password.attr('type', 'password');
  }
});

passwordEvent('current', {
  onInput() {
    $button.submit.prop('disabled', true);
  },
  onChange() {
    $button.submit.prop('disabled', !formValid());
    $help.formSuccess.hide();
  },
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
    formError();
    $help.formSuccess.hide();
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
    $help.formSuccess.hide();
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

$form.submit(function (evt) {
  evt.preventDefault();
  $button.submit.addClass('loading');
  formError();
  $help.formSuccess.hide();

  const password = $password.val();
  const newPassword = $newPassword.val();

  $.ajax('/api/user/security', {
    method: 'POST',
    data: { password, newPassword },
    success(response) {
      $button.submit.removeClass('loading');
      const { updated, matched, same } = response;

      if (!updated) {
        let list = '<li>Oops! Something went wrong!';
        if (!matched) list = '<li>The current password you entered is incorrect</li>';
        else if (same) list = '<li>Please choose a password different from your current one</li>';

        return formError(list);
      }

      $('input').val(null);
      $help.all.hide().find('span').removeClass(style.message.all).html(null);
      $button.submit.prop('disabled', true);
      $eye.addClass('slash');
      $newPassword.attr('type', 'password');
      $help.formSuccess.show();
    },
  });
});

function formValid() {
  let valid = !!$password.val();

  if (valid)
    for (const prop in $validation) {
      if ($validation[prop].val() === 'passed') continue;

      valid = false;
      break;
    }

  return valid;
}

function formError(list = null) {
  const $errList = $help.formError.find('.list');

  $errList.html(list);
  $help.formError[list ? 'show' : 'hide']();
}
