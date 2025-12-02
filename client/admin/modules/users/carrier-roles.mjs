import selector from '/modules/registry/selectors/user-role.mjs'
import { roleNameEvent, roleLocationEvent } from '/modules/events/user.mjs'
import roleRelationshipEvent from './relationships.mjs'


const $section = $('#carrier-roles-form-section')
const $list = $('#carrier-role-panel-list')
const $button = {
    add: $('#carrier-role-add'),
    close: $('#carrier-role-close'),
    delete: $('#carrier-role-delete-button'),
    submit: $('#carrier-role-submit'),
}
const $warning = $('#carrier-name-unavailable-warning')
const $form = {
    role: $('#carrier-role-form'),
    delete: $('#delete-carrier-role-form'),
}

const $id = $(selector.id.hidden.carrierRoleId)
const $deleteId = $(selector.id.hidden.carrierRoleDeleteId)
const $name = $(selector.id.text.carrierRoleName)
const $location = $(selector.id.select.carrierRoleLocation)

const showWarning = () => {
    $warning.show()
    $button.submit.prop('disabled', true)
}

const hideWarning = () => {
    $warning.hide()
    $button.submit.prop('disabled', false)
}

const unset = () => {
    $id.val(null)
    $deleteId.val(null)
    $name.val(null)
    $location.val(null)
    $('.carrier-role-checkbox, .carrier-role-checkbox-all').prop('checked', false)
    $button.delete.hide()
    hideWarning()
}

const ajaxData = {
    category: 'crr',
    $id,
    $name,
    $location,
}

const onAjax = response => {
    const { unique, original } = response
    if (!unique && !original) showWarning()
}

const onChange = () => hideWarning()


roleNameEvent(ajaxData, {
    onInput() {
        hideWarning()
    },
    onAjax,
})


roleLocationEvent(ajaxData, { onChange, onAjax })


$.ajax('/api/list/roles/carrier', {
    method: 'POST',
    success(response) {
        let list = ''
        let { data } = response

        data.forEach(role => {
            const { _id, name, location, count } = role
            const { users } = count
            const userStyle = `is-${users ? 'primary' : 'danger'}`

            list += `<span class="panel-block is-flex is-justify-content-space-between"><a class="carrier-role" data-id="${_id}">`
            list += name
            if (location) list += `&nbsp; <span class="tag has-text-weight-normal">${role.expansion.location} only</span>`
            list += `</a><div class="tags has-addons"><span class="tag">Users</span><a class="tag ${userStyle} carrier-role-relationship" data-role-id="${_id}">${users}</a></div>`
            list += '</span>'
        })

        $list.html(list)

        const $role = $('.carrier-role')
        const highlight = {
            block: 'has-background-dark has-text-light',
            tag: 'is-dark',
        }
        const removeHighlight = () => {
            $role.parent().removeClass(highlight.block).find('.tag').removeClass(highlight.tag)
        }

        $button.add.click(() => {
            $button.submit.removeClass('is-success').addClass('is-link').text('Create')
            setTimeout(() => $('.tables').scrollTop(0), 0)
            unset()
            removeHighlight()
            $section.show()
        })
        
        $button.close.click(() => {
            $section.hide()
            removeHighlight()
            unset()
            $button.submit.removeClass('is-link is-success').text(null)
        })

        $button.delete.click(() => {
            if (confirm('Confirm deletion: Are you sure you want to delete the current role?'))
                $form.delete.submit()
        })

        $role.on('click', function() {
            unset()
            $button.delete.show()
            const _id = $(this).data('id')

            removeHighlight()
            $(this).parent().addClass(highlight.block).find('.tag').addClass(highlight.tag)

            $.ajax(`/api/data/role/${_id}`, {
                method: 'POST',
                success(response) {
                    const { _id, name, location, permissions } = response.data

                    $id.val(_id)
                    $deleteId.val(_id)
                    $name.val(name)
                    $location.val(location)
                    $button.submit.removeClass('is-link').addClass('is-success').text('Update')

                    for (const permission in permissions) {
                        permissions[permission]
                            .forEach(value => $(`[name="permissions[${permission}][]"][value="${value}"]`).prop('checked', true))

                        const row = permission.replace(/[:\/]/g, '-')
                        if ($(`.${row}`).length == $(`.${row}:checked`).length) $(`#${row}`).prop('checked', true)
                    }

                    setTimeout(() => $('.tables').scrollTop(0), 0)
                    $section.show()
                },
            })
        })

        roleRelationshipEvent('carrier')
    },
})


$('.carrier-role-checkbox-all').on('change', function() {
    const row = $(this).attr('id')
    const checked = $(this).is(':checked')

    $(`.${row}`).prop('checked', checked)
})

$('.carrier-role-checkbox').on('change', function() {
    const row = $(this).attr('class').split(' ')[1]
    const value = $(this).attr('value')
    const checked = $(this).is(':checked')
    const allChecked = $(`.${row}`).length == $(`.${row}:checked`).length

    $(`#${row}`).prop('checked', allChecked)
    if (checked && value != '0') {
        $(`.${row}[value="0"]`).prop('checked', true)
    }
})

$('.carrier-role-checkbox[value="0"]').on('change', function() {
    const row = $(this).attr('class').split(' ')[1]
    const checked = $(this).is(':checked')

    if (!checked) {
        $(`.${row}`).prop('checked', false)
        $(`#${row}`).prop('checked', false)
    }
})


$form.role.submit(function(e) {
    e.preventDefault()

    if (!$('.carrier-role-checkbox:checked').length)
        return alert('At least 1 permission must be checked before saving!')

    $(this).unbind().submit()
})