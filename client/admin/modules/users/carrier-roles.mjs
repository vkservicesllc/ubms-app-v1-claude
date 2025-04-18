import { formSelectors } from '/modules/registry/selectors.mjs'
import { roleNameEvent, roleLocationEvent } from '/modules/events/user.mjs'
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'

const { carrierRoleId, carrierRoleNameId, carrierRoleLocationId } = formSelectors.user


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

const $id = $(`#${carrierRoleId}`)
const $deleteId = $(`#delete-${carrierRoleId}`)
const $name = $(`#${carrierRoleNameId}`)
const $location = $(`#${carrierRoleLocationId}`)

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
    catId: 'crr',
    $id,
    $name,
    $location,
}

const onAjax = response => {
    const { unique, original } = response
    if (!unique && !original) showWarning()
}

const onChange = () => hideWarning()


roleNameEvent(carrierRoleNameId, ajaxData, {
    onInput() {
        hideWarning()
    },
    onAjax,
})


roleLocationEvent(carrierRoleLocationId, ajaxData, { onChange, onAjax })


$.ajax('/api/roles/carrier', {
    method: 'POST',
    success(response) {
        const { error } = response

        if (error) alert(error)
        else {
            let list = ''
            let { data } = response
            data = sortArrayByObjectKey(data, 'name')

            data.forEach(role => {
                const { _id, name } = role
                let { location } = role
                if (location) location = location[1]

                list += `<a class="panel-block carrier-role" data-id="${_id}">`
                list += name
                if (location) list += `&nbsp; <span class="tag has-text-weight-normal">${location} only</span>`
                list += '</a>'
            })

            $list.html(list)

            const $role = $('.carrier-role')
            const highlight = {
                block: 'has-text-weight-bold has-background-dark has-text-light',
                tag: 'is-dark',
            }
            const removeHighlight = () => {
                $role.removeClass(highlight.block).find('.tag').removeClass(highlight.tag)
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
                $(this).addClass(highlight.block).find('.tag').addClass(highlight.tag)

                $.ajax(`/api/role/${_id}`, {
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
        }
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