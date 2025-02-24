import User from '../assets/user.mjs'
import { formLabel, formInput, formSelect, button } from '../../client/global/modules/assets/html.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'


const {
    class: userClass,
    id, idClass,
    userId,
    passId, newPassId, confPassId,
    tokenId,
    firstNameId, lastNameId, aliasId, nameClass,
    emailId,
    phoneId,
    genderId, genderClass,
    statusId, locationId, conditionId, conditionClass,
    signInButtonId, signUpButtonId, authButtonId,
    roleId, roleNameId, roleLocationId,
    carrierRoleId, carrierRoleNameId, carrierRoleLocationId,
} = formSelectors.user


export class Label {

    static username = (props = {}) => formLabel({
        content: 'Username',
        ...props,
        for: userId,
    })

    static password = (props = {}) => {
        let action = '', id = passId
        const { purpose, content } = props

        switch (purpose) {
            case 'new':
                action = 'Create '
                id = newPassId
                break
            case 'repeat':
                action = 'Confirm '
                id = confPassId
                break
        }

        return formLabel({
            content: content || `${action}Password`,
            ...props,
            for: id,
        })
    }

    static firstName = (props = {}) => formLabel({
        content: 'Real First Name',
        ...props,
        addClass: 'required',
        for: firstNameId,
    })

    static lastName = (props = {}) => formLabel({
        content: 'Last Name',
        ...props,
        addClass: 'required',
        for: lastNameId,
    })

    static alias = (props = {}) => formLabel({
        content: 'Alias',
        ...props,
        for: aliasId,
    })

    static email = (props = {}) => formLabel({
        content: 'Email',
        ...props,
        addClass: 'required',
        for: emailId,
    })
    
    static phone = (props = {}) => formLabel({
        content: 'US Cell Phone',
        ...props,
        for: phoneId,
    })

    static status = (props = {}) => formLabel({
        content: 'Status',
        ...props,
        addClass: 'required',
        for: statusId,
    })

    static location = (props = {}) => formLabel({
        content: 'Location',
        ...props,
        addClass: 'required',
        for: locationId,
    })

    static gender = (props = {}) => formLabel({
        content: 'Gender',
        ...props,
    })

    static roleName = (props = {}) => {
        const { target } = props
        let id = roleNameId

        switch (target) {
            case 'crr':
                id = carrierRoleNameId
                break
        }

        return formLabel({
            content: 'Role Name',
            ...props,
            addClass: 'required',
            for: id,
        })
    }

    static roleLocation = (props = {}) => {
        const { target } = props
        let id = roleLocationId

        switch (target) {
            case 'crr':
                id = carrierRoleLocationId
                break
        }

        return formLabel({
            content: 'Location',
            ...props,
            for: id,
        })
    }

}


export class Input {

    static id = (value = null, multiple = false) => formInput({
        type: 'hidden',
        addClass: idClass,
        id: !multiple ? id : null, // can be set to null, if using many user ids on the page, e.g. in modals
        name: '_id',
        value,
    })

    static username = (props = {}) => {
        const { type } = props

        if (type == 'hidden')
            props = {
                ...props,
                id: `${userId}-hidden`,
                name: null,
            }

        else props = {
            disabled: true,
            ...props,
            id: userId,
            addClass: userClass,
            name: 'username',
            maxLength: inputLength.user.username.max,
            autoComplete: 'off',
            required: true,
        }

        return formInput(props)
    }

    static password = (props = {}) => {
        let name, id = passId, autoComplete = "off"
        const { purpose, disabled } = props

        if (!purpose) name = 'password'
        else if (purpose == 'new') {
            id = newPassId
            name = 'password'
            autoComplete = 'new-password'
        } else if (purpose == 'repeat')
            id = confPassId

        return formInput({
            ...props,
            type: 'password',
            addClass: userClass,
            id,
            name,
            maxLength: inputLength.user.password.max,
            contextMenu: false,
            autoComplete,
            required: true,
            disabled: typeof disabled == 'boolean' ? disabled : true,
        })
    }

    static token = (props = {}) => formInput({
        ...props,
        id: tokenId,
        name: 'token',
        maxLength: inputLength.user.token.max,
        contextMenu: true,
        required: true,
    })

