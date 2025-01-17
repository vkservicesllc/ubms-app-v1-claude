/* jQuery & jQuery Caret required */
import { formSelectors } from '/modules/registry/selectors.mjs'
import { nameEvent } from '/modules/events/person.mjs'


const { firstNameId, aliasId, lastNameId, genderId } = formSelectors.user

nameEvent(firstNameId, { onChange: checkName })
nameEvent(aliasId, { onChange: checkName })
nameEvent(lastNameId, { sfx: true })

const $gender = {
    m: $(`#${genderId}-m`),
    f: $(`#${genderId}-f`),
}
const $avatar = $('#avatar')

$gender.m.click(() => updateAvatar('m'))
$gender.f.click(() => updateAvatar('f'))


function checkName() {
    const value = {
        firstName: $(`#${firstNameId}`).val(),
        alias: $(`#${aliasId}`).val(),
    }
    const $update = $('[type=submit]')
    const $message = $('.error.message')
    const $errList = $('#error-message-list')
    const $input = $(`#${firstNameId}, #${aliasId}`).parent()

    $input.removeClass('error')
    $message.hide()
    $errList.html(null)
    $update.prop('disabled', false)

    if (value.firstName && value.firstName == value.alias) {
        $update.prop('disabled', true)
        $errList.html('<li>First Name and Alias must not be identical')
        $message.show()
        $input.addClass('error')
    }
}

function updateAvatar(name) {
    const src = $avatar.attr('src')
    const file = src.match(/\w\.png/)

    $avatar.attr('src', src.replace(file, `${name.toUpperCase()}.png`))
}