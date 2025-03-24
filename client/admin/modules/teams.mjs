import Tip from './assets/tip.mjs'
import escapeHTML from '/modules/assets/html.mjs'
import { teamNameEvent, teamDescEvent } from '/modules/events/team.mjs'
import { catIdEvent, busNameEvent, coTypeEvent } from '/modules/events/company.mjs'
import { telEvent, emailEvent } from '/modules/events/contacts.mjs'
import { urlEvent } from '/modules/events/web.mjs'
import { addr1Event, addr2Event, cityEvent, zipEvent } from '/modules/events/address.mjs'
import { formSelectors } from '/modules/registry/selectors.mjs'
import inputLength from '/modules/registry/length.mjs'
import { sortArrayByObjectKey } from '/modules/tools/sorter.mjs'
import { capitalizeFirst } from '/modules/tools/string.mjs'
import { tel as formatTel } from '/modules/tools/formatter.mjs'

const categories = $.ajax('/api/assets/company?filter=categories', { async: false, method: 'POST' }).responseJSON
const interval = 30000
const {
    class: teamClass, id, catId, nameId, descId,
    busNameId, coTypeId, phoneId, emailId, websiteId,
    addr1Id, addr2Id, cityId, stateId, zipId,
} = formSelectors.team

const ids = {
    catIdIcon: 'team-category-select-icon',
}
const defaults = {
    catIdIcon: $(`#${ids.catIdIcon}`).html(),
}
const $modal = {
    all: $('.modal'),
    upsert: $('#team-upsert-modal'),
    relationship: $('#team-relationship-modal'),
    profile: $('#team-profile-modal'),
    settings: $('#team-settings-modal'),
}
const $title = {
    upsert: $('#team-upsert-title'),
    relationship: $('#team-relationship-title'),
    profile: $('#team-profile-title'),
    settings: $('#team-settings-title'),
}
const $tip = {
    name: $('#team-name-tip'),
    email: $('#team-email-tip'),
    website: $('#team-website-tip'),
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
    add: $('#team-add-button'),
    upsert: $('#team-upsert-button'),
    delete: $('#team-delete-button'),
    closeRel: $('#team-relationship-close-button'),
}
const $relationship = $('#team-relationship')

const setTip = new Tip($tip, tipDefs, message)

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

teamNameEvent({
    onInput() {
        setTip.default('name')
        $button.upsert.prop('disabled', false)
    },
    onChange(name, $name) {
        const currentName = $(`#current-${nameId}`).val()
        let action = name ? 'passed' : 'default'

        if (name)
            $.ajax('/api/unique/team', {
                method: 'POST',
                data: { name },
                success(response) {
                    const { unique, error } = response
                    if (error) alert(error)

                    let disabled = false
                    if (name && (!currentName || name != currentName) && !unique) {
                        action = 'failed'
                        disabled = true
                    }

                    setTip[action]('name')
                    $button.upsert.prop('disabled', disabled)
                },
            })
    },
})

catIdEvent(catId, ids.catIdIcon)

teamDescEvent({
    onInput(desc) {
        countDescChars(desc)
    },
    onChange(desc) {
        countDescChars(desc)
    },
})

busNameEvent(busNameId, coTypeId)

coTypeEvent(coTypeId, busNameId)

telEvent(phoneId)

