import Tip from './tools/tip.mjs'
import { inputEvent } from '/modules/events/form.mjs'
import escapeHTML from '/modules/tools/utils/html.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import { capitalizeFirst } from '/modules/tools/utils/string.mjs'
import selector from '/modules/registry/selectors/company-refsource.mjs'

const interval = 30000

const { id } = selector
const HS = id.hidden
const nameId = id.text.name
const $currentName = $(selector.id.hidden.name)

const $modal = {
    all: $('.modal'),
    upsert: $('#refsrc-upsert-modal'),
    delete: $('#refsrc-delete-modal'),
    relationship: $('#refsrc-relationship-modal'),
}
const $title = {
    upsert: $('#refsrc-upsert-title'),
    relationship: $('#refsrc-relationship-title'),
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
const $form = {
    delete: $('#refsrc-delete-form'),
}
const $relationship = $('#refsrc-relationship')
const $srcDelName = $('#refsrc-delete-name')

const $id = {
    main: $(HS.id),
    delete: $(HS.deleteId),
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
    $id.main.val(null)
    $(nameId).val(null)
    $currentName.val(null)
    setTip.default('name')
    $button.upsert.html(null).removeClass('is-link is-success').prop('disabled', false)
    $title.upsert.html(null)
}

const closeDelete = () => {
    $modal.all.removeClass('is-active')
    $id.delete.val(null)
    $srcDelName.text(null)
    $form.delete.attr('action', '')
}


const displaySources = () => {
    $('.refsrc-edit, .refsrc-delete .refsrc-relationship').off('click')

    $.ajax({
        url: '/api/resource/refsources',
        success(response) {
            const { data } = response
            let i = 0, html = ''

            for (const [ idx, row ] of data.entries()) {
                const { _id, name, count } = row
                const { companies } = count
                const companyStyle = `is-${companies ? 'primary' : 'danger'}`

                if (i === 0) html += '<div class="columns">'

                html += '<div class="column is-one-quarter" style="min-width: 30rem;">'
                html += '<div class="card" style="min-height: 8.2rem;">'
                html += '<div class="card-content">'

                html += '<div style="display: flex; justify-content: space-between;">'
                html += `<span class="title mb-4"><span style="font-size: .85em;">${escapeHTML(name)}</span></span>`
                html += '<div class="dropdown is-hoverable is-right">'
                html += `<div class="dropdown-trigger"><button class="card-header-icon" aria-controls="refscr-dropdown-${idx}" style="padding-right: 0 !important;">`
                html += '<span class="icon"><i class="fas fa-ellipsis-vertical"></i></span></button></div>'
                html += `<div class="dropdown-menu" id="refsrc-dropdown-${idx}"><div class="dropdown-content">`
                html += `<a class="dropdown-item refsrc-edit" data-refsrc-id="${_id}">Edit</a>`
                if (!companies)
                    html += `<a class="dropdown-item has-text-danger refsrc-delete" data-refsrc-id="${_id}">Delete</a>`
                html += '</div></div></div></div>'

                html += '<div class="field is-grouped is-grouped-multiline">'

                html += '<div class="control"><div class="tags has-addons">'
                html += `<span class="tag">Companies</span>`
                html += `<a class="tag refsrc-relationship ${companyStyle}" data-relationship="companies" data-refsrc-id="${_id}">${companies}</a>`
                html += '</div></div>'

                html += '</div>'

                html += '</div></div></div>'

                if (i === 3 || idx === data.length) {
                    html += '</div>'
                    i = 0
                } else i++
            }

            $('#refsrc-list').html(html)

            $('.refsrc-edit, .refsrc-delete').on('click', function() {
                const _id = $(this).data('refsrc-id')
                let target = 'edit'
                if ($(this).hasClass('refsrc-delete')) target = 'delete'

                $.ajax({
                    url: `/api/resource/refsources/${_id}`,
                    success(response) {
                        const { _id, name } = response.data

                        if (target === 'edit') {
                            $id.main.val(_id)
                            $(nameId).val(name)
                            $currentName.val(name)
                            $title.upsert.html('<small>Edit Source</small>')
                            $button.upsert.html('Update').addClass('is-success')
                            $modal.upsert.addClass('is-active')
                        } else if (target === 'delete') {
                            $id.delete.val(_id)
                            $srcDelName.text(name)
                            $modal.delete.addClass('is-active')
                            $form.delete.attr('action', `/resource/delete/refsource/${_id}`)
                        }
                    },
                })
            })

            $('.refsrc-relationship').on('click', function() {
                const relType = $(this).data('relationship')
                const _id = $(this).data('refsrc-id')
                $('.modify-refsrc-relationship').off('change')

                $.ajax({
                    url: `/api/resource/refsources/${_id}/${relType}`,
                    success(response) {
                        const { data, resource: refSrc } = response
                        const { _id, name } = refSrc
                        $title.relationship.html(`<small>Assign ${capitalizeFirst(relType)} to</small> <strong>${escapeHTML(name)}</strong>`)

                        if (!data.all.length) {
                            $relationship.html(`<i class="has-text-danger-65">No ${relType} to assign</i>`)
                            return $modal.relationship.addClass('is-active')
                        }

                        const appliedIds = data.applied.map(item => item._id)

                        data.all.map(item => {
                            // item.name = new Person(item).fullName('AL') + ` <small>(${item.email}) - ${item.expansion.status} in ${item.expansion.location}</small>`
                            item.applied = appliedIds.includes(item._id)
                        })
                        data.all = sortArrayByObjectKey(data.all, 'name')

                        let list = '<div class="field">'
                        data.all.forEach(item => {
                            let attr = ` data-type="${relType}" data-id="${item._id}"`
                            if (item.applied) attr += ' checked'
                            list += '<div class="control"><label class="checkbox">'
                            list += `<input type="checkbox" class="modify-refsrc-relationship"${attr} />&nbsp; ${item.name}`
                            list += '</label></div>'
                        })
                        list += '</div>'

                        $relationship.html(list)

                        $('.modify-refsrc-relationship').on('change', function() {
                            const $checkbox = $(this)
                            const relType = $checkbox.data('type')
                            const _relId = $checkbox.data('id')
                            const checked = $checkbox.prop('checked')
                            const action = checked ? 'add' : 'delete'

                            $.ajax(`/api/update/refsource/${_id}/${action}/${relType}/${_relId}`, {
                                method: 'POST',
                                success(response) {
                                    const { done } = response
                                    if (!done) alert('Oops! Something went wrong!')
                                },
                                error(err) {
                                    console.error(err)
                                    alert(err.responseJSON.message)
                                },
                            })
                        })

                        $modal.relationship.addClass('is-active')
                    },
                })
            })
        },
    })
}


$('.delete').click(function() {
    closeUpsert()
    closeDelete()
})

$button.add.click(() => {
    $title.upsert.html('<small>New Source</small>')
    $button.upsert.html('Create').addClass('is-link')
    $modal.upsert.addClass('is-active')
})

$button.closeRel.click(() => {
    $('.modify-refsrc-relationship').off('change')
    $modal.relationship.removeClass('is-active')
    $title.relationship.html(null)
    $relationship.html(null)

    displaySources() //? location.reload()
})


displaySources()
setInterval(displaySources, interval)