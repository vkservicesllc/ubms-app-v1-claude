/* jQuery & jQuery Caret required */
import { nameEvent } from '/modules/events/person.mjs'
import { emailEvent } from '/modules/events/contacts.mjs'
import selector from '/modules/registry/selectors/user.mjs'

const TS = selector.id.text
const firstNameId = TS.firstName
const lastNameId = TS.lastName
const emailId = TS.email


nameEvent(firstNameId)
nameEvent(lastNameId, { sfxId: true })
emailEvent(emailId)


setTimeout(() => {
    $(`${firstNameId}, ${lastNameId}, ${emailId}`).removeAttr('disabled')
}, 750)