import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createPersonNameForm,
    createGenderForm,
    createPhoneForm,
    createEmailForm,
} from './reusable.mjs'

import selector from '../../../client/global/modules/registry/selectors/driver.mjs'
import appSelector from '../../../client/global/modules/registry/selectors/driver.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'


class DriverForm {
    constructor(options = {}) {
        getStaticProps(DriverForm)
            .forEach(target => this[target] = constructForm(DriverForm, target, options))
    }
}


class ApplicationForm {
    constructor(options = {}) {
        getStaticProps(ApplicationForm)
            .forEach(target => this[target] = constructForm(ApplicationForm, target, options))
    }

    static id = createIdForm({ selector: appSelector })
    static delId = createIdForm({ selector: appSelector, target: 'delId' })

    static firstName = createPersonNameForm('first', { selector: appSelector, group: 'name' })
    static middleName = createPersonNameForm('middle', { selector: appSelector, group: 'name' })
    static lastName = createPersonNameForm('last', { selector: appSelector, group: 'name' })
    static suffix = createPersonNameForm('suffix', { selector: appSelector, group: 'name' })

}


export default DriverForm
export { ApplicationForm }