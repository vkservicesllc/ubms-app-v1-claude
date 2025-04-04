import Person from '../../client/global/modules/assets/person.mjs'
import Address from '../../client/global/modules/assets/address.us.mjs'
import Driver from '../assets/driver.mjs'
import { formLabel, formInput, formTextArea, formSelect } from '../../client/global/modules/assets/html.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'


const {
    class: driverClass,
    firstNameId,
    middleNameId,
    lastNameId,
    suffixId,
    dobId,
    ssnId,
    sexId,
    phoneId,
    emailId,
    addrSinceId,
    stateId,
    positionId,
    statusExpId,
    aplPinId,
    dlNumId,
    dlClassId,
    dlStateId,
    dlIssId,
    dlExpId,
    dlEndorseId,
    dlRestrId,
    dlDeniedId,
    dlDeniedExplId,
    dlRevokedId,
    dlRevokedExplId,
} = formSelectors.driver


export class Label {

    static name = (flag, props = {}) => {
        if (![ 'f', 'm', 'l', 's' ].includes(flag)) return

        const content = { f: 'First Name', m: 'Middle Name', l: 'Last Name', s: 'Suffix' }[flag]
        const id = { f: firstNameId, m: middleNameId, l: lastNameId, s: suffixId }[flag]
        const addClass = flag == 'f' || flag == 'l' ? 'required' : null

        return formLabel({
            content,
            ...props,
            for: id,
            addClass,
        })
    }

    static dob = (props = {}) => formLabel({
        content: 'Date of Birth',
        addClass: 'required',
        ...props,
        for: dobId,
    })

    static ssn = (props = {}) => formLabel({
        content: 'Social Security Number',
        ...props,
        for: ssnId,
        addClass: 'required',
    })

    static gender = (props = {}) => formLabel({
        content: 'Gender',
        ...props,
        for: sexId,
        addClass: 'required',
    })

    static phone = (props = {}) => formLabel({
        content: 'US Phone',
        addClass: 'required',
        ...props,
        for: phoneId,
    })

    static email = (props = {}) => formLabel({
        content: 'Email',
        ...props,
        for: emailId,
        addClass: 'required',
    })

    static addrSince = (props = {}) => formLabel({
        content: 'Living since',
        ...props,
        for: addrSinceId,
        addClass: 'required',
    })

    static position = (props = {}) => formLabel({
        content: 'Desired Position',
        ...props,
        for: positionId,
    })

    static statusExp = (props = {}) => formLabel({
        content: 'Status Expires on',
        ...props,
        for: statusExpId,
    })

    static pin = (props = {}) => formLabel({
        content: 'PIN',
        ...props,
        for: aplPinId,
    })

    static dlNum = (props = {}) => formLabel({
        content: 'ID #',
        ...props,
        addClass: 'required',
        for: dlNumId,
    })

    static dlClass = (props = {}) => formLabel({
        content: 'Class',
        ...props,
        addClass: 'required',
        for: dlClassId,
    })

    static dlState = (props = {}) => formLabel({
        content: 'State',
        ...props,
        addClass: 'required',
        for: dlStateId,
    })

    static dlIss = (props = {}) => formLabel({
        content: 'Issued on',
        ...props,
        addClass: 'required',
        for: dlIssId,
    })

    static dlExp = (props = {}) => formLabel({
        content: 'Expires on',
        ...props,
        addClass: 'required',
        for: dlExpId,
    })

    static dlEndorse = (props = {}) => formLabel({
        content: 'Endorsements',
        ...props,
        for: dlEndorseId,
    })

    static dlRestr = (props = {}) => formLabel({
        content: 'Restrictions',
        ...props,
        for: dlRestrId,
    })

    static problem = (target, tag, props = {}) => {
        if (!['dl-denied', 'dl-revoked'].includes(target)) return
        if (!['yes', 'no', 'expl'].includes(tag)) return

        let id
        const content = { yes: 'Yes', no: 'No', expl: 'Explain what happened' }[tag]

        switch (target) {
            case 'dl-denied':
                if (tag == 'expl') id = dlDeniedExplId
                else id = `${dlDeniedId}-${tag}`
                break
            case 'dl-revoked':
                if (tag == 'expl') id = dlRevokedExplId
                else id = `${dlRevokedId}-${tag}`
                break
        }

        return formLabel({
            content,
            ...props,
            for: id,
        })
    }

}


export class Input {

