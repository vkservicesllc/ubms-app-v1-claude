import { formLabel, formInput, formTextArea } from '../../client/global/modules/assets/html.mjs'
import { Label as CompanyLabel, Select as CompanySelect } from './company.mjs'
import { formSelectors } from '../../client/global/modules/registry/selectors.mjs'
import inputLength from '../../client/global/modules/registry/length.mjs'


const { class: teamClass, id, catId, nameId, descId } = formSelectors.team


export class Label {

    static catId = (props = {}) => CompanyLabel.catId({ ...props, for: catId })

    static name = (props = {}) => formLabel({
        content: 'Team Name',
        ...props,
        for: nameId,
        addClass: 'required',
    })

    static description = (props = {}) => formLabel({
        content: 'Description',
        ...props,
        for: descId,
    })

}


export class Input {

    static id = (value = null, props = {}) => formInput({
        type: 'hidden',
        id,
        ...props,
        addClass: teamClass,
        name: '_id',
        value,
    })

    static name = (props = {}, current = false) => {
        const type = current === true ? 'hidden' : 'text'
        let id = nameId, name, maxLength
        if (current === true) id = `current-${id}`
        else {
            name = 'name'
            maxLength = inputLength.team.name.max
        }

        return formInput({
            ...props,
            type,
            id,
            addClass: teamClass,
            name,
            maxLength,
            required: current === false,
        })
    }

    static description = (props = {}) => formTextArea({
        ...props,
        id: descId,
        addClass: teamClass,
        name: 'description',
        maxLength: inputLength.team.desc.max,
    })

}


export class Select {

    static catId = (props = {}) => CompanySelect.catId({ ...props, id: catId, addClass: teamClass })

}