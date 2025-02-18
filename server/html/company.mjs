import Person from '../../client/global/modules/assets/person.mjs'
import { formLabel, formInput, formSelect } from '../../client/global/modules/assets/html.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'
import { sortObjectByValue } from '../../client/global/modules/tools/sorter.mjs'
import { reformatDateString } from '../../client/global/modules/tools/date.mjs'

import Company, { Owner } from '../assets/company.mjs'


const { id, busNameId, coTypeId, aliasId, websiteId, einId, dunsId, sinceId, catId, ownershipId } = formSelectors.company
const {
    id: ownerId,
    class: ownerClass,
    updateSinceId,
    firstNameId,
    middleNameId,
    lastNameId,
    suffixId,
    dobId,
    ssnId,
    genderId
} = formSelectors.owner


export class Label {

    static busName = (props = {}) => formLabel({
        content: 'Business Name',
        ...props,
        for: busNameId,
        addClass: 'required',
    })

    static coType = (props = {}) => formLabel({
        content: 'Type',
        ...props,
        for: coTypeId,
        addClass: 'required',
    })

    static alias = (props = {}) => formLabel({
        content: 'Alias',
        ...props,
        for: aliasId,
        addClass: 'required',
    })

    static ein = (props = {}) => formLabel({
        content: 'EIN',
        title: 'Employer Identification Number',
        ...props,
        for: einId,
        addClass: 'required',
    })

    static duns = (props = {}) => formLabel({
        content: 'DUNS',
        title: 'Data Universal Numbering System',
        ...props,
        for: dunsId,
    })

    static since = (props = {}) => formLabel({
        content: 'Launch Date',
        ...props,
        for: sinceId,
        addClass: 'required',
    })

    static catId = (props = {}) => formLabel({
        content: 'Category',
        for: catId,
        ...props,
        addClass: 'required',
    })

    static website = (props = {}) => formLabel({
        content: 'Website',
        for: websiteId,
        ...props,
    })

    static ownership = (props = {}) => formLabel({
        content: 'Owner',
        ...props,
        for: ownershipId,
        addClass: 'required',
    })

    static ownerUpdateSince = (props = {}) => formLabel({
        content: 'Name Changed on',
        ...props,
        for: updateSinceId,
        addClass: 'required',
    })

    static ownerName = (flag, props = {}) => {
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

    static ownerGender = (props = {}) => formLabel({
        content: 'Gender',
        ...props,
        for: genderId,
    })

    static ownerDob = (props = {}) => formLabel({
        content: 'Date of Birth',
        ...props,
        for: dobId,
        addClass: 'required',
    })

    static ownerSsn = (props = {}) => formLabel({
        content: 'SSN <small>(optional but highly recommended)</small>',
        ...props,
        for: ssnId,
    })

}


export class Input {

    static id = (value = null, props = {}) => formInput({
        type: 'hidden',
        id,
        ...props,
        name: '_id',
        value,
    })

    static since = (props = {}, current = false) => {
        let type = 'text', id = sinceId, name, required = true
        if (current === true) {
            type = 'hidden'
            id = `current-${id}`
            required = false
        } else {
            const { value } = props
            if (value) props.value = reformatDateString(value, 'us')
            name = 'since'
        }

        return formInput({
            ...props,
            type,
            id,
            name,
            required,
        })
    }

    static busName = (props = {}, current = false) => {
        const type = current === true ? 'hidden' : 'text'
        let id = busNameId, name, maxLength
        if (current === true) id = `current-${id}`
        else {
            name = 'busName'
            maxLength = inputLength.company.busName.max
        }

        return formInput({
            ...props,
            type,
            id,
            name,
            maxLength,
            required: current === false,
        })
    }

    static coType = (props = {}) => formInput({
        ...props,
        type: 'hidden',
        id: `current-${coTypeId}`,
    })

    static alias = (props = {}, current = false) => {
        const type = current === true ? 'hidden' : 'text'
        let id = aliasId, name, maxLength
        if (current === true) id = `current-${id}`
        else {
            name = 'alias'
            maxLength = inputLength.company.alias.max
        }

        return formInput({
            id,
            ...props,
            type,
            name,
            maxLength,
            required: current === false,
        })
    }

    static website = (props = {}) => formInput({
        ...props,
        // type: 'url',
        id: websiteId,
        name: 'website',
        maxLength: inputLength.web.url.max,
    })