    static name = (flag, props = {}) => {
        if (![ 'f', 'm', 'l', 's' ].includes(flag)) return

        const name = { f: 'firstName', m: 'middleName', l: 'lastName', s: 'suffix' }[flag]
        let type = 'text'

        let id, maxLength, addClass, required
        if (flag != 's') {
            id = { f: firstNameId, m: middleNameId, l: lastNameId }[flag]
            maxLength = inputLength.person[name].max
            addClass = driverClass
            required = !(flag == 'm')
        } else type = 'hidden'

        return formInput({
            ...props,
            type,
            addClass,
            id,
            name,
            maxLength,
            required,
        })
    }

    static dob = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: dobId,
        name: 'dob',
        required: true,
    })

    static gender = (props = {}) => formInput({
        ...props,
        type: 'hidden',
        id: sexId,
        name: 'sex',
        required: true,
    })

    static ssn = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: ssnId,
        name: 'ssn',
        required: true,
    })

    static phone = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: phoneId,
        name: 'phone',
        required: true,
    })

    static email = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: emailId,
        name: 'email',
        maxLength: inputLength.contact.email.maxLength,
        required: true,
    })

    static addrSince = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: addrSinceId,
        name: 'addrSince',
        required: true,
    })

    static state = (props = {}) => formInput({
        ...props,
        type: 'hidden',
        id: stateId,
        name: 'state',
        required: true,
    })

    static position = (props = {}) => formInput({
        ...props,
        type: 'hidden',
        id: positionId,
        name: 'position',
    })

    static statusExp = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: statusExpId,
        name: 'statusExpiresOn',
        required: true,
        disabled: true,
    })

    static pin = (props = {}) => formInput({
        ...props,
        type: 'password',
        addClass: driverClass,
        id: aplPinId,
        name: 'pin',
        maxLength: 4,
        required: true,
        disabled: true,
    })

    static dlNum = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: dlNumId,
        name: 'number',
        maxLength: inputLength.driverLicense.number.max,
        required: true,
    })

    static dlIss = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: dlIssId,
        name: 'issuedOn',
        required: true,
    })

    static dlExp = (props = {}) => formInput({
        ...props,
        addClass: driverClass,
        id: dlExpId,
        name: 'expiresOn',
        required: true,
    })

    static dlEndorse = (props = {}) => formTextArea({
        ...props,
        addClass: driverClass,
        id: dlEndorseId,
        name: 'endorsement',
        maxLength: inputLength.driverLicense.endorsement.max,
    })

    static dlRestr = (props = {}) => formTextArea({
        ...props,
        addClass: driverClass,
        id: dlRestrId,
        name: 'restriction',
        maxLength: inputLength.driverLicense.restriction.max,
    })

    static problem = ( target, tag, props = {}) => {
        if (!['dl-denied', 'dl-revoked'].includes(target)) return
        if (!['yes', 'no', 'expl'].includes(tag)) return

        let id, name, value
        if (tag != 'expl') value = { yes: '1', no: '0' }[tag]
        const required = tag == 'yes'

        switch (target) {
            case 'dl-denied':
                if (tag == 'expl') {
                    id = dlDeniedExplId
                    name = 'deniedExpl'
                } else {
                    id = `${dlDeniedId}-${tag}`
                    name = 'denied'
                }
                break
            case 'dl-revoked':
                if (tag == 'expl') {
                    id = dlRevokedExplId
                    name = 'revokedExpl'
                } else {
                    id = `${dlRevokedId}-${tag}`
                    name = 'revoked'
                }
                break
        }

        props = { value, ...props, id, name, required } //* order is important

        if (tag == 'expl') {
            props.maxLength = inputLength.driverLicense.problemExpl.max

            return formTextArea(props)
        } else {
            props.type = 'radio'

            return formInput(props)
        }
    }

}


export class Select {

    static suffix = (props = {}) => Person.formSelect('suffix', {
        ...props,
        addClass: driverClass,
        id: suffixId,
        name: 'suffix',
    })

    static gender = (props = {}) => Person.formSelect('gender', {
        ...props,
        addClass: driverClass,
        id: sexId,
        name: 'sex',
        required: true,
    })

    static position = (props = {}, altData) => formSelect({
        ...props,
        addClass: driverClass,
        id: positionId,
        name: 'position',
    }, altData || Driver.positionList, props.options || {})

    static dlClass = (props = {}, commercial = false) => {
        let list = Driver.dlClassList
        if (commercial) list = list.filter(dlClass => dlClass.commercial === true)

        const data = {}
        list.forEach(dlClass => {
            const { id, name } = dlClass
            data[id] = name
        })

        return formSelect({
            ...props,
            addClass: driverClass,
            id: dlClassId,
            name: 'class',
            required: true,
        }, data, props.options || {})
    }

    static dlState = (props) => formSelect({
        ...props,
        addClass: driverClass,
        id: dlStateId,
        name: 'state',
        required: true,
    }, Address.stateList, props.options || {})

}