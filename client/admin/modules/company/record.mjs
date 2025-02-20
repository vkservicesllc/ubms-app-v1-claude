import Tip from '../assets/tip.mjs'
import { busNameEvent, coTypeEvent, aliasEvent, einEvent, dunsEvent } from '../events/company.mjs'
import { urlEvent } from '../events/web.mjs'
import { inputEvent, selectEvent } from '../events/form.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import getIdFromUrl from '../assets/id.mjs'

const { catId, sinceId, einId, dunsId, busNameId, coTypeId, aliasId, websiteId } = formSelectors.company

const id = getIdFromUrl()
const duns = $(`#${dunsId}`).val()
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

if (id && id != 'new') {
    setTip.passed('name')
    setTip.passed('alias')
    setTip.passed('ein')
    if (duns) setTip.passed('duns')
}
$submit.prop('disabled', false)


const handleChange = (props = {}) => {
    let input = true
    const { data, key, current } = props
    for (const prop in data)
        if (!data[prop]) {
            input = false
            break
        }
    let action = input ? 'passed' : 'default'

    $.ajax('/api/unique/company', {
        method: 'POST',
        data,
        success(response) {
            const { unique, error } = response
            if (input && error) alert(error)
            if (input && !current && !unique) action = 'failed'

            setTip[action](key)
            if (formValid()) $tip.form.html(null)
        },
    })
}


const handleNameChange = (busName, coType) => {
    const currentBusName = $(`#current-${busNameId}`).val()
    const currentCoType = $(`#current-${coTypeId}`).val()

    if (busName && coType)
        handleChange({
            data: { busName, coType },
            current: busName === currentBusName && coType === currentCoType,
            key: 'name',
        })
}


selectEvent(catId, { fill: true })

einEvent(einId, {
    onInput() {
        setTip.default('ein')
    },
    onChange(ein) {
        const currentEin = $(`#current-${einId}`).val()
        const current = ein === currentEin

        handleChange({ data: { ein }, key: 'ein', current })
    },
})

dunsEvent(dunsId, {
    onInput() {
        setTip.default('duns')
    },
    onChange(duns) {
        const currentDuns = $(`#current-${dunsId}`).val()
        const current = duns === currentDuns

        handleChange({ data: { duns }, key: 'duns', current })
    },
})

busNameEvent(busNameId, coTypeId, {
    onInput() {
        setTip.default('name')
    },
    onChange(busName, coType) {
        handleNameChange(busName, coType)
    },
})

coTypeEvent(coTypeId, busNameId, (coType, busName) => {
    handleNameChange(busName, coType)
})

aliasEvent(aliasId, {
    onInput() {
        setTip.default('alias')
    },
    onChange(alias) {
        const currentAlias = $(`#current-${aliasId}`).val()
        const current = alias === currentAlias

        handleChange({ data: { alias }, key: 'alias', current })
    },
})

urlEvent(websiteId, {
    onInput() {
        $tip.website.html(null)
    },
    onChange(website, valid, $website) {
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