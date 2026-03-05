import createForm from './builder.mjs'
import Address from '../../../client/global/modules/tools/core/address.us.mjs'
import Individual from '../core/individual.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import patterns from '../../../client/global/modules/registry/patterns.mjs'
import { capitalizeEach } from '../../../client/global/modules/tools/utils/string.mjs'
import strip from '../../../client/global/modules/tools/utils/formatter.mjs'

export const emptyOpt = '--'
const required = true

const nameData = {
    prefix: Individual.list.prefix,
    suffix: Individual.list.suffix,
}

const addrField = (prop, mail) => mail !== null
    ? `${mail ? 'mail' : 'physical'}[${prop}]`
    : prop


export const createIdForm = (props = {}, arr = false) => createForm({
    target: 'id',
    ...props,
    type : 'hidden',
    name: '_id' + (arr ? '[]' : ''),
})


export const createMatchForm = (field, value) => createForm({
    type: 'hidden',
    name: `match[${field}]`,
    value,
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
        emptyOpt,
        options: { valOpt: true },
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
    group: 'gender',
    type: 'select/radio',
    name: 'gender',
    label: 'Gender',
    required,
    ...props,
    data: Individual.list.gender,
    keys: ['male', 'female'],
    emptyOpt,
})


export const createMaritalStatus = (props = {}) => createForm({
    target: 'marital',
    group: 'marital',
    type: 'select/radio',
    name: 'marital',
    label: 'Marital Status',
    ...props,
    data: Individual.list.marital,
    keys: ['single', 'married', 'divorced', 'separated', 'widowed'],
    emptyOpt,
})


export const createPhoneForm = (props = {}) => createForm({
    target: 'phone',
    mode: 'tel',
    name: 'phone',
    label: 'Phone',
    ...props,
    validator: {
        rule: 'numeric',
        length: { min: 10, max: 10 },
        sanitizer: value => strip(value.replace(/^\+\d+\s/, '')),
    },
})


export const createUsStateForm = (props = {}) => createForm({
    emptyOpt,
    ...props,
    type: 'select',
    data: Address.list.state,
})


export const createAddressForm = (props = {}, options) => {
    const idx = options?.idx || 1
    const mail = typeof options?.mail === 'boolean' ? options.mail :  null
    const business = options?.business || false

    return createForm({
        target: mail === true ? `mailAddress${idx}` : `address${idx}`,
        group: 'address',
        name: addrField(`address${idx}`, mail),
        required: idx === 1,
        label: idx === 1
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
    mode: 'numeric',
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
    mode: 'email',
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
    // type: 'url',
    mode: 'url',
    pattern: 'https?://.+|.+\..+',
    maxLength: length.web.url.max,
    validator: {
        rule: 'url',
    },
})


export const createDateForm = (props = {}, optional) => {
    const validator = { rule: 'date' }
    if (props?.required && optional === true)
        validator.optional = true

    return createForm({
        type: 'date',
        mode: 'numeric',
        ...props,  //* When "min" and/or "max" are supplied, the validator will check as well
        validator,
    })
}


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


export const createUntilForm = (props = {}) => createDateForm({
    target: 'until',
    name: 'until',
    label: 'Termination Date',
    required,
    ...props,
})


export const createSsnForm = (props = {}) => createForm({
    target: 'ssn',
    mode: 'numeric',
    name: 'ssn',
    label: 'SSN',
    required,
    ...props,
    validator: {
        rule: 'numeric',
        sanitizer: value => strip(value),
        custom: value => {
            if (/^(\d)\1{8}$/.test(value)) {
                throw new Error('Repeated digits are not allowed in SSN')
            }

            const incrPatt = "01234567890123456789"
            const decrPatt = "98765432109876543210"

            if (incrPatt.includes(value) || decrPatt.includes(value)) {
                throw new Error('Sequential digits are not allowed in SSN')
            }

            return true
        }
    },
})

export const createYesNoForm = (props = {}, optional = false, type = 'radio') => createForm({
    type,
    data: { 'Y': 'Yes', 'N': 'No', '-': null, 'on': undefined },
    required,
    requiredLabel: false,
    ...props,
    keys: ['yes', 'no'],
    validator: {
        sanitizer: value => value !== '-' ? value === 'Y' || value === '1' || value === 'on' : null,
        optional,
    },
})