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
    createPersonNameForm,
    createGenderForm,
    createPhoneForm,
    createEmailForm,
} from './reusable.mjs'

import Company, { Owner } from '../core/company.mjs'
import companySelector from '../../../client/global/modules/registry/selectors/company.mjs'
import ownerSelector from '../../../client/global/modules/registry/selectors/company-owner.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

const required = true, disabled = true


const createCategoryForm = (selector, props = {}) => {
    const data = {}
    for (const key in Company.categoryList)
        data[key] = Company.categoryList[key].item[1]

    //! Temporary
    let { options } = props
    if (!options) options = {}
    options.disabled = ['brk', 'whs', 'shp', 'scl', 'cst' ]

    return createForm({
        selector,
        target: 'category',
        name: 'catId',
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
    required,
    label: 'Type',
    options: { valOpt: true },
    ...props,
    type: 'select',
    data: Company.typeList.full(),
})


class CompanyForm {
    constructor(options = {}) {
        getStaticProps(CompanyForm)
            .forEach(target => this[target] = constructForm(CompanyForm, target, options))
    }

    static id = createIdForm({ selector: companySelector })
    static category = createCategoryForm(companySelector)
    static since = createSinceForm({
        selector: companySelector,
        label: 'Launch Date',
    })

    static busName = createBusNameForm(companySelector)
    static coType = createCoTypeForm(companySelector)

    static alias = createForm({
        selector: companySelector,
        target: 'alias',
        name: 'alias',
        maxLength: length.company.alias.max,
        required,
        label: 'Alias',
    })

    static ein = createForm({
        selector: companySelector,
        target: 'ein',
        name: 'ein',
        required,
        label: {
            content: 'EIN',
            title: 'Employer Identification Number',
        },
        validator: {
            rule: 'numeric',
            sanitizer: value => value.replace(/-/g, ''),
        },
    })

    static duns = createForm({
        selector: companySelector,
        target: 'duns',
        name: 'duns',
        required,
        label: {
            content: 'DUNS',
            title: 'Data Universal Numbering System',
        },
        validator: {
            rule: 'numeric',
            sanitizer: value => value.replace(/-/g, ''),
            length: { min: 9, max: 9 },
        },
    })

    static website = createWebsiteForm({ selector: companySelector })

    static ownership = createForm({
        selector: companySelector,
        target: 'ownership',
        name: 'ownerId',
        type: 'select',
        emptyOpt,
        required,
        validate: false,
    })

    static address1 = createAddressForm({ selector: companySelector }, { mail: false })

    static address2 = createAddressForm(
        { selector: companySelector },
        { idx: 2, mail: false, business: true }
    )

    static addrZip = createAddrZipForm({ selector: companySelector }, false)
    static addrCity = createAddrCityForm({ selector: companySelector }, false)
    static addrState = createAddrStateForm({ selector: companySelector }, false)

    static mailAddress1 = createAddressForm({ selector: companySelector }, { mail: true })

    static mailAddress2 = createAddressForm(
        { selector: companySelector },
        { idx: 2, mail: true, business: true }
    )

    static mailAddrZip = createAddrZipForm({ selector: companySelector }, true)
    static mailAddrCity = createAddrCityForm({ selector: companySelector }, true)
    static mailAddrState = createAddrStateForm({ selector: companySelector }, true)

    static phone = createPhoneForm({ selector: companySelector, required })
    static fax = createPhoneForm({ selector: companySelector, target: 'fax', name: 'fax', label: 'Fax' })
    static email = createEmailForm({ selector: companySelector})

}


class OwnerForm {
    constructor(options = {}) {
        getStaticProps(OwnerForm)
            .forEach(target => this[target] = constructForm(OwnerForm, target, options))
    }

    static id = createIdForm({ selector: ownerSelector })

}


export default CompanyForm
export { OwnerForm, createCategoryForm, createBusNameForm, createCoTypeForm }