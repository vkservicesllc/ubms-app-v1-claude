import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createPersonNameForm,
    createGenderForm,
    createPhoneForm,
    createEmailForm,
} from './reusable.mjs'

import User from '../core/user.mjs'
import selector from '../../../client/global/modules/registry/selectors/user.mjs'
import roleSelector from '../../../client/global/modules/registry/selectors/user-role.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'
import { capitalizeFirst } from '../../../client/global/modules/tools/utils/string.mjs'

const required = true, disabled = true
const statusList = { ...User.statusList }
delete statusList['D']

const propsData = {
    status: statusList,
    location: User.locationList,
    condition: User.conditionList,
}

const conditionKeys = ['active', 'inactive', 'locked']


const createPropsForm = (flag, props = {}) => createForm({
    selector,
    target: flag,
    group: flag,
    ...props,
    type: flag === 'condition' ? 'select/radio' : 'select',
    name: flag,
    data: propsData[flag],
    emptyOpt: flag !== 'condition' ? emptyOpt : null,
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

const createRoleNameForm = target => createForm({
    selector: roleSelector,
    target,
    name: 'name',
    maxLength: length.user.roleName.max,
    required,
    label: 'Role Name',
    validator: {
        sanitizer: value => value.replace('&amp;', '&').replace('&#x27;', "'"),
    },
})

const createRoleLocationForm = target => createForm({
    selector: roleSelector,
    target,
    type: 'select',
    name: 'location',
    data: propsData.location,
    emptyOpt: 'All',
    label: 'Location',
})


class UserForm {
    constructor(options = {}) {
        getStaticProps(UserForm)
            .forEach(target => this[target] = constructForm(UserForm, target, options))
    }

    static id = createIdForm({ selector })
    static modifyId = createIdForm({ selector, target: 'modifyId' })
    static deleteId = createIdForm({ selector, target: 'deleteId' })

    static hiddenUsername = createForm({
        selector,
        target: 'username',
        type: 'hidden',
    })

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
        label: 'Token',
        validator: {
            rule: 'numeric',
            length: { min: length.user.token.min },
        },
    })

    static firstName = createPersonNameForm('first', { selector, group: 'name', label: 'Real First Name' })
    static lastName = createPersonNameForm('last', { selector, group: 'name' })
    static alias = createPersonNameForm('alias', { selector, group: 'name' })
    static gender = createGenderForm({ selector })

    static email = createEmailForm({ selector, required })
    static phone = createPhoneForm({ selector, label: 'US Cell Phone' })

}


class RoleForm {
    constructor(options = {}) {
        getStaticProps(RoleForm)
            .forEach(target => this[target] = constructForm(RoleForm, target, options))
    }

    static roleId = createIdForm({ selector: roleSelector, target: 'roleId' })
    static carrierRoleId = createIdForm({ selector: roleSelector, target: 'carrierRoleId' })

    static roleName = createRoleNameForm('roleName')
    static carrierRoleName = createRoleNameForm('carrierRoleName')

    static roleLocation = createRoleLocationForm('roleLocation')
    static carrierRoleLocation = createRoleLocationForm('carrierRoleLocation')

}


export default UserForm
export { RoleForm }