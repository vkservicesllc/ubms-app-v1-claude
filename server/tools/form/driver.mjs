import createForm, { constructForm } from './builder.mjs'
import {
    emptyOpt,
    createIdForm,
    createPersonNameForm,
    createDobForm,
    createSsnForm,
    createGenderForm,
    createMaritalStatus,
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
import Driver, { Application } from '../core/driver.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'

const required = true, disabled = true


export const createDlCommercialFrom = (props = {}) => createYesNoForm({
    target: 'dlCommercial',
    group: 'dlCategory',
    name: 'commercial',
    data: { 'Y': 'Commercial', 'N': 'Non-commercial' },
    label: 'Category',
    requiredLabel: true,
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
    disabled,
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

const createDlProblemExplForm = (target, name) => createForm({
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

const createMecIssForm = (props = {}) => createDateForm({
    target: 'mecIss',
    group: 'medCard',
    name: 'issuedOn',
    label: 'Exam Date',
    ...props,
})

const createMecExpForm = (props = {}) => createDateForm({
    target: 'mecExp',
    group: 'medCard',
    name: 'expiresOn',
    required,
    label: 'Expires on',
    ...props,
})

const createMecNumberForm = (props = {}) => createForm({
    target: 'mecNumber',
    group: 'medCard',
    name: 'nrcme',
    label: {
        content: 'NRCME #',
        title: 'National Registry Number',
    },
    ...props,
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

    static position = createForm({
        selector: appSelector,
        target: 'position',
        group: 'position',
        type: 'select/radio',
        name: 'position',
        emptyOpt,
        required,
        label: 'Position',
    })

    static appliedOn = createForm({
        selector: appSelector,
        target: 'appliedOn',
        type: 'hidden',
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

    static addrSince = createSinceForm({ selector: appSelector, target: 'addrSince', name: 'addrSince', label: 'Living since' })
    static address1 = createAddressForm({ selector: appSelector, target: 'address1' })
    static address2 = createAddressForm({ selector: appSelector, target: 'address2' }, { idx: 2 })
    static addrZip = createAddrZipForm({ selector: appSelector, target: 'addrZip' })
    static addrCity = createAddrCityForm({ selector: appSelector, target: 'addrCity' })
    static addrState = createAddrStateForm({ selector: appSelector, target: 'addrState' })

    static marital = createMaritalStatus({ selector: appSelector, required })

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
        name: 'statusExpiresOn',
        required,
        disabled,
        label: 'Status Expires on',
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
    })

    static dlRevoked = createYesNoForm({
        selector: appSelector,
        target: 'dlRevoked',
        group: 'driverLicense',
        name: 'revoked',
    })

    static dlDeniedExpl = createDlProblemExplForm('dlDeniedExpl', 'deniedExpl')
    static dlRevokedExpl = createDlProblemExplForm('dlRevokedExpl', 'revokedExpl')

    static noMec = createForm({
        selector: appSelector,
        target: 'noMec',
        type: 'checkbox',
        name: 'mecAbsent',
        label: 'Medical card is not available',
        validator: {
            sanitizer: value => !!value,
        },
    })

    static mecExp = createMecExpForm({ selector: appSelector, disabled })
    static mecIss = createMecIssForm({ selector: appSelector })
    static mecNumber = createMecNumberForm({ selector: appSelector })

    static underMeds = createYesNoForm({
        selector: appSelector,
        target: 'underMeds',
        name: 'underMeds',
        label: 'Impairing medications taken',
    })

    static medList = createForm({
        selector: appSelector,
        target: 'medList',
        type: 'textarea',
        name: 'medList',
        required,
        disabled,
        label: 'Medication List',
    })

    static dui = createYesNoForm({
        selector: appSelector,
        target: 'dui',
        name: 'dui',
    })

    static duiInDecade = createYesNoForm({
        selector: appSelector,
        target: 'duiInDecade',
        name: 'duiInDecade',
        group: 'duiInDecade',
        data: { 'Y': 'within the past 10 years', 'N': 'earlier than 10 years ago' },
        disabled,
        label: 'The the most recent arrest occurred:',
    })

    static criminal = createYesNoForm({
        selector: appSelector,
        target: 'criminal',
        name: 'criminal',
    })

    static criminalExpl = createForm({
        selector: appSelector,
        target: 'criminalExpl',
        type: 'textarea',
        name: 'criminalExpl',
        maxLength: 100,
        required,
        disabled,
        label: 'Explain what happened',
    })

    static citations = createYesNoForm({
        selector: appSelector,
        target: 'citations',
        group: 'citations',
        name: 'citations',
    })

    static _citReason = createForm({
        selector: appSelector,
        target: 'citReason',
        group: 'citReason',
        type: 'select',
        name: 'violation[]',
        data: Application.violationList,
        emptyOpt,
        required: true,
        disabled,
        label: 'Violation',
    })

    static _citOtherReason = createForm({
        selector: appSelector,
        target: 'citOtherReason',
        group: 'citOtherReason',
        name: 'other[]',
        maxLength: 25,
        required,
        disabled,
        label: 'Provide the reason',
    })

    static _citDate = createDateForm({
        selector: appSelector,
        target: 'citDate',
        group: 'citDate',
        name: 'citedOn[]',
        required,
        disabled,
        label: 'Cited on',
        validator: {
            rule: 'date',
        },
    })

    static _citState = createUsStateForm({
        selector: appSelector,
        target: 'citState',
        group: 'citState',
        name: 'state[]',
        required,
        disabled,
        label: 'State',
    })

    static accidents = createYesNoForm({
        selector: appSelector,
        target: 'accidents',
        group: 'accidents',
        name: 'accidents',
    })

    static _accType = createForm({
        selector: appSelector,
        target: 'accType',
        group: 'accType',
        type: 'select',
        name: 'collision[]',
        data: Application.accidentList,
        emptyOpt,
        required: true,
        disabled,
        label: 'Collision Type',
    })

    static _accOtherType = createForm({
        selector: appSelector,
        target: 'accOtherType',
        group: 'accOtherType',
        name: 'other[]',
        maxLength: 25,
        required,
        disabled,
        label: 'Other Type',
    })

    static _accDate = createDateForm({
        selector: appSelector,
        target: 'accDate',
        group: 'accDate',
        name: 'date[]',
        required,
        disabled,
        label: 'Date',
        validator: {
            rule: 'date',
        },
    })

    static _accState = createUsStateForm({
        selector: appSelector,
        target: 'accState',
        group: 'accState',
        name: 'state[]',
        required,
        disabled,
        label: 'State',
    })

    static _accInjuries = createYesNoForm({
        selector: appSelector,
        target: 'accInjuries',
        name: 'injuries[]',
        required,
        disabled,
        label: 'Injuries',
    })

    static _accFatalities = createYesNoForm({
        selector: appSelector,
        target: 'accFatalities',
        name: 'fatalities[]',
        required,
        disabled,
        label: 'Fatalities',
    })

}


export default DriverForm
export { ApplicationForm }