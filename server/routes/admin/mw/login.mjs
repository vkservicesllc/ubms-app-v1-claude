import { Label, Input, Button } from '../../../html/user.mjs'
import { formSelectors } from '../../../../client/global/modules/registry/selectors.mjs'


export default (req, res, next) => {
    if (req.session.user) return next()

    try {
        const key = 'login'
        let { hbs } = res
        hbs = hbs.set(key)

        hbs.label = {
            username: Label.username({ class: 'label' }),
            password: Label.password({ class: 'label' }),
        }
        hbs.input = {
            username: Input.username({ class: 'input' }),
            password: Input.password({ class: 'input' }),
        }
        hbs.button = {
            login: Button.login({ class: 'button is-fullwidth is-primary' }),
        }

        hbs.formId = formSelectors.user.loginFormId

        res.render(key, hbs)
    } catch (err) {
        require('../../../tools/error').data.server(res, null, err)
    }
}