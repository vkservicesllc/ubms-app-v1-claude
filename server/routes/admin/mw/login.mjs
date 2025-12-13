import User from '../../../tools/core/user.mjs'
import UserForm from '../../../tools/form/user.mjs'

const sendError = require('../../../tools/utils/error')


const disabled = true
const label = {
    username: UserForm.username.text.label({ class: 'label' }),
    password: UserForm.password.text.label({ class: 'label' }),
}
const input = {
    username: UserForm.username.text.input({ class: 'input' }),
    password: UserForm.password.text.input({ class: 'input' }),
}


export default (req, res, next) => {
    if (req.session.user) return next()

    try {
        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.label = {
            username: label.username,
            password: label.password,
        }
        hbs.input = {
            username: input.username,
            password: input.password,
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}


export const initialize = async (req, res, next) => {
    if (req.session.user) return next()

    const developer = await User.fetch(res.session, { id: 1 }, { offline: true })
    if (developer) return next()

    try {
        const key = 'init'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.label = {
            firstName: UserForm.firstName.text.label({ class: 'label', content: 'First Name' }),
            lastName: UserForm.lastName.text.label({ class: 'label' }),
            email: UserForm.email.text.label({ class: 'label' }),
            username: label.username,
            password: label.password,
        }
        hbs.input = {
            firstName: UserForm.firstName.text.input({ class: 'input', disabled }),
            lastName: UserForm.lastName.text.input({ class: 'input', disabled }),
            email: UserForm.email.text.input({ class: 'input', disabled }),
            username: input.username,
            password: input.password,
        }

        res.render(key, hbs)
    } catch (err) {
        sendError.server(req, res, err)
    }
}