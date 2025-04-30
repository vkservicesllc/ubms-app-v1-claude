import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createPersonNameForm,
    createDobForm,
    createSsnForm,
    createGenderForm,
    createPhoneForm,
    createEmailForm,
    createAddressForm,
    createAddrZipForm,
    createAddrCityForm,
    createAddrStateForm,
} from './reusable.mjs'

import selector from '../../../client/global/modules/registry/selectors/driver.mjs'
import appSelector from '../../../client/global/modules/registry/selectors/driver-application.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

const required = true


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
    static deleteId = createIdForm({ selector: appSelector, target: 'deleteId' })

    static pin = createForm({
        selector: appSelector,
        target: 'pin',
        type: 'password',
        name: 'pin',
        maxLength: 4,
        required: true,
        disabled: true,
        label: 'PIN',
    })

    static firstName = createPersonNameForm('first', { selector: appSelector, group: 'name' })
    static middleName = createPersonNameForm('middle', { selector: appSelector, group: 'name' })
    static lastName = createPersonNameForm('last', { selector: appSelector, group: 'name' })
    static suffix = createPersonNameForm('suffix', { selector: appSelector, group: 'name' })
    static dob = createDobForm({ selector: appSelector, target: 'dob' })
    static ssn = createSsnForm({ selector: appSelector, target: 'ssn' })
    static gender = createGenderForm({ selector: appSelector, target: 'gender', group: 'gender', required })

    static phone = createPhoneForm({ selector: appSelector, target: 'phone', required, label: 'US Phone' })
    static email = createEmailForm({ selector: appSelector, target: 'email', required })

    static address1 = createAddressForm({ selector: appSelector, target: 'address1' })
    static address2 = createAddressForm({ selector: appSelector, target: 'address2' }, { idx: 2 })
    static addrZip = createAddrZipForm({ selector: appSelector, target: 'addrZip' })
    static addrCity = createAddrCityForm({ selector: appSelector, target: 'addrCity' })
    static addrState = createAddrStateForm({ selector: appSelector, target: 'addrState' })

}


export default DriverForm
export { ApplicationForm }