import UserForm from '../../../tools/form/user.mjs'


export default (req, res, next) => {
    if (req.session.user) return next()

    try {
        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.label = {
            username: UserForm.username.text.label({ class: 'label' }),
            password: UserForm.password.text.label({ class: 'label' }),
        }
        hbs.input = {
            username: UserForm.username.text.input({ class: 'input' }),
            password: UserForm.password.text.input({ class: 'input' }),
        }

        res.render(key, hbs)
    } catch (err) {
        require('../../../tools/utils/error').server(res, err)
    }
}