import createForm from './builder.mjs'
import Person from '../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import patterns from '../../../client/global/modules/registry/patterns.mjs'
import { capitalizeEach } from '../../../client/global/modules/tools/utils/string.mjs'

export const emptyOpt = '--'
const required = true

const nameData = {
    prefix: Person.prefixList,
    suffix: Person.suffixList,
}

const addrField = (prop, mail) => mail !== null
    ? `${mail ? 'mail' : 'physical'}[${prop}]`
    : prop


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
        maxLength: length.person?.[name]?.max, //* Ignored when type is 'select'
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
    validator: {
        rule: 'numeric',
        length: { min: 10, max: 10 },
    },
})


export const createUsStateForm = (props = {}) => createForm({
    ...props,
    type: 'select',
    data: Address.stateList,
})


export const createAddressForm = (props = {}, options) => {
    const idx = options?.idx || 1
    const mail = options?.mail || null
    const business = options?.business || false

    return createForm({
        target: mail === true ? `mailAddress${idx}` : `address${idx}`,
        group: 'address',
        name: addrField(`address${idx}`, mail),
        required: n === 1,
        label: n === 1
            ? 'Street Address' + (mail === true ? ' / PO Box' : '')
            : business ? 'Suite/Unit' : 'Apt/Unit',
        ...props,
        maxLength: length.address[`address${idx}`].max,
        validator: {
            sanitizer: value => {
                if (!value) return null

                value = capitalizeEach(value)
                value = patterns.replace(value, `addr${idx}`)
                if (idx === 1)
                    value = value.replace(patterns.match.addr2, '').trim()

                return value
            },
        },
    })
}


export const createAddrZipForm = (props = {}, mail = null) => createForm({
    target: mail === true ? 'mailAddrZip' : 'addrZip',
    group: 'address',
    name: addrField('zip', mail),
    required,
    label: 'Zip',
    ...props,
    maxLength: length.address.zip.max,
    validator: {
        rule: 'numeric',
        length: { min: length.address.zip.min },
    },
})


export const createAddrCityForm = (props = {}, mail = null) => createForm({
    target: mail === true ? 'mailAddrCity' : 'addrCity',
    group: 'address',
    name: addrField('city', mail),
    required,
    label: 'City',
    ...props,
    maxLength: length.address.city.max,
    validator: {
        sanitizer: value => {
            if (!value) return null

            value = patterns.replace(value, 'city')

            return value
        },
    },
})


export const createAddrStateForm = (props = {}, mail = null) => createUsStateForm({
    target: mail === true ? 'mailAddrState' : 'addrState',
    group: 'address',
    name: addrField('state', mail),
    required,
    label: 'State',
    ...props,
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


export const createDateForm = (props = {}) => createForm({
    type: 'date',
    ...props,  //* When "min" and/or "max" are supplied, the validator will check as well
    validator: { rule: 'date' },
})


export const createDobForm = (props = {}) => createDateForm({
    target: 'dob',
    name: 'dob',
    label: 'Date of Birth',
    required,
    ...props,
})


export const createSinceForm = (props = {}) => createDateForm({
    target: 'since',
    name: 'since',
    label: 'Effective Date',
    required,
    ...props,
})