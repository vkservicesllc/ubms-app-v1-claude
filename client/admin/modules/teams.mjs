import escapeHTML from '/modules/assets/html.mjs'
import { teamNameEvent, teamDescEvent } from '/modules/events/team.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import inputLength from '/modules/registry/length.mjs'
import { sortArrayByObjectKey } from '/modules/tools/sorter.mjs'
import { capitalizeFirst } from '/modules/tools/string.mjs'

const categories = $.ajax('/api/assets/company?filter=categories', { async: false, method: 'POST' }).responseJSON
const interval = 30000
const { class: teamClass, id, catId, nameId, descId } = formSelectors.team

const $modal = {
    all: $('.modal'),
    upsert: $('#team-upsert-modal'),
    relationship: $('#team-relationship-modal'),
}
const $title = {
    upsert: $('#team-upsert-title'),
    relationship: $('#team-relationship-title'),
}
const $button = {
    add: $('#team-add-button'),
    upsert: $('#team-upsert-button'),
    delete: $('#team-delete-button'),
    closeRel: $('#team-relationship-close-button'),
}
const $relationship = $('#team-relationship')

const countDescChars = desc => {
    const { max } = inputLength.team.desc
    let used = 0, left = max

    if (desc) {
        const { length } = desc

        used = length
        left = max - length
    }

    $('#desc-char-used').text(used)
    $('#desc-char-left').text(left)
}

teamNameEvent()
teamDescEvent({
    onInput(desc) {
        countDescChars(desc)
    },
    onChange(desc) {
        countDescChars(desc)
    },
})

const closeUpsert = () => {
    $modal.all.removeClass('is-active')
    $(`.${teamClass}`).val(null)
    $button.delete.hide()
    $button.upsert.html(null)
    $title.upsert.html(null)
    $(`#${catId}`).attr('disabled', false)
    countDescChars()
}

const displayTeams = () => {
    $('.team-edit').off('click')
    $('.team-relationship').off('click')

    $.ajax({
        url: '/api/teams',
        method: 'POST',
        success(response) {
            const data = sortArrayByObjectKey(response.data, 'name')
            let i = 0, html = ''

            for (const [ idx, row ] of data.entries()) {
                const { _id, name, description, catId, count } = row
                const { companies, users } = count
                const companyStyle = `is-${companies ? 'primary' : 'danger'}`
                const userStyle = `is-${users ? 'primary' : 'danger'}`

                if (i === 0) html += '<div class="columns">'

                html += '<div class="column is-one-fifth">'
                html += '<div class="card">'
                html += '<div class="card-content">'

                html += `<p class="title"><a class="team-edit" data-team-id="${_id}">${escapeHTML(name)}</a></p>`
                if (description) html += `<p class="subtitle has-text-primary-30 mt-2">${escapeHTML(description)}</p>`

                html += '<div class="field is-grouped is-grouped-multiline">'

                html += '<div class="control"><div class="tags has-addons">'
                html += `<span class="tag">${categories[catId].item[0]}</span>`
                html += `<a class="tag team-relationship ${companyStyle}" data-relationship="companies" data-team-id="${_id}">${companies}</a>`
                html += '</div></div>'

                html += '<div class="control"><div class="tags has-addons">'
                html += `<span class="tag">Users</span>`
                html += `<a class="tag team-relationship ${userStyle}" data-relationship="users" data-team-id="${_id}">${users}</a>`
                html += '</div></div>'

                html += '</div></div></div></div>'

                if (i === 4 || idx === data.length) {
                    html += '</div>'
                    i = 0
                } else i++
            }

            $('#team-list').html(html)

            $('.team-edit').on('click', function() {
                const _id = $(this).data('team-id')

                $.ajax({
                    url: `/api/team/${_id}`,
                    method: 'POST',
                    success(response) {
                        const { _id, catId: category, name, description, count } = response.data
                        const { companies, users } = count

                        $(`#${id}`).val(_id)
                        $(`#current-${nameId}, #${nameId}`).val(name)
                        $(`#${catId}`).val(category)
                        if (companies) $(`#${catId}`).attr('disabled', true)
                        $(`#${descId}`).val(description)

                        $title.upsert.html(`<small>Modify Team</small> <strong>${escapeHTML(name)}</strong>`)
                        $button.upsert.html('Update')
                        if (!companies && !users) $button.delete.show()
                        countDescChars(description)
                        $modal.upsert.addClass('is-active')
                    },
                })
            })

            $('.team-relationship').on('click', function() {
                const relType = $(this).data('relationship')
                const _id = $(this).data('team-id')

                $.ajax({
                    url: `/api/team/${_id}/${relType}`,
                    method: 'POST',
                    success(response) { console.log(response.data)
                        const { team, data, error } = response.data
                        const { _id, name } = team

                        if (error) console.error(error)
                        $title.relationship.html(`<small>Assign ${capitalizeFirst(relType)} to</small> <strong>${escapeHTML(name)}</strong>`)

                        //* list of items with checkboxes
                        let list = '<div class="checkboxes">'
                        data[relType].all.forEach(item => {
                            let attr = ` data-type="${relType}" data-id="${item._id}"`
                            if (item.applied) attr += ' checked'

                            list += '<p><label class="checkbox">'
                            list += `<input type="checkbox"${attr} />&nbsp; ${item.name}`
                            if (item.desc) list += ` <small><i>(${item.desc})</i></small>`
                            list += '</label></p>'
                        })
                        list += '</div>'

                        $relationship.html(list)
                        $modal.relationship.addClass('is-active')
                    },
                })
            })
        },
    })
}

$('.delete').click(closeUpsert)

$button.add.click(() => {
    $title.upsert.html('<small>New Team</small>')
    $button.upsert.html('Create')
    $modal.upsert.addClass('is-active')
})

$button.delete.click(function() {
    const name = $(`#current-${nameId}`).val()

    if (confirm(`Confirm deletion: Are you sure you want to delete "${name}"!`)) {
        const _id = $(`#${id}`).val()

        $.ajax({
            url: `/api/team/${_id}`,
            method: 'DELETE',
            success(response) {
                if (response.deleted) { // location.reload()
                    displayTeams()
                    closeUpsert()
                }
            },
        })
    }
})

$button.closeRel.click(() => {
    $modal.relationship.removeClass('is-active')
    $title.relationship.html(null)
    $relationship.html(null)

    displayTeams() // location.reload()
})


displayTeams()
setInterval(displayTeams, interval)