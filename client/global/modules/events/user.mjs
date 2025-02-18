/* jQuery required */
import { inputEvent } from './form.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import patterns from '../registry/patterns.mjs'


const { class: userClass, id, userId, passId, confPassId, newPassId, tokenId } = formSelectors.user


export const usernameEvent = (callback = {}) => {
    const { onInput, onChange, onAjax, onFocus, onBlur } = callback

    inputEvent(userId, {
        lower: true,
        strip: true,
        onInput(username, $username) {
            username = patterns.replace(username, 'username')

            $username.val(username)
            if (onInput) onInput(username, $username)
        },
        onChange(username, $username) {
            if (onChange) {
                const valid = username
                    ? patterns.match.username.test(username)
                    : null

                onChange(username, valid, $username)
            }

            if (onAjax && username) {
                let url = '/api/unique/user'
                const formMode = $('#form-mode')?.val()
                if (formMode == 'reg') url += '/new/username'

                $.ajax(url, {
                    method: 'POST',
                    data: { username },
                    success(response) {
                        onAjax(response, $username)
                    },
                })
            }
        },
        onFocus,
        onBlur,
    })
}


export const passwordEvent = (flag, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback
    if (!flag || ![ 'current', 'new', 'confirm' ].includes(flag)) return
    const key = { current: 'passId', new: 'newPassId', confirm: 'confPassId' }[flag]

    inputEvent(formSelectors.user[key], {
        onInput(password, $password) {
            if (onInput) onInput($password)
        },
        onChange(password, $password) {
            if (onChange) {
                let valid

                switch (flag) {

                    case 'new':
                        if (password) valid = patterns.match.password.test(password)
                        onChange(valid, $password, $(`#${confPassId}`))
                        break

                    case 'confirm':
                        const original = $(`#${newPassId}`).val()
                        if (password && original) valid = password === original
                        onChange(valid, $password)
                        break

                    default:
                        onChange($password)

                }
            }
        },
        onFocus,
        onBlur,
    })
}


export const tokenEvent = (callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(tokenId, {
        onInput(token, $token) {
            token = token.replace(/[\D]/g, '')

            $token.val(token)
            if (onInput) onInput(token, $token)
        },
        onChange(token, $token) {
            if (onChange) {
                const valid = token
                    ? patterns.match.token.test(token)
                    : null

                onChange(token, valid, $token)
            }
        },
        onFocus,
        onBlur,
    })
}


export const loginEvent = (callback = {}) => {
    const { onSubmit, onAjax } = callback
    const { loginFormId } = formSelectors.user
    const $form = $(`#${loginFormId}`)
    const
        $username = $(`#${userId}`),
        $password = $(`#${passId}`)

    $form.on('submit', event => {
        event.preventDefault()

        const
            username = $username.val(),
            password = $password.val()

        if (onSubmit)
            onSubmit($form, $username, $password)

        if (username && password)
            setTimeout(() => {
                $.ajax('/api/login', {
                    method: 'POST',
                    data: { username, password },
                    success(response) {
                        if (onAjax) onAjax(response, { $form, $username, $password })
                        else $form.unbind().submit()
                    },
                })
            }, 500)
    })

    setTimeout(() => {
        $(`.${userClass}`).removeAttr('disabled')
    }, 750)
}


export const authEvent = onSubmit => {
    const { authFormId } = formSelectors.user
    const $form = $(`#${authFormId}`)
    const $token = $(`#${tokenId}`)

    $form.on('submit', event => {
        event.preventDefault()

        const token = $token.val()

        if (token) {
            const valid = patterns.match.token.test(token)

            if (onSubmit) onSubmit($form, $token, { token, valid })
        } else $form.unbind().submit()
    })
}


export const registerEvent = onSubmit => {
    const { registerFormId } = formSelectors.user
    const $form = $(`#${registerFormId}`)
    const $username = $(`#${userId}`)
    const $password = $(`#${newPassId}`)

    $form.on('submit', event => {
        event.preventDefault()

        const username = $username.val()
        const password = $password.val()

        if (username && password) {
            const valid = patterns.match.password.test(password)

            if (onSubmit) onSubmit($form, valid)
            else $form.unbind().submit()
        }
    })

    setTimeout(() => {
        $(`.${userClass}`).removeAttr('disabled')
    }, 750)
}


export const roleNameEvent = (id, locationId, catId, callback = {}) => {
    const { onInput, onChange, onAjax, onFocus, onBlur } = callback

    inputEvent(id, {
        strip: true,
        onInput(name, $name) {
            name = patterns.replace(name, 'roleName')

            $name.val(name)
            if (onInput) onInput(name, $name)
        },
        onChange(name, $name) {
            //! need to determine
        },
        onFocus,
        onBlur,
    })
}