emailEvent(emailId, {
    onInput() {
        $tip.email.html(null)
    },
    onChange(email, valid) {
        if (email && !valid)
            $tip.email.html('<i class="fa fa-triangle-exclamation"></i> Invalid email')
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

addr1Event(addr1Id, { addr2Id })

addr2Event(addr2Id)

zipEvent(zipId, { cityId, stateId })

cityEvent(cityId)


const closeUpsert = () => {
    const $catId = $(`#${catId}`)

    $modal.all.removeClass('is-active')
    $(`.${teamClass}`).val(null)
    setTip.default('name')
    $button.delete.hide()
    $button.upsert.html(null).removeClass('is-link is-success').prop('disabled', false)
    $title.upsert.html(null)
    $catId.attr('disabled', false)
    if (!$catId.find('option[value=""]').length)
        $catId.prepend('<option value="">--</option>').val(null)
    $(`#${ids.catIdIcon}`).html(defaults.catIdIcon)
    countDescChars()
}

const displayTeams = () => {
    $('.team-edit, .team-relationship, .team-profile, .team-settings').off('click')

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

                html += `<div><a class="has-text-grey team-profile" data-team-id="${_id}"><i class="fas fa-briefcase"></i></a></div>`
                html += `<div><a class="has-text-grey team-settings" data-team-id="${_id}">${categories[catId].icon || defaults.catIdIcon}</a></div>`

                html += '</div></div></div></div>'

                if (i === 4 || idx === data.length) {
                    html += '</div>'
                    i = 0
                } else i++
            }

            $('#team-list').html(html)

            $('.team-edit, .team-profile, .team-settings').on('click', function() {
                const _id = $(this).data('team-id')
                let target = 'edit'
                if ($(this).hasClass('team-profile')) target = 'profile'
                if ($(this).hasClass('team-settings')) target = 'settings'

                $.ajax({
                    url: `/api/team/${_id}`,
                    method: 'POST',
                    success(response) {
                        const { _id, name } = response.data

                        if (target == 'edit') {
                            const { catId: category, description, count } = response.data
                            const { companies, users } = count
                            const $catId = $(`#${catId}`)

                            $(`#${id}`).val(_id)
                            $(`#current-${nameId}, #${nameId}`).val(name)
                            $catId.val(category).find('option[value=""]').remove()
                            if (companies) $catId.attr('disabled', true)
                            $(`#${ids.catIdIcon}`).html(categories[category].icon || defaults.catIdIcon)
                            $(`#${descId}`).val(description)

                            $title.upsert.html(`<small>Modify Team</small> <strong>${escapeHTML(name)}</strong>`)
                            setTip.passed('name')
                            $button.upsert.html('Update').addClass('is-success')
                            if (!companies && !users) $button.delete.show()
                            countDescChars(description)
                            $modal.upsert.addClass('is-active')
                        } else if (target == 'profile') {
                            $(`#profile-${id}`).val(_id)
                            const { profile } = response.data

                            if (profile) {
                                const { busName, coType, phone, email, website } = profile
                                const { address1, address2, city, state, zip } = profile.address

                                if (busName && coType) {
                                    $(`#${busNameId}`).val(busName)
                                    $(`#${coTypeId}`).val(coType)
                                    $(`#${phoneId}`).val(formatTel(phone))
                                    $(`#${emailId}`).val(email)
                                    $(`#${websiteId}`).val(website)
                                    $(`#${addr1Id}`).val(address1)
                                    $(`#${addr2Id}`).val(address2)
                                    $(`#${zipId}`).val(zip)
                                    $(`#${cityId}`).val(city)
                                    $(`#${stateId}`).val(state)
                                }
                            }

                            $title.profile.html(`<strong>${escapeHTML(name)}</strong> <small>Profile</small>`)

                            $modal.profile.addClass('is-active')
                        } else if (target == 'settings') {
                            $(`#settings-${id}`).val(_id)

                            $title.settings.html(`<strong>${escapeHTML(name)}</strong> <small>Settings</small>`)

                            $modal.settings.addClass('is-active')
                        }
                    },
                })
            })

            $('.team-relationship').on('click', function() {
                const relType = $(this).data('relationship')
                const _id = $(this).data('team-id')

                $.ajax({
                    url: `/api/team/${_id}/${relType}`,
                    method: 'POST',
                    success(response) {
                        const { team, data } = response.data
                        const { _id, name } = team

                        $title.relationship.html(`<small>Assign ${capitalizeFirst(relType)} to</small> <strong>${escapeHTML(name)}</strong>`)

                        let list = '<div class="checkboxes">'
                        data[relType].all.forEach(item => {
                            let attr = ` data-type="${relType}" data-id="${item._id}"`
                            if (item.applied) attr += ' checked'

                            list += '<p><label class="checkbox">'
                            list += `<input type="checkbox" class="modify-team-relationship"${attr} />&nbsp; ${escapeHTML(item.name)}`
                            if (item.desc) list += ` <small><i>(${escapeHTML(item.desc)})</i></small>`
                            list += '</label></p>'
                        })
                        list += '</div>'

                        $relationship.html(list)

                        $('.modify-team-relationship').on('change', function() {
                            const $checkbox = $(this)
                            const relType = $checkbox.data('type')
                            const _relId = $checkbox.data('id')
                            const checked = $checkbox.prop('checked')
                            const action = checked ? '+' : '-'

                            $.ajax(`/api/team/${_id}/${relType}/${_relId}`, {
                                method: 'POST',
                                data: { action },
                                success(response) {
                                    const { modified, error } = response

                                    if (error || !modified) {
                                        if (error) alert(error)

                                            $checkbox.prop('checked', !checked)
                                    }
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

$('.delete').click(closeUpsert)

$button.add.click(() => {
    $title.upsert.html('<small>New Team</small>')
    $button.upsert.html('Create').addClass('is-link')
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
    $('.modify-team-relationship').off('change')
    $modal.relationship.removeClass('is-active')
    $title.relationship.html(null)
    $relationship.html(null)

    displayTeams() // location.reload()
})


displayTeams()
setInterval(displayTeams, interval)