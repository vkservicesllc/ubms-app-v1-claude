import { body } from 'express-validator'
import length from '../../../client/global/modules/registry/length.mjs'
import patterns from '../../../client/global/modules/registry/patterns.mjs'
import { formLabel, formInput, formTextArea, formSelect, formRadio, formCheckbox } from '../../../client/global/modules/tools/utils/html/form.mjs'

const types = ['hidden', 'text', 'textarea', 'select', 'radio', 'checkbox', 'select/radio', 'select/checkbox']
const valueTypes = ['hidden', 'text', 'select']
const redundantInputProps = ['type', 'label', 'selector', 'target', 'group', 'data', 'keys', 'defaultClass', 'id', 'name', 'required']
const lockedLabelProps = ['defaultClass', 'for']


const createForm = (input = {}) => {
    const { selector, target, group, data, keys, defaultClass, id, required } = input
    let { type, label, name, validator } = input

    const form = {}
    const lockedInput = {}, lockedLabel = {}

    redundantInputProps.forEach(prop => delete input[prop])
    if (!type || !types.includes(type)) type = 'text'
    if (type === 'select/radio') input.multiple = false
    if (type === 'select/checkbox') input.multiple = true
    if (name && (input.multiple === true || (type === 'checkbox' && data)))
        name += '[]'

    const initializeInput = (type, key, i) => {
        if (!key) lockedInput[type] = { defaultClass, id, name, required }
        else {
            if (!lockedInput[type]) lockedInput[type] = {}

            lockedInput[type][key] = { defaultClass, id, name, required }
            if (required && i) lockedInput[type][key].required = false
        }

        if (selector && target) {
            if (!defaultClass) lockedInput[type].defaultClass = []
            else if (typeof defaultClass === 'string')
                lockedInput[type].defaultClass = [ defaultClass ]

            //! ATTN
            //? Think about global class if input has customizable value
            if (valueTypes.includes(type))
                lockedInput[type].defaultClass.push(selector.class.global)

            if (type === 'hidden') lockedInput[type].defaultClass.push(selector.class.hidden)
            else {
                if (group && selector.class?.combo?.[group])
                    lockedInput[type].defaultClass.push(selector.class.combo[group])
                if (group && selector.class?.[type]?.[group])
                    lockedInput[type].defaultClass.push(selector.class[type][group])
                if (selector.class?.[type]?.[target])
                    lockedInput[type].defaultClass.push(selector.class[type][target])
            }

            if (valueTypes.includes(type) || (type === 'checkbox' && !input.multiple))
                if (selector.id)
                    lockedInput[type].id = selector.id[type][target]
            if (key) {
                if (selector.id?.[type]?.[target]?.[key])
                    lockedInput[type][key].id = selector.id[type][target][key]
            }
        } else if (key) {
            if (id) lockedInput[type][key].id = `${id}-${key}`
        }
    }

    const initializeLabel = (type, key) => {
        if (type === 'hidden') return

        if (!lockedLabel[type]) lockedLabel[type] = {}

        if (!key) {
            if (label) {
                if (typeof label === 'string') label = { content: label }
                lockedLabelProps.forEach(prop => lockedLabel[type][prop] = label[prop] )

                if (type !== 'radio' && !(type === 'checkbox' && data) && lockedInput[type].id)
                    lockedLabel[type].for = lockedInput[type].id

                if (required) {
                    const { defaultClass } = lockedLabel[type]
                    if (typeof defaultClass === 'string')
                        lockedLabel[type].defaultClass = [ defaultClass ]
                    else if (!Array.isArray(defaultClass))
                        lockedLabel[type].defaultClass = []

                    lockedLabel[type].defaultClass.push('input-required')
                }
            }
        } else {
            lockedLabel[type][key] = {}

            if (lockedInput[type]?.[key]?.id)
                lockedLabel[type][key].for = lockedInput[type][key].id
        }
    }

    if (['hidden', 'text', 'textarea', 'password', 'email', 'url'].includes(type)) {
        let formTextInput = formInput
        
        if (type === 'textarea') {
            type = 'text'
            formTextInput = formTextArea
        }

        form[type] = {}
        initializeInput(type)
        initializeLabel(type)
        if (type !== 'textarea') lockedInput[type].type = type

        form[type].input = props => formTextInput({ ...input, ...props, ...lockedInput[type] })
        form[type].label = label
            ? props => formLabel({ ...label, ...props, ...lockedLabel[type] })
            : () => ''
    }

    if (type.includes('select')) {
        form.select = {}
        initializeInput('select')
        initializeLabel('select')

        form.select.input = props => {
            const options = props?.options || input.options || {}

            return formSelect({ ...input, ...props, ...lockedInput.select }, data || {}, options)
        }

        form.select.label = label
            ? props => formLabel({ ...label, ...props, ...lockedLabel.select })
            : () => ''
    }

    if (type.includes('radio') && data) {
        form.radio = {}

        const dataKeys = Object.keys(data)
        const propKeys = keys || dataKeys

        propKeys.forEach((key, i) => {
            form.radio[key] = {}
            initializeInput('radio', key, i)
            initializeLabel('radio', key)

            lockedInput.radio[key].value = dataKeys[i]
            lockedLabel.radio[key].content = data[dataKeys[i]]

            form.radio[key].input = props => formRadio({ ...input, ...props, ...lockedInput.radio[key] })
            form.radio[key].label = () => formLabel(lockedLabel.radio[key])
        })

        initializeLabel('radio')
        form.radio.label = label
            ? (props) => formLabel({ ...label, ...props, ...lockedLabel.radio })
            : () => ''
    }

    if (type.includes('checkbox')) {
        form.checkbox = {}

        if (data) {
            const dataKeys = Object.keys(data)
            const propKeys = keys || dataKeys

            propKeys.forEach((key, i) => {
                form.checkbox[key] = {}
                initializeInput('checkbox', key, i)
                initializeLabel('checkbox', key)

                lockedInput.checkbox[key].value = dataKeys[i]
                lockedLabel.checkbox[key].content = data[dataKeys[i]]

                form.checkbox[key].input = props => formCheckbox({ ...input, ...props, ...lockedInput.checkbox[key] })
                form.checkbox[key].label = () => formLabel(lockedLabel.checkbox[key])
            })
        } else {
            initializeInput('checkbox')

            form.checkbox.input = props => formCheckbox({ ...input, ...props, ...lockedInput.checkbox})
        }

        initializeLabel('checkbox')
        form.checkbox.label = label
            ? (props) => formLabel({ ...label, ...props, ...lockedLabel.checkbox })
            : () => ''
    }

    if (validator !== false) form.validate = () => {
        let chain = body(name).trim()

        if (required)
            chain = chain
                .notEmpty()
                .withMessage(`"${name}" field can not be empty`)
        else chain = chain.optional({ nullable: true })

        if (typeof validator === 'object') {
            const { caps, sanitizer, rule, length, custom } = validator

            if (data) {
                const values = Object.keys(data)

                chain = chain
                    .isIn(values)
                    .withMessage(`Incorrect value provided in "${name}"`)
            }

            if (caps === true)
                chain = customSanitizer(value => value.toUpperCase())

            if (sanitizer) {
                const sanitizers = Array.isArray(sanitizer) ? sanitizer : [ sanitizer ]

                for (const fn of sanitizers)
                    if (typeof fn === 'function')
                        chain = chain.customSanitizer(fn)
            }

            switch (rule) {

                case 'date':
                    chain = chain
                        .customSanitizer(date => {
                            if (!date) return null

                            return moment(date, [
                                "YYYY-MM-DD",
                                "MM/DD/YYYY",
                                "MMM D, YYYY",
                            ], true).format('YYYY-MM-DD')
                        })
                        .isDate()
                        .withMessage(`"${name}" must be a valid date`)
                        .matches(/^\d{4}-\d{2}-\d{2}$/)
                        .withMessage(`Invalid date format provided in "${name}"`)
                    break

                case 'numeric':
                    chain = chain
                        .isNumeric()
                        .withMessage(`"${name}" field must be numeric`)
                    break

                case 'alphanumeric':
                    chain = chain
                        .isAlphanumeric()
                        .withMessage(`"${name}" field must be alphanumeric`)
                    break

                case 'boolean':
                    chain = chain
                        .customSanitizer(value => {
                            if (value === '1' || value === 1) return true
                            if (value === '0' || value === 0) return false

                            return value
                        })
                        .isBoolean()
                        .withMessage(`"${name}" must be of boolean type`)
                    break

            }

            if (typeof custom === 'function')
                chain = chain.custom(custom)

            if (length) {
                const { min } = length
                const max = length.max || input.maxLength
                
                if (max) {
                    let message = `"${name}" must `
                    if (min) message += `be between ${min} and ${max} characters long`
                    else message += ` not exceed ${max} characters in length`

                    chain = chain
                        .isLength({ min, max })
                        .withMessage(message)
                }
            }

        }

        return chain
    }

    return form
}