    static firstName = (props = {}) => formInput({
        ...props,
        addClass: nameClass,
        id: firstNameId,
        name: 'firstName',
        maxLength: inputLength.person.firstName.max,
        required: true,
    })

    static lastName = (props = {}) => formInput({
        ...props,
        addClass: nameClass,
        id: lastNameId,
        name: 'lastName',
        maxLength: inputLength.person.lastName.max,
        required: true,
    })

    static alias = (props = {}) => formInput({
        ...props,
        addClass: nameClass,
        id: aliasId,
        name: 'alias',
        maxLength: inputLength.person.alias.max,
    })

    static gender = (sex, props = {}) => {
        if (sex) sex = sex.toLowerCase()
        if (sex != 'm' && sex != 'f') return

        return formInput({
            ...props,
            type: 'radio',
            addClass: genderClass,
            id: genderId + '-' + sex,
            name: 'sex',
            value: sex == 'm' ? '1' : '0',
        })
    }

    static condition = (props = {}) => {
        let { value } = props
        if (!value || !Object.keys(User.conditionList)) value = 'A'

        const disabled = value == 'L'

        return formInput({
            ...props,
            type: 'radio',
            addClass: conditionClass,
            id: conditionId + '-' + value.toLowerCase(),
            name: 'condition',
            value,
            disabled,
        })
    }

    static email = (props = {}) => {
        const { type } = props

        if (type == 'hidden')
            props = {
                ...props,
                id: `${emailId}-hidden`,
                name: null,
            }

        else props = {
            ...props,
            type: 'email',
            id: emailId,
            name: 'email',
            maxLength: 50,
            required: true,
        }

        return formInput(props)
    }

    static phone = (props = {}) => formInput({
        ...props,
        type: 'tel',
        id: phoneId,
        name: 'phone',
    })

    static roleId = (props = {}) => {
        const { target } = props
        let id = roleId

        switch (target) {
            case 'crr':
                id = carrierRoleId
                break
        }

        return formInput({
            id,
            ...props,
            type: 'hidden',
            name: '_id',
        })
    }

    static roleName = (props = {}) => {
        const { target } = props
        let id = roleNameId

        switch (target) {
            case 'crr':
                id = carrierRoleNameId
                break
        }

        return formInput({
            ...props,
            id,
            name: 'name',
            maxLength: inputLength.user.roleName.max,
            required: true,
        })
    }

}


export class Select {

    static status = (user, props = {}) => {
        if (!user) return

        let { options } = props
        if (!options) options = {}

        const data = { ...User.statusList }
        delete data.D

        if (!user.DS || user.location[0] != 'US')
            delete data.S

        return formSelect({
            ...props,
            id: statusId,
            name: 'status',
            required: true,
        }, data, options)
    }

    static location = (user, props = {}) => {
        if (!user) return

        let { emptyOpt } = props
        if (!emptyOpt) emptyOpt = '--'

        let { options } = props
        if (!options) options = {}
        options.emptyOpt = emptyOpt

        const data = { ...User.locationList }

        if (!user.DS && user.location[0] != 'US') {
            for (const code in data) {
                if (user.location[0] == code) continue

                delete data[code]
            }

            options.emptyOpt = null
        }

        return formSelect({
            ...props,
            id: locationId,
            name: 'location',
            required: true,
        }, data, options)
    }


    static roleLocation = (props = {}) => {
        const { target } = props
        let id = roleLocationId

        switch (target) {
            case 'crr':
                id = carrierRoleLocationId
                break
        }

        let { emptyOpt, options } = props
        if (!emptyOpt) emptyOpt = 'All'
        if (!options) options = {}
        options.emptyOpt = emptyOpt

        const data = { ...User.locationList }

        return formSelect({
            ...props,
            id,
            name: 'location',
            required: false,
        }, data, options)
    }

}


export class Button {

    static login = (props = {}) => button({
        content: 'Sign in',
        ...props,
        type: 'submit',
        addClass: userClass,
        id: signInButtonId,
        disabled: true,
    })

    static register = (props = {}) => button({
        content: 'Sign up',
        ...props,
        type: 'submit',
        addClass: userClass,
        id: signUpButtonId,
        disabled: true,
    })

    static authenticate = (props = {}) => button({
        content: 'Authenticate',
        ...props,
        type: 'submit',
        id: authButtonId,
    })

}