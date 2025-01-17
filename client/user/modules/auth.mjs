/* jQuery & jQuery Caret required */
import { tokenEvent, authEvent } from './events/user.mjs'


tokenEvent()

authEvent(($form, $token, params) => {
    const { valid } = params

    if (!valid) return alert('Invalid token')

    $form.unbind().submit()
})