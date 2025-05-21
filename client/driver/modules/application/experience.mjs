import { inputEvent, selectEvent } from '/modules/events/form.mjs'
import formId, { check, onInput, onChange, onBlur, onSubmit } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'


const TS = selector.id.text, SS = selector.id.select, RS = selector.id.radio, CS = selector.id.checkbox
const cmvExpId = RS.cmvExp
const cdlSchoolId = RS.cdlSchool


inputEvent(`${cmvExpId.yes}, ${cmvExpId.no}`, {
    onChange(value) {
        const $cols = $('.vehicle-experience-col-width')
        const $form = $('.cmv-experience')
        const $checkboxes = $form.find('[type="checkbox"]')
        let disabled = false, action = 'show', colClass = 'col-md-4'

        if (value === 'N') {
            disabled = true
            action = 'hide'
            colClass = 'col-md-6'
        }

        $cols.removeClass('col-md-4 col-md-6')
        $cols.addClass(colClass)
        $checkboxes.prop('disabled', disabled)
        $form[action]()
    },
})

inputEvent(`${cdlSchoolId.yes}, ${cdlSchoolId.no}`, {
    onChange(value) {
        const $form = $('#cdl-school-form')
        const $fields = $form.find('input, select')
        let disabled = true, action = 'hide'

        if (value === 'Y') {
            disabled = false
            action = 'show'
        }

        $fields.prop('disabled', disabled)
        $form[action]()
    },
})