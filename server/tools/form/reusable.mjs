import createForm from './builder.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import patterns from '../../../client/global/modules/registry/patterns.mjs'

export const emptyOpt = '--'

const nameData = {
    prefix: Person.prefixList,
    suffix: Person.suffixList,
}


export const createIdForm = (props = {}) => createForm({
    target: 'id',
    ...props,
    type : 'hidden',
    name: '_id',
    validate: false,
})


export const createPersonNameForm = (flag, props = {}) => {
    let name = flag, type, data, sanitizer
    const required = ['first', 'last'].includes(flag)
    const label = {
        prefix: 'Prefix',
        first: 'First Name',
        alias: 'Alias',
        middle: 'Middle Name',
        last: 'Last Name',
        suffix: 'Suffix',
    }[flag]

    switch (flag) {
        case 'first':
        case 'middle':
        case 'last':
            name += 'Name'
            sanitizer = [
                value => patterns.replace(value, 'name'),
                value => value || null,
            ]
            break
        case 'prefix':
        case 'suffix':
            type = 'select'
            data = nameData[flag]
            break
    }

    return createForm({
        target: name,
        label,
        name,
        ...props,
        type,
        data,
        maxLength: length.person[name].max, //* Ignored when type is 'select'
        required,
        validator: {
            sanitizer,
            length: { min: length.person?.[name]?.min },
        },
    })
}


export const createGenderForm = (props = {}) => createForm({
    target: 'gender',
    name: 'sex',
    label: 'Gender',
    ...props,
    type: 'select/radio',
    data: Person.genderList,
    keys: ['male', 'female'],
    emptyOpt,
    validator: {
        rule: 'boolean',
        sanitizer: value => value === 'M',
    },
})


export const createPhoneForm = (props = {}) => createForm({
    target: 'phone',
    name: 'phone',
    label: 'Phone',
    ...props,
    maxLength: 10,
    validator: {
        rule: 'numeric',
        length: { min: 10 },
    },
})


export const createEmailForm = (props = {}) => createForm({
    target: 'email',
    name: 'email',
    label: 'Email',
    ...props,
    type: 'email',
    maxLength: length.contact.email.max,
    validator: {
        rule: 'email',
    },
})


export const createWebsiteForm = (props = {}) => createForm({
    target: 'website',
    name: 'website',
    label: 'Website',
    ...props,
    type: 'url',
    maxLength: length.web.url.max,
    validator: {
        rule: 'url',
    },
})