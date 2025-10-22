/* jQuery required */
import { inputEvent, selectEvent } from './form.mjs'
import selector from '../registry/selectors/user.mjs'
import patterns from '../registry/patterns.mjs'
import { capitalizeEach } from '../tools/utils/string.mjs'


export const usernameEvent = (options = {}) => {
    const { onInput, onChange, onAjax, onFocus, onBlur, value } = options
    const { username , newUsername } = selector.id.text

    inputEvent(`${username}, ${newUsername}`, {
        lower: true,
        word: true,
        strip: true,
        value,
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
    const key = { current: 'password', new: 'createPassword', confirm: 'confirmPassword' }[flag]

    inputEvent(selector.id.text[key], {
        onInput(password, $password) {
            if (onInput) onInput($password)
        },
        onChange(password, $password) {
            if (onChange) {
                let valid

                switch (flag) {

                    case 'new':
                        if (password) valid = patterns.match.password.test(password)
                        onChange(valid, $password, $(selector.id.text.confirmPassword))
                        break

                    case 'confirm':
                        const original = $(selector.id.text.createPassword).val()
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

    inputEvent(selector.id.text.token, {
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
    const $form = $('#login-form, #sign-in-form')
    const
        $username = $(selector.id.text.username),
        $password = $(selector.id.text.password)

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
                        if (onAjax) onAjax(response, { username, $form, $username, $password })
                        else $form.unbind().submit()
                    },
                    error(err) {
                        const { error } = err.responseJSON
                        if (error) {
                            alert(error)
                            location.reload()
                        }
                    },
                })
            }, 500)
    })

    setTimeout(() => {
        $(`${selector.class.text.signIn}, [type=submit]`).removeAttr('disabled')
    }, 750)
}


export const authEvent = onSubmit => {
    const $form = $('#auth-form')
    const $token = $(selector.id.text.token)

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
    const $form = $('#sign-up-form')
    const $username = $(selector.id.text.newUsername)
    const $password = $(selector.id.text.createPassword)

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

    //! (DO NOT UNCOMMENT) This will force "Sign up" to be enabled before terms and conditions
    // setTimeout(() => {
    //     $(`${selector.class.text.signUp}, [type=submit]`).removeAttr('disabled')
    // }, 750)
}


export const roleNameEvent = (ajaxData = {}, options = {}) => {
    const { catId, $id, $location } = ajaxData
    const { onInput, onChange, onAjax, onFocus, onBlur, value } = options

    inputEvent(selector.class.text.roleName, {
        strip: true,
        word: true,
        value,
        onInput(name, $name) {
            name = patterns.replace(name, 'roleName')
            name = capitalizeEach(name)

            $name.val(name)
            if (onInput) onInput(name, $name)
        },
        onChange(name, $name) {
            if (onChange) onChange(name, $name)

            if (name && catId) {
                const _id = $id.val()
                const location = $location.val()

                $.ajax('/api/unique/original/role', {
                    method: 'POST',
                    data: { _id, catId, name, location },
                    success(response) {
                        const { unique, original, error } = response
                        if (error) alert(error)

                        if (onAjax) onAjax({ unique, original }, name, $name)
                    },
                })
            }
        },
        onFocus,
        onBlur,
    })
}


export const roleLocationEvent = (ajaxData = {}, options = {}) => {
    const { catId, $id, $name } = ajaxData
    const { onChange, onAjax, onFocus, onBlur, value } = options

    selectEvent(selector.class.select.roleLocation, {
        value,
        onChange(location, $location) {
            if (onChange) onChange(location, $location)

            const name = $name.val()
            if (name && catId) {
                const _id = $id.val()

                $.ajax('/api/unique/original/role', {
                    method: 'POST',
                    data: { _id, catId, name, location },
                    success(response) {
                        const { unique, original, error } = response
                        if (error) alert(error)

                        if (onAjax) onAjax({ unique, original }, location, $location)
                    },
                })
            }
        },
        onFocus,
        onBlur,
    })
}