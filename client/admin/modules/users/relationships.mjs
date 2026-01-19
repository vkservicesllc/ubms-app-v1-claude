import Person from '/modules/tools/core/person.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

const $modal = $('#role-relationship-modal')
const $title = $('#role-relationship-title')
const $section = $('#role-relationship')
const $button = {
    done: $('#role-relationship-close-button'),
}


$button.done.click(function() {
    $modal.removeClass('is-active')
    $title.html(null)
    $section.html(null)
})

const roleRelationshipEvent = category => {
    let cls = '.role-relationship'
    if (category) cls = `.${category}-role-relationship`

    $(cls).on('click', function() {
        const $count = $(this)
        const _id = $(this).data('role-id')
        let count = +$(this).text()

        $.ajax(`/api/resource/roles/${_id}/users`, {
            success(response) {
                const { data, resource: role } = response
                const { _id, name, location } = role
                let title = `<small>Assign Users to </small> <strong>${name}`
                if (location) title += ` <small>(${role.expansion.location})</small>`
                title += '</strong>'

                $title.html(title)
                if (!data.all.length) {
                    $section.html('<i class="has-text-danger-65">No users to assign</i>')
                    return $modal.addClass('is-active')
                }

                const appliedIds = data.applied.map(item => item._id)
                data.all.map(item => {
                    item.name = new Person(item).fullName('AL') + ` <small>(${item.email}) - ${item.expansion.status} in ${item.expansion.location}</small>`
                    item.applied = appliedIds.includes(item._id)
                })
                data.all = sortArrayByObjectKey(data.all, 'name')

                let targetCls = 'modify-role-relationship'
                if (category) targetCls = `modify-${category}-role-relationship`

                let list = '<div class="field">'
                data.all.forEach(item => {
                    let attr = ` data-id="${item._id}"`
                    if (item.applied) attr += ' checked'
                    list += '<div class="control"><label class="checkbox">'
                    list += `<input type="checkbox" class="${targetCls}"${attr} />&nbsp; ${item.name}`
                    list += '</label></div>'
                })
                list += '</div>'

                $section.html(list)

                $(`.${targetCls}`).on('change', function() {
                    const $checkbox = $(this)
                    const _userId = $checkbox.data('id')
                    const checked = $checkbox.prop('checked')
                    const action = checked ? 'add' : 'delete'

                    $.ajax(`/api/update/role/${_id}/${action}/users/${_userId}`, {
                        method: 'POST',
                        success(response) {
                            const { done } = response
                            if (!done) alert('Oops! Something went wrong!')

                            if (action === 'add') count++
                            if (action === 'delete') count--

                            const styleCls = `is-${count ? 'primary' : 'danger'}`
                            $count.removeClass('is-primary is-danger').text(count).addClass(styleCls)
                        },
                        error(err) {
                            console.error(err)
                            alert(err.responseJSON.message)
                        },
                    })
                })

                $modal.addClass('is-active')
            },
        })
    })
}

export default roleRelationshipEvent