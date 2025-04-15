import createForm, { constructForm } from './builder.mjs'
import {
    createIdForm,
    createPersonNameForm,
    createGenderForm,
    createPhoneForm,
    createEmailForm,
} from './reusable.mjs'

import selector from '../../../client/global/modules/registry/selectors/user.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'
import { capitalizeFirst } from '../../../client/global/modules/tools/utils/string.mjs'

const required = true, disabled = true

const propsData = {
    status: { 'U': 'User', 'A': 'Admin', 'S': 'Super Admin' },
    location: { 'US': 'USA', 'UA': 'Ukraine' },
    condition: { 'A': 'Active', 'I': 'Inactive', 'L': 'Locked' },
}

const conditionKeys = ['active', 'inactive', 'locked']


const createPropsForm = (flag, props = {}) => createForm({
    selector,
    target: flag,
    group: 'props',
    ...props,
    type: flag === 'condition' ? 'select/radio' : 'select',
    name: flag,
    data: propsData[flag],
    keys: flag === 'condition' ? conditionKeys : null,
    required,
    label: capitalizeFirst(flag),
})


const createUsernameForm = flag => createForm({
    selector,
    target: flag === 'new' ? 'newUsername' : 'username',
    group: flag === 'new' ? 'signUp' : 'signIn',
    name: 'username',
    maxLength: length.user.username.max,
    autoComplete: 'off',
    required,
    disabled,
    label: 'Username',
    validator: flag === 'new'
        ? {
            length: { min: length.user.username.min },
        }
        : true
})


const createPasswordForm = flag => {
    let target = 'password',
        name = 'password',
        autoComplete = 'new-password',
        label = 'Password',
        validator = true

    switch (flag) {

        case 'new':
            target = 'createPassword'
            label = 'Create Password'
            validator = {
                length: { min: length.user.password.min },
                //! add more...
            }
            break

        case 'confirm':
            target = 'confirmPassword'
            name = null
            label = 'Confirm Password'
            break

        default:
            autoComplete = 'off'

    }

    return createForm({
        selector,
        target,
        group: flag === 'new' ? 'signUp' : 'signIn',
        type: 'password',
        name,
        maxLength: length.user.password.max,
        autoComplete,
        required,
        disabled,
        label,
        validator,
    })
}


class UserForm {
    constructor(options = {}) {
        getStaticProps(UserForm).forEach(target => this[target] = constructForm(UserForm, target, options))
    }

    static id = createIdForm({ selector })

    static status = createPropsForm('status')
    static location = createPropsForm('location')
    static condition = createPropsForm('condition')

    static username = createUsernameForm()
    static newUsername = createUsernameForm('new')

    static password = createPasswordForm()
    static createPassword = createPasswordForm('new')
    static confirmPassword = createPasswordForm('confirm')

    static token = createForm({
        selector,
        target: 'token',
        name: 'token',
        maxLength: length.user.token.max,
        contextMenu: true,
        required,
        validator: {
            rule: 'numeric',
            length: { min: length.user.token.min },
        },
    })

    static firstName = createPersonNameForm('first', { selector, group: 'name' })
    static lastName = createPersonNameForm('last', { selector, group: 'name' })
    static alias = createPersonNameForm('alias', { selector, group: 'name' })
    static gender = createGenderForm({ selector })

    static email = createEmailForm({ selector, required })
    static phone = createPhoneForm({ selector })

}

export default UserForm


console.log(UserForm.username.text.input())
console.log(UserForm.newUsername.text.input())
console.log(UserForm.password.text.input())
console.log(UserForm.createPassword.text.input())
console.log(UserForm.confirmPassword.text.input())