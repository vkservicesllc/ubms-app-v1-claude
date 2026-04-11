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
import { createBusNameForm, createEinForm } from './company.mjs'
import { createNumberForm } from './carrier.mjs'

import selector from '../../../client/global/modules/registry/selectors/driver.mjs'
import appSelector from '../../../client/global/modules/registry/selectors/driver-application.mjs'
import appEmplSelector from '../../../client/global/modules/registry/selectors/driver-application-employment.mjs'
import Driver, { Application, Employment } from '../core/driver.mjs'
import { Truck, Van } from '../core/vehicle.mjs'
import Geography from '../../../client/global/modules/tools/core/geography.mjs'
import length from '../../../client/global/modules/registry/length.mjs'
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs'
import { validate } from './validator.mjs'

const required = true, disabled = true, readOnly = true


const createPositionForm = (props = {}) => createForm({
    selector: appSelector,
    type: 'select/radio',
    name: 'position',
    data: Driver.list.position,
    emptyOpt,
    required,
    label: 'Position',
    // validator: {
    //     //? need to figure out...
    // },
    ...props,
})

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
    validator: {
        sanitizer: value => value || null,
    },
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
    static leadId = createIdForm({ selector: appSelector, target: 'leadId' })
    static deleteId = createIdForm({ selector: appSelector, target: 'deleteId' })

    static user = createForm({
        selector: appSelector,
        target: 'user',
        type: 'select',
        name: '_userId',
        label: 'User',
        validator: {
            sanitizer: value => value || null,
        },
    })

    static carrier = createForm({
        selector: appSelector,
        target: 'carrier',
        type: 'select',
        name: '_carrierId',
        label: 'Carrier',
        validator: {
            sanitizer: value => value || null,
        },
    })

    static team = createForm({
        selector: appSelector,
        target: 'team',
        type: 'select',
        name: '_teamId',
        label: 'Team',
        validator: {
            sanitizer: value => value || null,
        },
    })

    static pin = createForm({
        selector: appSelector,
        target: 'pin',
        type: 'password',
        name: 'pin',
        maxLength: 4,
        required: true,
        disabled: true,
        label: 'PIN',
        requiredLabel: false,
    })

    static position = createPositionForm({ target: 'position', group: 'position' })
    static position_ = createPositionForm({
        target: 'position',
        group: 'position',
        required: false,
        validator: {
            sanitizer: value => value || null,
        },
    })

    static condition = createForm({ /* aka Status */
        selector: appSelector,
        target: 'condition',
        type: 'select',
        name: 'condition',
        data: { a: 'Approved', r: 'Waiting List', b: 'Disqualified' },
        emptyOpt,
        label: 'Application Status',
        validator: {
            sanitizer: value => value || null,
        },
    })

    static experience = createForm({
        selector: appSelector,
        target: 'experience',
        type: 'select',
        name: 'experience',
        data: Driver.list.experience,
        emptyOpt,
        label: 'Recognized Experience',
        validator: {
            sanitizer: value => value || null,
        },
    })

    static apprPosition = createPositionForm({
        target: 'apprPosition',
        required: false,
        label: 'Approved Position',
        validator: {
            sanitizer: value => value || null,
        },
    })


    static ssn = createSsnForm({ selector: appSelector, target: 'ssn' })
    static ssn_ = createSsnForm({ selector: appSelector, target: 'ssn', required: false })
    // static ssnConf = createSsnForm({ selector: appSelector, target: 'ssnConf', name: undefined, label: 'Confirm SSN' })


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
    // static dob_ = createDobForm({ selector: appSelector, target: 'dob', required: false })
    static gender = createGenderForm({ selector: appSelector, target: 'gender', group: 'gender' })

    static phone = createPhoneForm({ selector: appSelector, target: 'phone', required })
    static email = createEmailForm({ selector: appSelector, target: 'email', required })

    static leadFirstName = createPersonNameForm('first', { selector: appSelector, target: 'leadFirstName', group: 'name' })
    static leadMiddleName = createPersonNameForm('middle', { selector: appSelector, target: 'leadMiddleName', group: 'name' })
    static leadLastName = createPersonNameForm('last', { selector: appSelector, target: 'leadLastName', group: 'name' })
    static leadSuffix = createPersonNameForm('suffix', { selector: appSelector, target: 'leadSuffix', group: 'name' })
    static leadGender = createGenderForm({ selector: appSelector, target: 'leadGender', group: 'gender' })
    static leadPhone = createPhoneForm({ selector: appSelector, target: 'leadPhone', required })
    static leadEmail = createEmailForm({ selector: appSelector, target: 'leadEmail', required })
    static leadPosition = createPositionForm({
        target: 'leadPosition',
        group: 'position',
        required: false,
    })

    static marital = createMaritalStatus({ selector: appSelector, required })

    static addrEnough = createForm({
        selector: appSelector,
        target: 'addrEnough',
        type: 'hidden',
        name: 'address[enough]',
        validator: {
            rule: 'boolean',
            sanitizer: value => value === '1',
        },
    })

    static addrSince = createSinceForm({
        selector: appSelector,
        target: 'addrSince',
        name: 'address[since]',
        label: 'Living since',
    })

    static address1 = createAddressForm({
        selector: appSelector,
        target: 'address1',
        name: 'address[address1]',
    })

    static address2 = createAddressForm({
        selector: appSelector,
        target: 'address2',
        name: 'address[address2]',
    }, { idx: 2 })

    static addrZip = createAddrZipForm({
        selector: appSelector,
        target: 'addrZip',
        name: 'address[zip]',
    })

    static addrCity = createAddrCityForm({
        selector: appSelector,
        target: 'addrCity',
        name: 'address[city]',
    })

    static addrState = createAddrStateForm({
        selector: appSelector,
        target: 'addrState',
        name: 'address[state]',
    })

    static livedAbroad = createYesNoForm({
        selector: appSelector,
        target: 'livedAbroad1',
        group: 'livedAbroad',
        name: 'address[livedAbroad]',
        required,
        disabled,
        label: 'Lived Abroad',
    }, true)
    static livedAbroad2 = createForm({
        selector: appSelector,
        target: 'livedAbroad1',
        type: 'checkbox',
        name: 'address[livedAbroad]',
        label: 'Lived abroad before this date',
    })

    static country = (function() {
        const data = { ...Geography.list.country }
        delete data.US

        return createForm({
            selector: appSelector,
            target: 'country',
            type: 'select',
            name: 'prevCountry',
            data,
            emptyOpt,
            required,
            disabled,
            label: 'Country',
            validator: {
                optional: true,
            },
        })
    })()

    static _addrSince = createSinceForm({
        selector: appSelector,
        target: 'prevAddrSince',
        group: 'prevAddrSince',
        name: 'addresses[since][]',
        disabled,
        label: 'Lived since'
    })

    static _addrEnough = createForm({
        selector: appSelector,
        target: 'prevAddrEnough',
        group: 'prevAddrEnough',
        type: 'hidden',
        name: 'addresses[enough][]',
        validator: {
            rule: 'boolean',
            sanitizer: value => value === '1',
        },
    })

    static _address1 = createAddressForm({
        selector: appSelector,
        target: 'prevAddress1',
        group: 'prevAddress1',
        name: 'addresses[address1][]',
        disabled,
    })

    static _address2 = createAddressForm({
        selector: appSelector,
        target: 'prevAddress2',
        group: 'prevAddress2',
        name: 'addresses[address2][]',
        disabled,
    }, { idx: 2 })

    static _addrZip = createAddrZipForm({
        selector: appSelector,
        target: 'prevAddrZip',
        group: 'prevAddrZip',
        name: 'addresses[zip][]',
        disabled,
    })

    static _addrCity = createAddrCityForm({
        selector: appSelector,
        target: 'prevAddrCity',
        group: 'prevAddrCity',
        name: 'addresses[city][]',
        disabled,
    })

    static _addrState = createAddrStateForm({
        selector: appSelector,
        target: 'prevAddrState',
        group: 'prevAddrState',
        name: 'addresses[state][]',
        disabled,
    })

    static _livedAbroad = createYesNoForm({
        selector: appSelector,
        target: 'livedAbroad2',
        group: 'prevLivedAbroad',
        name: 'addresses[livedAbroad][]',
        required,
        disabled,
        label: 'Lived Abroad',
    })
    static _livedAbroad2 = createForm({
        selector: appSelector,
        target: 'livedAbroad2',
        type: 'checkbox',
        name: 'addresses[livedAbroad][]',
        label: 'Lived abroad before this date',
    })

    static status = createForm({
        selector: appSelector,
        target: 'status',
        type: 'select/radio',
        name: 'legalStatus',
        data: Application.list.legalStatus,
        keys: [ 'citizen', 'resident', 'authorized' ],
        required,
        disabled,
        label: 'Immigration Status',
        validator: {
            rule: 'numeric',
            sanitizer: value => +value,
        },
    })

    static statusExp = createDateForm({
        selector: appSelector,
        target: 'statusExp',
        name: 'legalExpiration',
        required,
        disabled,
        label: 'Status Expires on',
    })


    /* DRIVER LICENSE */

    static dlCommercial = createDlCommercialFrom({ selector: appSelector })

    static dlCommercial2 = createForm({
        selector: appSelector,
        target: 'dlCommercial',
        type: 'checkbox',
        name: 'commercial',
        label: 'Commercial <small>(CDL)</small>',
    })

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
        name: 'dlDenied',
    })
    static dlDenied2 = createForm({
        selector: appSelector,
        target: 'dlDenied',
        type: 'checkbox',
        name: 'dlDenied',
        label: 'The license has been denied in the past',
    })

    static dlRevoked = createYesNoForm({
        selector: appSelector,
        target: 'dlRevoked',
        group: 'driverLicense',
        name: 'dlRevoked',
    })
    static dlRevoked2 = createForm({
        selector: appSelector,
        target: 'dlRevoked',
        type: 'checkbox',
        name: 'dlRevoked',
        label: 'The license has been revoked/suspended in the past',
    })

    static dlDeniedExpl = createDlProblemExplForm('dlDeniedExpl', 'dlDeniedExpl')
    static dlRevokedExpl = createDlProblemExplForm('dlRevokedExpl', 'dlRevokedExpl')


    /* MEDICAL CARD */

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

    static underMeds2 = createForm({
        selector: appSelector,
        target: 'underMeds',
        type: 'checkbox',
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

    static medList2 = createForm({
        selector: appSelector,
        target: 'medList',
        name: 'medList',
        required,
        disabled,
        label: 'Medication List',
    })


    /* LEGAL COMPLIANCE */

    static dui = createYesNoForm({
        selector: appSelector,
        target: 'dui',
        name: 'dui',
    })
    static dui2 = createForm({
        selector: appSelector,
        target: 'dui',
        type: 'checkbox',
        name: 'dui',
        label: 'Previously charged with DUI/DWI',
    })

    static duiInDecade = createYesNoForm({
        selector: appSelector,
        target: 'duiInDecade',
        name: 'duiInDecade',
        group: 'duiInDecade',
        data: { 'Y': 'within the past 10 years', 'N': 'more than 10 years ago' },
        disabled,
        label: 'The the most recent arrest occurred:',
    })

    static criminal = createYesNoForm({
        selector: appSelector,
        target: 'criminal',
        name: 'criminal',
    })
    static criminal2 = createForm({
        selector: appSelector,
        target: 'criminal',
        type: 'checkbox',
        name: 'criminal',
        label: 'Previously charged with misdemeanor/felony',
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

    static dotDat = createYesNoForm({
        selector: appSelector,
        target: 'dotDat',
        name: 'dotDat',
    })
    static dotDat2 = createForm({
        selector: appSelector,
        target: 'dotDat',
        type: 'checkbox',
        name: 'dotDat',
        label: 'Previously refused/failed to take DOT drug/alcohol test',
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
        data: Application.list.violation,
        emptyOpt,
        required,
        // disabled,
        label: 'Violation',
    })

    static _citOtherReason = createForm({
        selector: appSelector,
        target: 'citOtherReason',
        group: 'citOtherReason',
        name: 'other[]',
        maxLength: 25,
        required,
        // disabled,
        label: 'Provide the reason',
    })

    static _citDate = createDateForm({
        selector: appSelector,
        target: 'citDate',
        group: 'citDate',
        name: 'citedOn[]',
        required,
        // disabled,
        label: 'Cited on',
    })

    static _citState = createUsStateForm({
        selector: appSelector,
        target: 'citState',
        group: 'citState',
        name: 'state[]',
        required,
        // disabled,
        label: 'State',
    })


    /* SAFETY */

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
        data: Application.list.collision,
        emptyOpt,
        required: true,
        // disabled,
        label: 'Collision Type',
    })

    static _accOtherType = createForm({
        selector: appSelector,
        target: 'accOtherType',
        group: 'accOtherType',
        name: 'other[]',
        maxLength: 25,
        required,
        // disabled,
        label: 'Other Type',
    })

    static _accDate = createDateForm({
        selector: appSelector,
        target: 'accDate',
        group: 'accDate',
        name: 'date[]',
        required,
        // disabled,
        label: 'Date',
    })

    static _accState = createUsStateForm({
        selector: appSelector,
        target: 'accState',
        group: 'accState',
        name: 'state[]',
        required,
        // disabled,
        label: 'State',
    })

    static _accInjuries = createYesNoForm({
        selector: appSelector,
        target: 'accInjuries',
        name: 'injuries[]',
        required,
        // disabled,
        label: 'Injuries',
    })
    static _accInjuries2 = createForm({
        selector: appSelector,
        target: 'accInjuries',
        type: 'checkbox',
        name: 'injuries[]',
        required,
        // disabled,
        label: 'Injuries',
    })

    static _accFatalities = createYesNoForm({
        selector: appSelector,
        target: 'accFatalities',
        name: 'fatalities[]',
        required,
        // disabled,
        label: 'Fatalities',
    })
    static _accFatalities2 = createForm({
        selector: appSelector,
        target: 'accFatalities',
        type: 'checkbox',
        name: 'fatalities[]',
        required,
        // disabled,
        label: 'Fatalities',
    })



    /* EXPERIENCE */


    static noExp = createForm({
        selector: appSelector,
        target: 'noExp',
        type: 'checkbox',
        name: 'noExp',
        label: 'No prior driving experience',
        validator: {
            sanitizer: value => !!value,
        },
    })

    static cmvExp = createYesNoForm({
        selector: appSelector,
        target: 'cmvExp',
        name: 'cmv',
        required,
        label: 'CMV Experience',
    }, true)

    static straightExp = createForm({
        selector: appSelector,
        target: 'straightExp',
        type: 'checkbox',
        data: Application.list.vehicle.straight,
        name: 'vehicles[straight]',
        label: 'Straight Truck',
    })

    static semiExp = createForm({
        selector: appSelector,
        target: 'semiExp',
        group: 'semiExp',
        type: 'checkbox',
        data: Application.list.vehicle.semi,
        name: 'vehicles[semi]',
        label: 'Trailer (Semi)',
    })

    static tandemExp = createForm({
        selector: appSelector,
        target: 'tandemExp',
        type: 'checkbox',
        name: 'vehicles[misc][tandem]',
        label: 'Tandem Tractor/Trailer',
    })

    static hotshotExp = createForm({
        selector: appSelector,
        target: 'tandemExp',
        type: 'checkbox',
        name: 'vehicles[misc][hotshot]',
        label: 'Hotshot',
    })

    static vanExp = createForm({
        selector: appSelector,
        target: 'vanExp',
        type: 'checkbox',
        name: 'vehicles[misc][van]',
        label: 'Cargo Van',
    })


    static expStartDate = createDateForm({
        selector: appSelector,
        target: 'expStartDate',
        name: 'firstDate',
        required,
        label: 'Started Driving on',
    }, true)

    static expEndDate = createDateForm({
        selector: appSelector,
        target: 'expEndDate',
        name: 'lastDate',
        required,
        label: 'Last Driven on',
    }, true)

    static expMileage = createForm({
        selector: appSelector,
        target: 'expMileage',
        mode: 'numeric',
        name: 'mileage',
        maxLength: 7,
        required,
        label: 'Approx. Mileage',
        validator: {
            sanitizer: value => Number(value.replace(/,/g, '')),
            rule: 'numeric',
            optional: true,
        },
    })


    static cdlSchool = createYesNoForm({
        selector: appSelector,
        target: 'cdlSchool',
        name: 'cdlSchool',
        required,
        label: 'Completed CDL school',
    }, true)

    static cdlSchool2 = createForm({
        selector: appSelector,
        target: 'cdlSchool',
        type: 'checkbox',
        name: 'cdlSchool',
        label: 'Completed CDL training program',
    })

    static schName = createForm({
        selector: appSelector,
        target: 'schName',
        group: 'cdlSchool',
        name: 'name',
        maxLength: 25,
        required,
        disabled,
        label: 'School Name',
    })

    static schPhone = createPhoneForm({
        selector: appSelector,
        target: 'schPhone',
        group: 'cdlSchool',
        name: 'phone',
        required,
        disabled,
        label: 'Phone',
    })

    static schState = createUsStateForm({
        selector: appSelector,
        target: 'schState',
        group: 'cdlSchool',
        name: 'state',
        required,
        disabled,
        label: 'State',
    })

    static schEndDate = createDateForm({
        selector: appSelector,
        target: 'schEndDate',
        group: 'cdlSchool',
        name: 'endDate',
        required,
        disabled,
        label: 'Completion Date',
    })

    static schDuration = createForm({
        selector: appSelector,
        target: 'schDuration',
        group: 'cdlSchool',
        type: 'select',
        name: 'duration',
        data: Application.list.schoolDuration,
        emptyOpt,
        required,
        disabled,
        label: 'Attendance Duration',
    })



    /* PREV-EMPLOYMENT */

    static prevEmployed = createYesNoForm({
        selector: appSelector,
        target: 'prevEmployed',
        group: 'prevEmployed',
        name: 'prevEmployed',
        required,
        label: 'Previously employed within the past 10 years',
    })

    // static _emplId = createForm({
    //     selector: appSelector,
    //     target: 'emplId',
    //     type: 'hidden',
    //     name: '_id[]',
    // })

    // static _prevEmployer = createForm({
    //     selector: appSelector,
    //     target: 'prevEmployer',
    //     group: 'prevEmployer',
    //     name: 'employer[]',
    //     maxLength: 40,
    //     required,
    //     disabled,
    //     label: 'Company / Employer Name',
    // })

    // static _emplPhone = createPhoneForm({
    //     selector: appSelector,
    //     target: 'emplPhone',
    //     group: 'emplPhone',
    //     name: 'phone[]',
    //     required,
    //     disabled,
    //     label: 'Phone',
    // })

    // static _emplAddr1 = createAddressForm({
    //     selector: appSelector,
    //     target: 'emplAddress1',
    //     group: 'emplAddress1',
    //     name: 'address1[]',
    //     disabled,
    // })

    // static _emplAddr2 = createAddressForm({
    //     selector: appSelector,
    //     target: 'emplAddress2',
    //     group: 'emplAddress2',
    //     name: 'address2[]',
    //     disabled,
    // }, { idx: 2, business: true })

    // static _emplAddrZip = createAddrZipForm({
    //     selector: appSelector,
    //     target: 'emplAddrZip',
    //     group: 'emplAddrZip',
    //     name: 'zip[]',
    //     disabled,
    // })

    // static _emplAddrCity = createAddrCityForm({
    //     selector: appSelector,
    //     target: 'emplAddrCity',
    //     group: 'emplAddrCity',
    //     name: 'city[]',
    //     disabled,
    // })

    // static _emplAddrState = createAddrStateForm({
    //     selector: appSelector,
    //     target: 'emplAddrState',
    //     group: 'emplAddrState',
    //     name: 'state[]',
    //     disabled,
    // })

    // static _emplStartDate = createDateForm({
    //     selector: appSelector,
    //     target: 'emplStartDate',
    //     group: 'emplStartDate',
    //     name: 'startedOn[]',
    //     required,
    //     disabled,
    //     label: 'Started on',
    // })

    // static _emplPosition = createForm({
    //     selector: appSelector,
    //     target: 'emplPosition',
    //     group: 'emplPosition',
    //     name: 'position[]',
    //     required,
    //     disabled,
    //     label: 'Position/Title',
    // })

    // static _emplEarnings = createForm({
    //     selector: appSelector,
    //     target: 'emplEarnings',
    //     group: 'emplEarnings',
    //     mode: 'numeric',
    //     name: 'earnings[]',
    //     maxLength: 4,
    //     required,
    //     disabled,
    //     label: 'Monthly Earnings/Salary',
    //     validator: {
    //         sanitizer: value => Number(value.replace(/,/g, '')),
    //         rule: 'numeric',
    //     },
    // })

    // static _emplFMCSR = createYesNoForm({
    //     selector: appSelector,
    //     target: 'emplFmcsr',
    //     group: 'emplFmcsr',
    //     name: 'fmcsr[]',
    //     disabled,
    //     label: 'Subject to FMCSRs',
    // })
    // static _emplFMCSR2 = createForm({
    //     selector: appSelector,
    //     target: 'emplFmcsr',
    //     group: 'emplFmcsr',
    //     type: 'checkbox',
    //     name: 'fmcsr[]',
    //     label: 'Subject to FMCSRs',
    //     validator: {
    //         rule: 'boolean',
    //         sanitizer: value => value === 'on',
    //     },
    // })

    // static _emplDotDat = createYesNoForm({
    //     selector: appSelector,
    //     target: 'emplDotDat',
    //     group: 'emplDotDat',
    //     name: 'dotDat[]',
    //     disabled,
    //     label: 'Subject to DOT Drug/Alcohol Testing',
    // })
    // static _emplDotDat2 = createForm({
    //     selector: appSelector,
    //     target: 'emplDotDat',
    //     group: 'emplDotDat',
    //     type: 'checkbox',
    //     name: 'dotDat[]',
    //     label: 'Subject to DOT Drug/Alcohol Testing',
    //     validator: {
    //         rule: 'boolean',
    //         sanitizer: value => value === 'on',
    //     },
    // })

    // static _emplRFL = createForm({
    //     selector: appSelector,
    //     target: 'emplRfl',
    //     group: 'emplRfl',
    //     type: 'textarea',
    //     name: 'rfl[]',
    //     maxLength: 50,
    //     required,
    //     disabled,
    //     label: 'Reason for Leaving',
    // })

    // static _emplEndDate = createDateForm({
    //     selector: appSelector,
    //     target: 'emplEndDate',
    //     group: 'emplEndDate',
    //     name: 'leftOn[]',
    //     required,
    //     disabled,
    //     label: 'Termination Date',
    // }, true)



    /* PREFERENCE */

    static operType = createForm({
        selector: appSelector,
        target: 'operType',
        group: 'operType',
        type: 'select/radio',
        name: 'operType',
        emptyOpt,
        data: { s: 'Solo', t: 'Team' },
        keys: ['solo', 'team'],
        required,
        label: 'Operating Type',
    })

    static teamName = createForm({
        selector: appSelector,
        target: 'teamName',
        group: 'teamPartner',
        name: 'teamName',
        disabled,
        label: "Partner's Full Name",
        validator: {
            sanitizer: value => value || null,
        },
    })

    static teamPhone = createPhoneForm({ selector: appSelector, target: 'teamPhone', group: 'teamPartner', name: 'teamPhone', disabled, label: "Partner's Phone" })

    static haulRegion = createForm({
        selector: appSelector,
        target: 'haulRegion',
        group: 'haulRegion',
        type: 'checkbox',
        name: 'haulRegion',
        data: Application.list.haulRegion,
        // required,
        label: 'Hauling Region',
    })

    static equipmentType = createForm({
        selector: appSelector,
        target: 'equipmentType',
        group: 'equipmentType',
        type: 'checkbox',
        name: 'equipment',
        data: Application.list.vehicle.semi,
        // required,
        label: 'Equipment Type',
    })

    static startPref = createForm({
        selector: appSelector,
        target: 'startPref',
        group: 'startPref',
        type: 'select/radio',
        name: 'startPref',
        data: Application.list.startPref,
        keys: ['zero', 'one', 'two', 'three', 'four'],
        emptyOpt,
        required,
        label: 'Preference to start in:',
        validator: {
            rule: 'numeric',
            sanitizer: value => +value,
        },
    })



    /* BUSINESS DETAILS */

    static activeLLC = createYesNoForm({
        selector: appSelector,
        target: 'activeLLC',
        group: 'activeLLC',
        name: 'activeLLC',
        required,
        label: 'Active LLC',
        validator: {
            optional: true,
        },
    })

    static inactiveLLC = createForm({
        selector: appSelector,
        target: 'inactiveLLC',
        type: 'checkbox',
        name: 'inactiveLLC',
        label: 'No currently active LLC',
        validator: {
            sanitizer: value => value === 'on',
        },
    })

    static llcName = createBusNameForm(appSelector, {
        target: 'llcName',
        group: 'llcDetails',
        name: 'busName',
        required,
        disabled,
        label: 'Business Name',
        validator: {
            optional: true,
        },
    })

    static llcState = createUsStateForm({
        selector: appSelector,
        target: 'llcState',
        group: 'llcDetails',
        name: 'state',
        required,
        disabled,
        label: 'State',
        validator: {
            optional: true,
        },
    })

    static llcEin = createEinForm(appSelector, {
        target: 'llcEin',
        group: 'llcDetails',
        required: false,
        disabled,
        validator: {
            optional: true,
        },
    })

    // static llcAssistance = createYesNoForm({
    //     selector: appSelector,
    //     target: 'llcAssistance',
    //     group: 'llcAssistance',
    //     name: 'llcAssistance',
    //     required,
    //     disabled,
    //     label: 'Assistance Starting LLC',
    //     validator: {
    //         optional: true,
    //     },
    // })

    // static llcProposedName = createBusNameForm(appSelector, {
    //     target: 'llcProposedName',
    //     name: 'proposedName',
    //     required,
    //     disabled,
    //     label: 'Proposed Company Name',
    //     validator: {
    //         optional: true,
    //     },
    // })



    /* VEHICLE OWNERSHIP */

    static currentVhlMMT = createForm({
        selector: appSelector,
        target: 'currentVhlMMT',
        type: 'select',
        name: 'mmt',
        data: currentExpediteVhlMMTData(),
        emptyOpt,
        required,
        label: 'Vehicle <small>(Make/Model)</small>',
        validator: {
            optional: true,
            ignoreData: true,
        },
    })

    static currentVhlYear = createForm({
        selector: appSelector,
        target: 'currentVhlYear',
        type: 'select',
        name: 'year',
        data: descYears(),
        emptyOpt,
        required,
        label: 'Year',
        validator: {
            sanitizer: value => +(value.replace(':', '')),
            rule: 'numeric',
            optional: true,
        },
    })

    static currentVhlMake = createForm({
        selector: appSelector,
        target: 'currentVhlMake',
        group: 'currentVhlMMT',
        name: 'make',
        maxLength: length.vehicle.make.max,
        required,
        label: 'Make',
        validator: {
            optional: true,
        },
    })

    static currentVhlModel = createForm({
        selector: appSelector,
        target: 'currentVhlModel',
        group: 'currentVhlMMT',
        name: 'model',
        maxLength: length.vehicle.model.max,
        required,
        label: 'Model',
        validator: {
            optional: true,
        },
    })

    static currentVhlType = createForm({
        selector: appSelector,
        target: 'currentVhlType',
        group: 'currentVhlMMT',
        type: 'select',
        name: 'type',
        data: {},
        emptyOpt,
        required,
        label: 'Type',
        validator: {
            optional: true,
        },
    })

    static currentVhlLen = createForm({
        selector: appSelector,
        target: 'currentVhlLen',
        type: 'select',
        name: 'length',
        data: {},
        emptyOpt,
        required,
        label: 'Length',
        validator: {
            sanitizer: value => +value,
            optional: true,
        },
    })



    /* BENEFICIARY */

    static benefRelation = createForm({
        selector: appSelector,
        target: 'benefRelation',
        type: 'select',
        name: 'relation',
        data: {},
        emptyOpt,
        required,
        label: 'Relationship',
    })

    static benefOtherRel = createForm({
        selector: appSelector,
        target: 'benefOtherRel',
        name: 'otherRel',
        maxLength: 20,
        required,
        disabled,
        label: '"Other" Relationship',
        validator: {
            optional: true,
        },
    })

    static benefFirstName = createPersonNameForm('first', { selector: appSelector, target: 'benefFirstName' })
    static benefMiddleName = createPersonNameForm('middle', { selector: appSelector, target: 'benefMiddleName' })
    static benefLastName = createPersonNameForm('last', { selector: appSelector, target: 'benefLastName' })
    static benefSuffix = createPersonNameForm('suffix', { selector: appSelector, target: 'benefSuffix' })
    // static benefDob = createDobForm({ selector: appSelector, target: 'benefDob' })
    // static benefGender = createGenderForm({ selector: appSelector, target: 'benefGender' })
    static benefSsn = createSsnForm({ selector: appSelector, target: 'benefSsn', required: false })

    static benefPhone = createPhoneForm({ selector: appSelector, target: 'benefPhone', required })
    // static benefAddress1 = createAddressForm({ selector: appSelector, target: 'benefAddress1' })
    // static benefAddress2 = createAddressForm({ selector: appSelector, target: 'benefAddress2' }, { idx: 2 })
    // static benefAddrZip = createAddrZipForm({ selector: appSelector, target: 'benefAddrZip' })
    // static benefAddrCity = createAddrCityForm({ selector: appSelector, target: 'benefAddrCity' })
    // static benefAddrState = createAddrStateForm({ selector: appSelector, target: 'benefAddrState' })



    /* MISC */

    static emergPhone = createPhoneForm({ selector: appSelector, target: 'emergPhone', required })

    static emergName = createForm({
        selector: appSelector,
        target: 'emergName',
        name: 'name',
        maxLength: 20,
        label: 'Name',
        required,
    })

    static emergRelation = createForm({
        selector: appSelector,
        target: 'emergRelation',
        name: 'relation',
        maxLength: 20,
        label: 'Relationship',
        validator: {
            sanitizer: value => value || null,
        },
    })


    static validate = (target, options) => validate(ApplicationForm, (target, options) => {
        let fields
        const profileFields = [
            'firstName', 'middleName', 'lastName', 'suffix',
            'gender', // 'dob', // 'ssn',
            'marital', 'phone', 'email',
        ]
        const addressFields = ['address1', 'address2', 'addrZip', 'addrCity', 'addrState', 'addrSince', 'addrEnough']
        const vehicleFields = [
            'currentVhlType',
            'currentVhlMMT', 'currentVhlYear', 'currentVhlMake', 'currentVhlModel', 'currentVhlLen',
        ]
        const businessFields = ['activeLLC', 'inactiveLLC', 'llcName', 'llcState', 'llcEin']

        //! NOT REHIRE (FIRST TIMER)
        switch (target) {
            case 'registration':
                fields = [...profileFields, ...addressFields, 'status', 'statusExp']
                // fields = [...profileFields, 'status', 'statusExp']
                break
            case 'workflow':
                fields = ['user', 'carrier', 'condition', 'experience', 'apprPosition']
                break
            case 'profile':
                fields = [ ...profileFields, 'dob' ]
                break
            case 'legal':
                fields = ['status', 'statusExp']
                break
            case 'position/vehicle':
                fields = ['position', ...vehicleFields]
                break
            case 'residence':
                fields = [
                    ...addressFields,
                    'livedAbroad', 'country',
                    '_addrSince', '_addrEnough', '_address1', '_address2',
                    '_addrZip', '_addrCity', '_addrState', '_livedAbroad',
                ]
                break
            case 'license':
                fields = [
                    'dlCommercial', 'dlState', 'dlNumber', 'dlClass', 'dlIss', 'dlExp',
                    'dlEndrs', 'dlRestr', 'dlDenied', 'dlRevoked', 'dlDeniedExpl', 'dlRevokedExpl',
                ]
                break
            case 'medical':
                fields = ['noMec', 'mecExp', 'mecIss', 'mecNumber', 'underMeds', 'medList']
                break
            case 'compliance':
                fields = [
                    'dui', 'duiInDecade', 'criminal', 'criminalExpl', 'dotDat', 'citations',
                    '_citDate', '_citState', '_citReason', '_citOtherReason',
                ]
                break
            case 'safety':
                fields = [
                    'accidents',
                    '_accType', '_accOtherType', '_accDate', '_accState', '_accInjuries', '_accFatalities',
                ]
                break
            case 'experience':
                fields = [
                    'noExp', 'cmvExp', 'expStartDate', 'expEndDate', 'expMileage',
                    'cdlSchool', 'schName', 'schPhone', 'schState', 'schEndDate', 'schDuration',
                ]
                break
            case 'employment':
                fields = ['prevEmployed']
                break
            case 'preference':
                fields = ['operType', 'teamName', 'teamPhone', 'haulRegion', 'equipmentType', 'startPref']
                break
            case 'business':
                fields = businessFields
                break
            case 'business/vehicle':
                fields = [...businessFields, ...vehicleFields]
                break
            case 'beneficiary':
                fields = [
                    'benefRelation', 'benefOtherRel',
                    'benefFirstName', 'benefMiddleName', 'benefLastName', 'benefSuffix',
                    'benefPhone','benefSsn',
                ]
                break
            case 'emergency':
                fields = ['emergPhone', 'emergName', 'emergRelation']
                break
        }

        return fields
    }, target, options)


}


class EmploymentForm {
    constructor(options = {}) {
        getStaticProps(EmploymentForm)
            .forEach(target => this[target] = constructForm(EmploymentForm, target, options))
    }


    static id = createIdForm({ selector: appEmplSelector })
    static appId = createIdForm({ selector: appEmplSelector, target: 'appId', group: 'appId', name: '_appId' })

    static usdot = createNumberForm('usdot', {
        selector: appEmplSelector,
        target: 'usdot',
        group: 'usdot',
        label: 'US-DOT #',
    })

    static urUsdot = createNumberForm('usdot', {
        selector: appEmplSelector,
        target: 'urUsdot',
        label: 'US-DOT #',
    })

    static employer = createForm({
        selector: appEmplSelector,
        target: 'employer',
        group: 'employer',
        name: 'employer',
        maxLength: 40,
        required,
        label: 'Company/Employer Name',
    })

    static urEmployer = createForm({
        selector: appEmplSelector,
        target: 'urEmployer',
        name: 'employer',
        maxLength: 40,
        required,
        label: 'Company/Employer Name',
    })

    static phone = createPhoneForm({
        selector: appEmplSelector,
        target: 'phone',
        group: 'phone',
        name: 'phone',
        required,
        label: 'Phone',
    })

    static urPhone = createPhoneForm({
        selector: appEmplSelector,
        target: 'urPhone',
        name: 'phone',
        required,
        label: 'Phone',
    })

    static address1 = createAddressForm({
        selector: appEmplSelector,
        target: 'address1',
        group: 'address1',
        name: 'address1',
    })

    static address2 = createAddressForm({
        selector: appEmplSelector,
        target: 'address2',
        group: 'address2',
        name: 'address2',
    }, { idx: 2, business: true })

    static addrZip = createAddrZipForm({
        selector: appEmplSelector,
        target: 'addrZip',
        group: 'addrZip',
        name: 'zip',
    })

    static addrCity = createAddrCityForm({
        selector: appEmplSelector,
        target: 'addrCity',
        group: 'addrCity',
        name: 'city',
    })

    static addrState = createAddrStateForm({
        selector: appEmplSelector,
        target: 'addrState',
        group: 'addrState',
        name: 'state',
    })

    static urAddress1 = createAddressForm({
        selector: appEmplSelector,
        target: 'urAddress1',
        name: 'address1',
    })

    static urAddress2 = createAddressForm({
        selector: appEmplSelector,
        target: 'urAddress2',
        name: 'address2',
    }, { idx: 2, business: true })

    static urAddrZip = createAddrZipForm({
        selector: appEmplSelector,
        target: 'urAddrZip',
        name: 'zip',
    })

    static urAddrCity = createAddrCityForm({
        selector: appEmplSelector,
        target: 'urAddrCity',
        name: 'city',
    })

    static urAddrState = createAddrStateForm({
        selector: appEmplSelector,
        target: 'urAddrState',
        name: 'state',
    })

    static startDate = createDateForm({
        selector: appEmplSelector,
        target: 'startDate',
        group: 'startDate',
        name: 'startedOn',
        required,
        label: 'Started on',
    })

    static position = createForm({
        selector: appEmplSelector,
        target: 'position',
        group: 'position',
        name: 'position',
        maxLength: 20,
        required,
        label: 'Position/Title',
    })

    static earnings = createForm({
        selector: appEmplSelector,
        target: 'earnings',
        group: 'earnings',
        mode: 'numeric',
        name: 'earnings',
        maxLength: 4,
        required,
        label: 'Monthly Earnings/Salary',
        validator: {
            sanitizer: value => Number(value.replace(/,/g, '')),
            rule: 'numeric',
        },
    })

    static FMCSR = createYesNoForm({
        selector: appEmplSelector,
        target: 'fmcsr',
        group: 'fmcsr',
        name: 'fmcsr',
        // disabled,
        label: 'Subject to FMCSRs',
    })
    static FMCSR2 = createForm({
        selector: appEmplSelector,
        target: 'fmcsr',
        group: 'fmcsr',
        type: 'checkbox',
        name: 'fmcsr',
        // disabled,
        label: 'Subject to FMCSRs',
        validator: {
            rule: 'boolean',
            sanitizer: value => value === 'on',
        },
    })

    static dotDat = createYesNoForm({
        selector: appEmplSelector,
        target: 'dotDat',
        group: 'dotDat',
        name: 'dotDat',
        label: 'Subject to DOT Drug/Alcohol Testing',
    })
    static dotDat2 = createForm({
        selector: appEmplSelector,
        target: 'dotDat',
        group: 'dotDat',
        type: 'checkbox',
        name: 'dotDat',
        label: 'Subject to DOT Drug/Alcohol Testing',
        validator: {
            rule: 'boolean',
            sanitizer: value => value === 'on',
        },
    })

    static RFL = createForm({
        selector: appEmplSelector,
        target: 'rfl',
        group: 'rfl',
        type: 'textarea',
        name: 'rfl',
        maxLength: length.driver.application.employment.rfl.max,
        required,
        label: 'Reason for Leaving',
    })

    static endDate = createDateForm({
        selector: appEmplSelector,
        target: 'endDate',
        group: 'endDate',
        name: 'leftOn',
        required,
        label: 'Termination Date',
    }, true)

    static endDate2 = createDateForm({
        selector: appEmplSelector,
        target: 'endDate',
        group: 'endDate',
        name: 'leftOn',
        label: 'Left on',
    })

    static gapExpl = createForm({
        selector: appEmplSelector,
        target: 'gapExpl',
        group: 'gapExpl',
        type: 'textarea',
        name: 'gapExpl',
        maxLength: length.driver.application.employment.gapExpl.max,
        required,
        disabled,
        label: 'Reason for Employment Gap',
    })

    static fax = createPhoneForm({
        selector: appEmplSelector,
        target: 'fax',
        name: 'fax',
        disabled,
        label: 'Fax',
    })

    static email = createEmailForm({
        selector: appEmplSelector,
        target: 'email',
        required,
        disabled,
        label: 'Email',
    })

    static inquiryMethod =  createForm({
        selector: appEmplSelector,
        target: `inquiryMethod`,
        // group: 'inquiryMethod',
        type: 'select',
        name: `method`,
        data: Employment.list.inquiryMethod,
        emptyOpt,
        required,
        label: 'Contact Method',
    })

    // static inquiryDate = createDateForm({
    //     selector: appEmplSelector,
    //     target: `inquiryDate`,
    //     // group: 'inquiryDate',
    //     name: `inquiredOn`,
    //     required,
    //     label: 'Date',
    // })

    static inquiryResponse = createForm({
        selector: appEmplSelector,
        target: 'inquiryResponse',
        // group: 'inquiryResponse',
        type: 'select',
        name: 'response',
        data: Employment.list.inquiryResponse,
        emptyOpt,
        required,
        disabled,
        label: 'Response',
    })

    static inquiryNote = createForm({
        selector: appEmplSelector,
        target: `inquiryNote`,
        // group: 'inquiryNote',
        // type: 'textarea',
        name: `note`,
        maxLength: 75,
        label: 'Note',
    })

    static verifComment = createForm({
        selector: appEmplSelector,
        target: 'verifComment',
        type: 'textarea',
        name: 'comment',
        maxLength: 100,
    })

    static verifStatus = createForm({
        selector: appEmplSelector,
        target: 'verifStatus',
        type: 'select',
        name: 'status',
        data: Employment.list.verifStatus,
        label: 'Verification Status',
    })


    static pvIncorrect = createForm({
        selector: appEmplSelector,
        target: 'pvIncorrect',
        type: 'checkbox',
        name: 'incorrect',
        label: 'Incorrect Info',
    })


    static pvTermType = createForm({
        selector: appEmplSelector,
        target: 'pvTermType',
        type: 'select',
        name: 'termType',
        data: Employment.list.termType,
        label: 'Termination Type',
    })


    static pvRehire = createForm({
        selector: appEmplSelector,
        target: 'pvRehire',
        type: 'select',
        name: 'rehire',
        data: Employment.list.rehire,
        label: 'Eligible for Rehire',
    })


    static validate = (target = 'employer', checkbox = false) => validate(EmploymentForm, () => {
        let fields = []

        switch (target) {
            case 'employer':
                fields = [
                    'employer', 'phone', 'address1', 'address2', 'addrZip', 'addrCity', 'addrState',
                    'startDate', 'position', 'earnings', 'RFL', 'endDate', 'usdot', 'FMCSR', 'dotDat',
                ]
                if (checkbox) {
                    fields.splice(-2)
                    fields.push('FMCSR2', 'dotDat2')
                }
                break
        }

        return fields
    })


}


for (let i = 0; i < 7; i++) {
    ApplicationForm[`expHours${i + 1}`] = createForm({
        selector: appSelector,
        group: 'expHours',
        type: 'number',
        name: `hours[${i}]`,
        step: '1',
        min: '0',
        max: '12',
        required,
        requiredLabel: false,
        label: true,
        // validator: {
        //     rule: 'numeric',
        //     sanitizer: value => +value,
        // },
    })
}


export default DriverForm
export { ApplicationForm, EmploymentForm }


export function currentExpediteVhlMMTData() {
    let vehicles = {
        van: {
            group: 'Cargo Van',
            data: Van.list.cargoMakeModel,
        },
        straightBox: {
            group: 'Box Truck',
            data: Truck.list.straightBoxMakeModel,
        },
    }

    const data = {}

    for (const type in vehicles) {
        const list = vehicles[type].data
        const { group } = vehicles[type]

        data[group] = {}

        for (const make in list) {
            const sublist = list[make]

            sublist.forEach(model => data[group][`${type}:${make}:${model}`] = `${make} ${model}`)
        }
    }

    data['Not found'] = { other: 'Other' }

    return data
}


export function descYears() {
    const year = new Date().getFullYear() + 1
    const list = {}

    for (let i = 0; i < 30; i++)
        list[`:${year - i}`] = year - i

    return list
}