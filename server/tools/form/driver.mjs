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
    createSinceForm,
    createAddressForm,
    createAddrZipForm,
    createAddrCityForm,
    createAddrStateForm,
    createDateForm,
    createUsStateForm,
    createYesNoForm,
} from './reusable.mjs'

import selector from '../../../client/global/modules/registry/selectors/driver.mjs'
import appSelector from '../../../client/global/modules/registry/selectors/driver-application.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

const required = true, disabled = true


export const createDlCommercialFrom = (props = {}) => createYesNoForm({
    target: 'dlCommercial',
    group: 'dlCategory',
    name: 'commercial',
    data: { 'Y': 'Commercial', 'N': 'Non-commercial' },
    required,
    label: 'Category',
    ...props,
})

export const createDlStateForm = (props = {}) => createUsStateForm({
    target: 'dlState',
    group: 'driverLicense',
    name: 'state',
    required,
    label: 'State',
    ...props,
})

export const createDlNumberForm = (props = {}) => createForm({
    target: 'dlNumber',
    group: 'driverLicense',
    name: 'number',
    maxLength: length.driverLicense.number.max,
    required,
    label: 'ID #',
    ...props,
    validator: {
        match: /^[A-Za-z0-9-]+$/,
    },
})

export const createDlClassForm = (props = {}) => createForm({
    target: 'dlClass',
    group: 'driverLicense',
    name: 'class',
    maxLength: length.driverLicense.class.max,
    label: 'Class',
    ...props,
    validator: {
        match: /^[A-Z0-9-]+$/,
    },
})

export const createDlIssForm = (props = {}) => createDateForm({
    target: 'dlIss',
    group: 'driverLicense',
    name: 'issuedOn',
    required,
    label: 'Issued on',
    ...props,
})

export const createDlExpForm = (props = {}) => createDateForm({
    target: 'dlExp',
    group: 'driverLicense',
    name: 'expiresOn',
    required,
    label: 'Expires on',
    ...props,
})

export const createDlEndrsForm = (props = {}) => createForm({
    target: 'dlEndrs',
    group: 'driverLicense',
    type: 'textarea',
    name: 'endorsement',
    maxLength: length.driverLicense.endorsement.max,
    label: 'Endorsements',
    ...props,
})

export const createDlRestrForm = (props = {}) => createForm({
    target: 'dlRestr',
    group: 'driverLicense',
    type: 'textarea',
    name: 'restriction',
    maxLength: length.driverLicense.restriction.max,
    label: 'Restrictions',
    ...props,
})

export const createDlProblemExplForm = (target, name) => createForm({
    selector: appSelector,
    target,
    group: 'driverLicense',
    type: 'textarea',
    name,
    maxLength: length.driverLicense.problemExpl.max,
    required,
    disabled,
    label: 'Explain what happened',
})


class DriverForm {
    constructor(options = {}) {
        getStaticProps(DriverForm)
            .forEach(target => this[target] = constructForm(DriverForm, target, options))
    }

    static id = createIdForm({ selector })

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

    static addrSince = createSinceForm({ selector: appSelector, target: 'addrSince', label: 'Living since' })
    static address1 = createAddressForm({ selector: appSelector, target: 'address1' })
    static address2 = createAddressForm({ selector: appSelector, target: 'address2' }, { idx: 2 })
    static addrZip = createAddrZipForm({ selector: appSelector, target: 'addrZip' })
    static addrCity = createAddrCityForm({ selector: appSelector, target: 'addrCity' })
    static addrState = createAddrStateForm({ selector: appSelector, target: 'addrState' })

    static status = createForm({
        selector: appSelector,
        target: 'status',
        type: 'select/radio',
        name: 'status',
        data: { '0': 'US Citizen', '1': 'Permanent Resident', '2': 'Work Authorization/Visa' },
        keys: [ 'citizen', 'resident', 'authorized' ],
        required,
        disabled,
        label: 'Immigration Status',
    })

    static statusExp = createDateForm({
        selector: appSelector,
        target: 'statusExp',
        required,
        disabled,
        label: 'Status Expires on',
    })

    static position = createForm({
        selector: appSelector,
        target: 'position',
        group: 'position',
        type: 'select/radio',
        name: 'position',
        emptyOpt: 'Decide later...',
        label: 'Desired Position',
    })

    static dlCommercial = createDlCommercialFrom({ selector: appSelector })

    static dlState = createDlStateForm({ selector: appSelector })
    static dlNumber = createDlNumberForm({ selector: appSelector })
    static dlClass = createDlClassForm({ selector: appSelector })
    static dlIss = createDlIssForm({ selector: appSelector })
    static dlExp = createDlExpForm({ selector: appSelector })
    static dlEndrs = createDlEndrsForm({ selector: appSelector })
    static dlRestr = createDlRestrForm({ selector: appSelector })

    static dlDenied = createYesNoForm({
        selector: appSelector,
        target: 'dlDenied',
        group: 'driverLicense',
        name: 'denied',
        required,
        // label: 'Have you ever been denied a license, permit, or privilege to operate a motor vehicle?',
    })

    static dlRevoked = createYesNoForm({
        selector: appSelector,
        target: 'dlRevoked',
        group: 'driverLicense',
        name: 'revoked',
        required,
        // label: 'Has your license, permit, or driving privilege ever been suspended or revoked?',
    })

    static dlDeniedExpl = createDlProblemExplForm('dlDeniedExpl', 'deniedExpl')
    static dlRevokedExpl = createDlProblemExplForm('dlRevokedExpl', 'revokedExpl')

}


export default DriverForm
export { ApplicationForm }