import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createSinceForm,
    createWebsiteForm,
    createAddressForm,
    createAddrZipForm,
    createAddrCityForm,
    createAddrStateForm,
    createPhoneForm,
    createEmailForm,
    createPersonNameForm,
    createDobForm,
    createGenderForm,
    createSsnForm,
} from './reusable.mjs'

import Company from '../core/company.mjs'
import companySelector from '../../../client/global/modules/registry/selectors/company.mjs'
import ownerSelector from '../../../client/global/modules/registry/selectors/company-owner.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'
import strip from '../../../client/global/modules/tools/utils/formatter.mjs'

const required = true, disabled = true


const createCategoryForm = (selector, props = {}) => {
    const data = {}
    for (const key in Company.list.category)
        data[key] = Company.list.category[key].item[1]

    //! Temporary
    let { options } = props
    if (!options) options = {}
    options.disabled = ['brk', 'whs', 'shp', 'scl', 'cst' ]

    return createForm({
        selector,
        target: 'category',
        name: 'category',
        emptyOpt,
        required,
        label: 'Category',
        ...props,
        type: 'select',
        data,
        options,
    })
}

const createBusNameForm = (selector, props = {}) => createForm({
    selector,
    target: 'busName',
    name: 'busName',
    required,
    label: 'Business Name',
    ...props,
    maxLength: length.company.busName.max,
})

const createCoTypeForm = (selector, props = {}) => createForm({
    selector,
    target: 'coType',
    name: 'coType',
    emptyOpt,
    required,
    label: 'Type',
    options: { valOpt: true },
    ...props,
    type: 'select',
    data: Company.list.type.full(),
})

const createAliasForm = (confirm = false) => createForm({
    selector: companySelector,
    target: confirm === true ? 'confirmAlias' : 'alias',
    name: 'alias',
    placeholder: confirm === false ? 'Abbr. or short' : null,
    maxLength: length.company.alias.max,
    required,
    label: 'Alias',
    validator: {
        sanitizer: value => value.replace(/[^A-Za-z]/, '').toUpperCase(),
    },
})

const createEinForm = (selector, props = {}) => createForm({
    selector,
    target: 'ein',
    mode: 'numeric',
    name: 'ein',
    required,
    label: {
        content: 'EIN',
        title: 'Employer Identification Number',
    },
    ...props,
    validator: {
        rule: 'numeric',
        sanitizer: value => strip(value),
    },
})


class CompanyForm {
    constructor(options = {}) {
        getStaticProps(CompanyForm)
            .forEach(target => this[target] = constructForm(CompanyForm, target, options))
    }

    static id = createIdForm({ selector: companySelector })
    static deleteId = createIdForm({ selector: companySelector, target: 'deleteId' })
    static category = createCategoryForm(companySelector)
    static since = createSinceForm({
        selector: companySelector,
        label: 'Launch Date',
    })

    static busName = createBusNameForm(companySelector)
    static coType = createCoTypeForm(companySelector)
    static alias = createAliasForm()
    static confirmAlias = createAliasForm(true)
    static ein = createEinForm(companySelector)

    // static ein = createForm({
    //     selector: companySelector,
    //     target: 'ein',
    //     name: 'ein',
    //     required,
    //     label: {
    //         content: 'EIN',
    //         title: 'Employer Identification Number',
    //     },
    //     validator: {
    //         rule: 'numeric',
    //         sanitizer: value => strip(value),
    //     },
    // })

    static duns = createForm({
        selector: companySelector,
        target: 'duns',
        name: 'duns',
        label: {
            content: 'DUNS',
            title: 'Data Universal Numbering System',
        },
        validator: {
            rule: 'numeric',
            sanitizer: value => strip(value),
            length: { min: 9, max: 9 },
        },
    })

    static website = createWebsiteForm({ selector: companySelector })

    static ownership = createForm({
        selector: companySelector,
        target: 'ownership',
        name: '_ownerId',
        type: 'select',
        emptyOpt,
        required,
        label: 'Owner',
        validate: false,
    })

    static address1 = createAddressForm({ selector: companySelector }, { mail: false })

    static address2 = createAddressForm(
        { selector: companySelector },
        { idx: 2, mail: false, business: true }
    )

    static addrZip = createAddrZipForm({ selector: companySelector }, false)
    static addrCity = createAddrCityForm({ selector: companySelector }, false)
    static addrState = createAddrStateForm({ selector: companySelector, options: { valOpt: true } }, false)

    static mailAddress1 = createAddressForm({ selector: companySelector, disabled }, { mail: true })

    static mailAddress2 = createAddressForm(
        { selector: companySelector, disabled },
        { idx: 2, mail: true, business: true }
    )

    static mailAddrZip = createAddrZipForm({ selector: companySelector, disabled }, true)
    static mailAddrCity = createAddrCityForm({ selector: companySelector, disabled }, true)
    static mailAddrState = createAddrStateForm({ selector: companySelector, disabled, options: { valOpt: true } }, true)

    static phone = createPhoneForm({ selector: companySelector, required })
    static fax = createPhoneForm({ selector: companySelector, target: 'fax', name: 'fax', label: 'Fax' })
    static email = createEmailForm({ selector: companySelector})

    static addrSince = createSinceForm({ selector: companySelector, target: 'addrSince' })
    static mailAddrSince = createSinceForm({ selector: companySelector, target: 'mailAddrSince' })
    static phoneSince = createSinceForm({ selector: companySelector, target: 'phoneSince' })
    static faxSince = createSinceForm({ selector: companySelector, target: 'faxSince' })
    static emailSince = createSinceForm({ selector: companySelector, target: 'emailSince' })

}


class OwnerForm {
    constructor(options = {}) {
        getStaticProps(OwnerForm)
            .forEach(target => this[target] = constructForm(OwnerForm, target, options))
    }

    static id = createIdForm({ selector: ownerSelector })
    static modifyId = createIdForm({ selector: ownerSelector, target: 'modifyId' })
    static deleteId = createIdForm({ selector: ownerSelector, target: 'deleteId' })

    static nameSince = createSinceForm({ selector: ownerSelector, target: 'nameSince', required, disabled })
    static firstName = createPersonNameForm('first', { selector: ownerSelector, group: 'name' })
    static middleName = createPersonNameForm('middle', { selector: ownerSelector, group: 'name' })
    static lastName = createPersonNameForm('last', { selector: ownerSelector, group: 'name' })
    static suffix = createPersonNameForm('suffix', { selector: ownerSelector, group: 'name' })

    static gender = createGenderForm({ selector: ownerSelector })
    static dob = createDobForm({ selector: ownerSelector, required })

    static ssn = createSsnForm({
        selector: ownerSelector,
        required: false,
        label: 'SSN <small>(optional but highly recommended)</small>',
    })

    static phone = createPhoneForm({ selector: ownerSelector, required })

}


export default CompanyForm
export { OwnerForm, createCategoryForm, createBusNameForm, createCoTypeForm, createEinForm }