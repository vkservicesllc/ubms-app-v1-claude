import Person from '../../client/global/modules/assets/person.mjs'
import Driver from '../assets/driver.mjs'
import { formLabel, formInput, formSelect } from '../../client/global/modules/assets/html.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'


const {
    class: driverClass,
    id,
    firstNameId,
    middleNameId,
    lastNameId,
    suffixId,
    dobId,
    ssnId,
    phoneId,
    emailId,
    positionId,
} = formSelectors.driver


export class Label {

    static name = (flag, props = {}) => {
        if (![ 'f', 'm', 'l', 's' ].includes(flag)) return

        const content = { f: 'First Name', m: 'Middle Name', l: 'Last Name', s: 'Suffix' }[flag]
        const id = { f: firstNameId, m: middleNameId, l: lastNameId, s: suffixId }[flag]
        const addClass = flag == 'f' || flag == 'l' ? 'required' : null

        return formLabel({
            content,
            ...props,
            for: id,
            addClass,
        })
    }

    static dob = (props = {}) => formLabel({
        content: 'Date of Birth',
        ...props,
        for: dobId,
        addClass: 'required',
    })

    static ssn = (props = {}) => formLabel({
        content: 'Social Security Number',
        ...props,
        for: ssnId,
        addClass: 'required',
    })

    static phone = (props = {}) => formLabel({
        content: 'Phone',
        ...props,
        for: phoneId,
        addClass: 'required',
    })

    static email = (props = {}) => formLabel({
        content: 'Email',
        ...props,
        for: emailId,
        addClass: 'required',
    })

    static position = (props = {}) => formLabel({
        content: 'Desired Position',
        ...props,
        for: positionId,
    })

}


export class Input {

    static name = (flag, props = {}) => {
        if (![ 'f', 'm', 'l', 's' ].includes(flag)) return

        const name = { f: 'firstName', m: 'middleName', l: 'lastName', s: 'suffix' }[flag]
        let type = 'text'

        let id, maxLength, addClass, required
        if (flag != 's') {
            id = { f: firstNameId, m: middleNameId, l: lastNameId }[flag]
            maxLength = inputLength.person[name].max
            addClass = driverClass
            required = !(flag == 'm')
        } else type = 'hidden'

        return formInput({
            ...props,
            type,
            addClass,
            id,
            name,
            maxLength,
            required,
        })
    }

    static dob = (props = {}) => {
        // const { value } = props
        // if (value) props.value = reformatDateString(value, 'us')

        return formInput({
            ...props,
            addClass: driverClass,
            id: dobId,
            name: 'dob',
            required: true,
        })
    }

    static ssn = (props = {}) => {
        //? will think of something on the way

        return formInput({
            ...props,
            addClass: driverClass,
            id: ssnId,
            name: 'ssn',
            required: true,
        })
    }

    static phone = (props = {}) => {
        //? will think of something on the way

        return formInput({
            ...props,
            addClass: driverClass,
            id: phoneId,
            name: 'phone',
            required: true,
        })
    }

    static email = (props = {}) => {
        //? will think of something on the way

        return formInput({
            ...props,
            addClass: driverClass,
            id: emailId,
            name: 'email',
            required: true,
        })
    }

    static position = (props = {}) => formInput({
        ...props,
        type: 'hidden',
        id: positionId,
        name: 'position',
    })

}


export class Select {

    static suffix = (props = {}) => Person.formSelect('suffix', {
        ...props,
        addClass: driverClass,
        id: suffixId,
        name: 'suffix',
    })

    static position = (props = {}) => formSelect({
        ...props,
        addClass: driverClass,
        id: positionId,
        name: 'position',
    }, Driver.positionList, props.options || {})

}