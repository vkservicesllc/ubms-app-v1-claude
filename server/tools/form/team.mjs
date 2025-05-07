import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createPhoneForm,
    createEmailForm,
    createWebsiteForm,
    createAddressForm,
    createAddrZipForm,
    createAddrCityForm,
    createAddrStateForm,
} from './reusable.mjs'
import { createCategoryForm, createBusNameForm, createCoTypeForm } from './company.mjs'

import Team from '../core/team.mjs'
import selector from '../../../client/global/modules/registry/selectors/team.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

const required = true, disabled = true

const crrDeptData = {}
Team.deptList.crr.forEach((name, prop) => crrDeptData[prop] = name)


class TeamForm {
    constructor(options = {}) {
        getStaticProps(TeamForm)
            .forEach(target => this[target] = constructForm(TeamForm, target, options))
    }

    static id = createIdForm({ selector })
    static profileId = createIdForm({ selector, target: 'profileId' })
    static settingsId = createIdForm({ selector, target: 'settingsId' })
    static category = createCategoryForm(selector)

    static crrDept = createForm({
        selector,
        target: 'crrDept',
        group: 'crrDept',
        type: 'select/radio',
        name: 'deptId[]',
        data: crrDeptData,
        keys: ['zero', 'one'],
        required,
        disabled,
        label: 'Department',
    })

    //* "name" can not be used as an own property
    static teamName = createForm({
        selector,
        target: 'name',
        name: 'name',
        maxLength: length.team.name.max,
        required,
        label: 'Name',
        validator: {
            length: { min: length.team.name.min },
            sanitizer: value => value.replace('&amp;', '&').replace('&#x27;', "'"),
        },
    })

    static desc = createForm({
        selector,
        target: 'desc',
        type: 'textarea',
        name: 'description',
        maxLength: length.team.desc.max,
        label: 'Description',
    })

    static busName = createBusNameForm(selector)
    static coType = createCoTypeForm(selector, { emptyOpt })

    static phone = createPhoneForm({ selector, required })
    static email = createEmailForm({ selector })
    static website = createWebsiteForm({ selector })

    static address1 = createAddressForm({ selector })
    static address2 = createAddressForm({ selector }, { idx: 2, business: true })
    static addrZip = createAddrZipForm({ selector })
    static addrCity = createAddrCityForm({ selector })
    static addrState = createAddrStateForm({ selector, emptyOpt, options: { valOpt: true } })

}

export default TeamForm