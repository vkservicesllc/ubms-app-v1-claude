import Tip from './tools/tip.mjs'
import { inputEvent } from '/modules/events/form.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import selector from '/modules/registry/selectors/company-refsource.mjs'

const interval = 30000

const { id } = selector
const HS = id.hidden
const nameId = id.text.name
const $currentName = $(selector.id.hidden.name)

const $modal = {
    all: $('.modal'),
    upsert: $('#refsrc-upsert-modal'),
}
const $title = {
    upsert: $('#refsrc-upsert-title'),
}
const $tip = {
    name: $('#refsrc-name-tip'),
}
const tipDefs = {
    name: null,
}
const message = {
    success: {
        name: 'Name is unqiue',
    },
    failed: {
        name: 'Name is taken',
    },
}
const $button = {
    add: $('#refsrc-add-button'),
    upsert: $('#refsrc-upsert-button'),
    delete: $('#refsrc-delete-button'),
    closeRel: $('#refsrc-relationship-close-button'),
}
const $relationship = $('#refsrc-relationship')

const $id = {
    main: $(HS.id),
}

const setTip = new Tip($tip, tipDefs, message)

inputEvent(nameId, {
    strip: true,
    word: true,
    capitalize: 'each',
    onInput() {
        setTip.default('name')
        $button.upsert.prop('disabled', false)
    },
    onChange(name) {
        let action = name ? 'passed' : 'default'
        const _id = $id.main.val()
        const currentName = $currentName.val()

        if (name)
            $.ajax('/api/unique/refsource', {
                method: 'POST',
                data: { name },
                success(response) {
                    const { unique } = response

                    let disabled = false
                    if (name && name !== currentName && !unique) {
                        action = 'failed'
                        disabled = true
                    }

                    setTip[action]('name')
                    $button.upsert.prop('disabled', disabled)
                },
            })
    },
})

const closeUpsert = () => {
    $modal.all.removeClass('is-active')
    $(nameId).val(null)
    $currentName.val(null)
    setTip.default('name')
    $button.upsert.html(null).removeClass('is-link is-success').prop('disabled', false)
    $title.upsert.html(null)
}


const displaySources = () => {
    $('.refsrc-edit, .refsrc-relationship').off('click')

    $.ajax({
        url: '/api/resource/refsources',
        success(response) {
console.table(response.data)
            const { data } = response
            let i = 0, html = ''

            for (const [ idx, row ] of data.entries()) {
                const { _id, name, count } = row
                const { companies } = count
                const companyStyle = `is-${companies ? 'primary' : 'danger'}`

                if (i === 0) html += '<div class="columns">'

                html += '<div class="column is-one-quarter" style="min-width: 10rem;">'
                html += '<div class="card" style="min-height: 10rem;">'
                html += '<div class="card-content">'

                html += `<p class="title mb-2"><small>${escapeHTML(name)}</small></p>`

                html += '</div></div></div>'

                if (i === 3 || idx === data.length) {
                    html += '</div>'
                    i = 0
                } else i++
            }

            $('#refsrc-list').html(html)
        },
    })
}


$('.delete').click(closeUpsert)

$button.add.click(() => {
    $title.upsert.html('<small>New Source</small>')
    $button.upsert.html('Create').addClass('is-link')
    $modal.upsert.addClass('is-active')
})


displaySources()
setInterval(displaySources, interval)