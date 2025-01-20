import { selectEvent } from '../events/form.mjs'
import { formSelectors } from '../registry/selectors.mjs'
import { openAddModal, openEditModal, closeModals } from './owner.mjs'

const { ownershipId } = formSelectors.company

const $owner = $(`#${ownershipId}`)
const $button = {
    edit: $('#edit-owner-trigger'),
    add: $('#add-owner-trigger'),
    cancel: $('.modal-cancel, .modal-close, .delete'),
}
const $submit = $('#ownership-submit')


$submit.prop('disabled', false)

selectEvent(ownershipId, {
    onChange(_ownerId) {
        const disabled = _ownerId ? false : true

        $button.edit.prop('disabled', disabled)
    },
})

$button.add.on('click', openAddModal)

$button.edit.on('click', () => {
    const _id = $owner.val()

    openEditModal(_id)
})

$button.cancel.on('click', () => {
    closeModals()
})