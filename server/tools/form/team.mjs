import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createPhoneForm,
    createEmailForm,
    createWebsiteForm,
} from './reusable.mjs'
import { createCategoryForm, createBusNameForm, createCoTypeForm } from './company.mjs'

import selector from '../../../client/global/modules/registry/selectors/team.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

const required = true, disabled = true


class TeamForm {
    constructor(options = {}) {
        getStaticProps(TeamForm)
            .forEach(target => this[target] = constructForm(TeamForm, target, options))
    }

    static id = createIdForm({ selector })
    static profileId = createIdForm({ selector, target: 'profileId' })
    static category = createCategoryForm(selector)

    //* "name" can not be used as an own property
    static teamName = createForm({
        selector,
        target: 'name',
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

}

export default TeamForm