import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    // createPersonNameForm,
    // createGenderForm,
    // createPhoneForm,
    // createEmailForm,
} from './reusable.mjs'

import Company from '../core/company.mjs'
import selector from '../../../client/global/modules/registry/selectors/company.mjs'
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

    static id = createIdForm({ selector })
    static category = createCategoryForm(selector)

    static busName = createBusNameForm(selector)
    static coType = createCoTypeForm(selector)

    static ownership = createForm() //! must be async/await

}


class OwnerForm {
    constructor(options = {}) {
        getStaticProps(OwnerForm)
            .forEach(target => this[target] = constructForm(OwnerForm, target, options))
    }
}


export default CompanyForm
export { OwnerForm, createCategoryForm, createBusNameForm, createCoTypeForm }