    static ein = (props = {}, current = false) => {
        const type = current === true ? 'hidden' : 'text'
        let id = einId, name
        if (current === true) id = `current-${id}`
        if (current === false) name = 'ein'

        return formInput({
            ...props,
            type,
            id,
            name,
            required: current === false,
        })
    }

    static duns = (props = {}, current = false) => {
        const type = current === true ? 'hidden' : 'text'
        let id = dunsId, name
        if (current === true) id = `current-${id}`
        if (current === false) name = 'duns'

        return formInput({
            ...props,
            type,
            id,
            name,
        })
    }

    static ownership = (props = {}) => formInput({
        ...props,
        type: 'hidden',
        id: `current-${ownershipId}`,
    })

    static ownerId = (props = {}) => formInput({
        id: ownerId,
        ...props,
        type: 'hidden',
        addClass: ownerClass,
        name: '_id',
    })

    static ownerUpdateSince = (props = {}, current = false) => { // may not need current
        let type = 'text', id = updateSinceId, name, max, required = true
        if (current === true) {
            type = 'hidden'
            id = `current-${id}`
            required = false
        }
        else {
            const { value } = props
            if (value) props.value = reformatDateString(value, 'us')
            name = 'since'
        }

        return formInput({
            ...props,
            type,
            addClass: ownerClass,
            id,
            name,
            required,
            disabled: true,
        })
    }

    static ownerName = (flag, props = {}) => {
        if (![ 'f', 'm', 'l' ].includes(flag)) return

        const id = { f: firstNameId, m: middleNameId, l: lastNameId }[flag]
        const name = { f: 'firstName', m: 'middleName', l: 'lastName' }[flag]
        const maxLength = inputLength.person[name].max
        const required = !(flag == 'm')

        return formInput({
            ...props,
            addClass: ownerClass,
            id,
            name,
            maxLength,
            required,
        })
    }

    static ownerDob = (props = {}) => {
        const { value } = props
        if (value) props.value = reformatDateString(value, 'us')

        return formInput({
            ...props,
            addClass: ownerClass,
            id: dobId,
            name: 'dob',
            required: true,
        })
    }

    static ownerSsn = (props = {}, current = false) => {
        const type = current === true ? 'hidden' : 'text'
        let id = ssnId
        if (current === true) id = `current-${id}`
        let name
        if (current === false) name = 'ssn'

        return formInput({
            ...props,
            type,
            addClass: ownerClass,
            id,
            name,
        })
    }

}


export class Select {

    static coType = (props = {}) => {
        const list = Company.typeList
        let { branch, options } = props
        if (!branch) branch = 'list'
        if (!options) options = {}
        if (!options.emptyOpt) options.emptyOpt = ''
        let data = {}

        switch (branch) {
            case 'full':
                data = list
                break
            case 'list':
                for (let category in list)
                    for (let abbr in list[category])
                        data[abbr] = list[category][abbr]
                options.order = 1
                options.valOpt = true
                break
        }

        return formSelect({
            ...props,
            id: coTypeId,
            name: 'coType',
            required: true,
        }, data, options)
    }

    static catId = (props = {}) => {
        const list = Company.categoryList
        let { options } = props
        if (!options) options = {}
        if (!options.emptyOpt) options.emptyOpt = ''
        let data = {}

        for (const key in list)
            data[key] = list[key].item[1]

        /* Temporary */
        options.disabled = ['brk', 'whs', 'shp', 'scl', 'cst' ]

        return formSelect({
            id: catId,
            ...props,
            name: 'catId',
            required: true,
        }, data, options)
    }

    static ownership = async (props = {}) => {
        const rows = await Owner.list({ branch: 'admin', user: { DS: true } })
        const names = []
        rows.map(owner => names.push(owner.fullName()))
        let dublicates = names.filter((name, i) => names.indexOf(name) !== i)
        dublicates = [ ...new Set(dublicates) ]

        let data = {}
        rows.forEach((owner, i) => data[owner._id] = names[i] + (dublicates.includes(names[i]) ? ` (${owner.age})` : ''))
        data = sortObjectByValue(data)

        let { options } = props
        if (!options) options = {}

        return formSelect({
            ...props,
            id: ownershipId,
            name: '_ownerId',
            required: true,
        }, data, options)
    }

    static ownerSuffix = (props) => Person.formSelect('suffix', {
        ...props,
        addClass: ownerClass,
        id: suffixId,
        name: 'suffix',
    })

    static ownerGender = (props) => Person.formSelect('gender', {
        ...props,
        addClass: ownerClass,
        id: genderId,
        name: 'sex',
    })

}