export default createForm


export const constructForm = (Src, target, options) => {
    const form = {}

    const hiddenOpts = options?.[target]?.hidden
    const textOpts = options?.[target]?.text
    const selectOpts = options?.[target]?.select
    const radioOpts = options?.[target]?.radio
    const checkboxOpts = options?.[target]?.checkbox
    const { hidden, text, select, radio, checkbox } = Src[target]

    if (hidden)
        form.hidden = {
            input: hidden.input(hiddenOpts?.input),
        }

    if (text)
        form.text = {
            label: text.label(textOpts?.label),
            input: text.input(textOpts?.input),
        }

    if (select)
        form.select = {
            label: select.label(selectOpts?.label),
            input: select.input(selectOpts?.input),
        }

    if (radio) {
        const keys = Object.keys(radio).filter(key => key !== 'label')

        if (keys) {
            form.radio = { label: radio.label(radioOpts?.label) }

            keys.forEach(key => {
                form.radio[key] = {}
        
                form.radio[key].label = radio[key].label(radioOpts?.[key]?.label)
                form.radio[key].input = radio[key].input(radioOpts?.[key]?.input)
            })
        }
    }

    if (checkbox) {
        form.checkbox = { label: checkbox.label(checkboxOpts?.label) }

        const keys = Object.keys(checkbox).filter(key => key !== 'label' && key !== 'input')

        if (!keys.length) form.checkbox.input = checkbox.input(checkboxOpts?.input)
        else
            keys.forEach(key => {
                form.checkbox[key] = {}

                form.checkbox[key].label = checkbox[key].label(checkboxOpts?.[key]?.label)
                form.checkbox[key].input = checkbox[key].input(checkboxOpts?.[key]?.input)
            })
    }

    return form
}


export const emptyOpt = '--'

const nameData = {
    prefix: { 'Mr': 'Mr', 'Mrs': 'Mrs', 'Ms': 'Ms' },
    suffix: { 'Jr': 'Jr', 'Sr': 'Sr', 'II': 'II', 'III': 'III' }
}


export const createIdForm = (props = {}) => createForm({
    target: 'id',
    ...props,
    type : 'hidden',
    name: '_id',
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
    data: { 'M': 'Male', 'F': 'Female' },
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
        //! add more
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