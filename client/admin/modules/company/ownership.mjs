import { selectEvent } from '../events/form.mjs'
import { openAddModal, openModifyModal, closeModals } from './owner.mjs'
import selector from '../registry/selectors/company.mjs'

const ownershipId = selector.id.select.ownership

const $button = {
    edit: $('#edit-owner-trigger'),
    add: $('#add-owner-trigger'),
    cancel: $('.modal-cancel, .modal-close, .delete'),
}
const $submit = $('#ownership-submit')


$submit.prop('disabled', false)

selectEvent(ownershipId, {
    onChange(_ownerId) {
        const disabled = _ownerId && _ownerId[0] === 'p' ? false : true

        $button.edit.prop('disabled', disabled)
    },
})

$button.add.on('click', openAddModal)

$button.edit.on('click', () => {
    const _id = $(ownershipId).val()

    if (_id[0] === 'p') openModifyModal(_id.split(':')[1])
})

$button.cancel.on('click', () => {
    closeModals()
})