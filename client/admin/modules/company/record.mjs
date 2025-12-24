import Tip from '../tools/tip.mjs'
import getIdFromUrl from '../tools/id.mjs'
import { categoryEvent, busNameEvent, coTypeEvent, aliasEvent, einEvent, dunsEvent } from '../events/company.mjs'
import { urlEvent } from '../events/web.mjs'
import { inputEvent } from '../events/form.mjs'
import selector from '../registry/selectors/company.mjs'

const TS = selector.id.text, SS = selector.id.select
const catId = SS.category
const sinceId = TS.since
const einId = TS.ein
const dunsId = TS.duns
const busNameId = TS.busName
const coTypeId = SS.coType
const aliasId = TS.alias
const websiteId = TS.website

const _id = getIdFromUrl()
const duns = $(dunsId).val()
const $submit = $('#record-submit')
const $form = $('#record-form')

const $tip = {
    name: $('#busname-tip'),
    alias: $('#alias-tip'),
    ein: $('#ein-tip'),
    duns: $('#duns-tip'),
    website: $('#website-tip'),
    form: $('#company-form-tip'),
}

const tipDefs = {}
for (const key in $tip)
    tipDefs[key] = $tip[key].html()

const message = {
    success: {
        name: 'Name is unique',
        alias: 'Alias is unique',
        ein: 'EIN is unique',
        duns: 'DUNS is unique',
    },
    failed: {
        name: 'Name is taken',
        alias: 'Alias is taken',
        ein: 'EIN is taken',
        duns: 'DUNS is taken',
    },
}

const setTip = new Tip($tip, tipDefs, message)

if (_id && _id !== 'new') {
    setTip.passed('name')
    setTip.passed('alias')
    setTip.passed('ein')
    if (duns) setTip.passed('duns')
}
$submit.prop('disabled', false)


const handleChange = (props = {}) => {
    let input = true, action = 'passed'
    const { data, key } = props

    for (const prop in data)
        if (!data[prop]) {
            input = false
            break
        }
    if (!input) action = 'default'

    if (_id !== 'new') data._id = _id

    $.ajax('/api/unique/company', {
        method: 'POST',
        data,
        success(response) {
            const { unique, original } = response

            if (input && !unique && !original)
                action = 'failed'

            setTip[action](key)
            if (formValid()) $tip.form.html(null)
        },
    })
}


categoryEvent(catId, 'business-category-select-icon')

einEvent(einId, {
    onInput() {
        setTip.default('ein')
    },
    onChange(ein) {
        handleChange({ data: { ein }, key: 'ein' })
    },
})

dunsEvent(dunsId, {
    onInput() {
        setTip.default('duns')
    },
    onChange(duns) {
        handleChange({ data: { duns }, key: 'duns' })
    },
})

busNameEvent(busNameId, coTypeId, {
    onInput() {
        setTip.default('name')
    },
    onChange(busName, coType) {
        handleChange({ data: { busName, coType }, key: 'name' })
    },
})

coTypeEvent(coTypeId, busNameId, (coType, busName) => {
    handleChange({ data: { busName, coType }, key: 'name' })
})

aliasEvent(aliasId, {
    onInput() {
        setTip.default('alias')
    },
    onChange(alias) {
        handleChange({ data: { alias }, key: 'alias' })
    },
})

urlEvent(websiteId, {
    onInput() {
        $tip.website.html(null)
    },
    onChange(website, valid) {
        if (website && !valid)
            $tip.website.html('<i class="fa fa-triangle-exclamation"></i> Invalid website')
    },
})

inputEvent(sinceId, {
    datepicker: { maxDate: 0 },
})

$form.submit(function(event) {
    event.preventDefault()

    if (!formValid())
        $tip.form
            .html('<i class="fas fa-close"></i>&nbsp; Records can not have dublicates<br /><i class="fas fa-close"></i>&nbsp; Data can not be submitted')
    else
        $(this).unbind().submit()
})


function formValid() {
    let valid = true

    for (const tipId of [ 'busname', 'alias', 'ein', 'duns' ]) {
        if (!$(`#${tipId}-tip`).hasClass('is-danger')) continue

        valid = false
        break
    }

    return valid
}