/* jQuery, jQuery Caret & jQuery Masked Input required */
import selector from '/modules/registry/selectors/user.mjs'
import { usernameEvent } from './events/user.mjs'
import { emailEvent, telEvent } from './events/contacts.mjs'

const TS = selector.id.text
const usernameId = TS.username
const emailId = TS.email
const phoneId = TS.phone


const $help = {
    all: $('.help'),
    username: $('#username-help'),
    email: $('#email-help'),
}
const values = {
    username: $(usernameId).val(),
    email: $(emailId).val(),
}


usernameEvent({
    onInput(username, $username) {
        $username.parent().removeClass('error')
        $help.username.hide().find('span').html(null)
    },
    onChange(username, valid, $username) {
        if (valid === false) {
            $username.val(null).focus().parent().addClass('error')
            $help.username
                .show()
                .find('span')
                    .html(`<i class="ui exclamation triangle icon"></i> <b>${username}</b> is invalid username`)
        }
    },
    onAjax(response, $username) {
        const username = $username.val()

        if (username && username !== values.username && !response.unique) {
            $username.val(null).focus().parent().addClass('error')
            $help.username
                .show()
                .find('span')
                    .html(`<i class="ui close icon"></i> <b>${username}</b> is taken`)
        }
    },
})


emailEvent(emailId, {
    onInput(email, $email) {
        $email.parent().removeClass('error')
        $help.email.hide().find('span').html(null)
    },
    onChange(email, valid, $email) {
        if (valid === false) {
            $email.val(null).focus().parent().addClass('error')
            $help.email
                .show()
                .find('span')
                    .html(`<i class="ui exclamation triangle icon"></i> <b>${email}</b> is invalid email`)
        } else {
            if (email && email !== values.email)
                $.ajax('/api/unique/user', {
                    method: 'POST',
                    data: { email },
                    success(response) {
                        if (!response.unique) {
                            $email.val(null).focus().parent().addClass('error')
                            $help.email
                                .show()
                                .find('span')
                                    .html(`<i class="ui close icon"></i> <b>${email}</b> is taken`)
                        }
                    },
                })
        }
    },
})


telEvent(phoneId)