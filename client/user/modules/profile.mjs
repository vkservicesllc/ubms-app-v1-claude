/* jQuery & jQuery Caret required */
import selector from '/modules/registry/selectors/user.mjs';
import { nameEvent } from '/modules/events/person.mjs';

const TS = selector.id.text,
    RS = selector.id.radio;
const firstNameId = TS.firstName;
const aliasId = TS.alias;
const lastNameId = TS.lastName;

nameEvent(firstNameId, { onChange: checkName });
nameEvent(aliasId, { onChange: checkName });
nameEvent(lastNameId, { sfx: true });

const $gender = {
    male: $(RS.gender.male),
    female: $(RS.gender.female),
};
const $avatar = $('#avatar');

$gender.male.click(() => updateAvatar('m'));
$gender.female.click(() => updateAvatar('f'));

function checkName() {
    const value = {
        firstName: $(firstNameId).val(),
        alias: $(aliasId).val(),
    };
    const $update = $('[type=submit]');
    const $message = $('.error.message');
    const $errList = $('#error-message-list');
    const $input = $(`${firstNameId}, ${aliasId}`).parent();

    $input.removeClass('error');
    $message.hide();
    $errList.html(null);
    $update.prop('disabled', false);

    if (value.firstName && value.firstName.toUpperCase() === value.alias.toUpperCase()) {
        $update.prop('disabled', true);
        $errList.html('<li>First Name and Alias must not be identical');
        $message.show();
        $input.addClass('error');
    }
}

function updateAvatar(name) {
    const src = $avatar.attr('src');
    const file = src.match(/\w\.png/);

    $avatar.attr('src', src.replace(file, `${name.toUpperCase()}.png`));
}
