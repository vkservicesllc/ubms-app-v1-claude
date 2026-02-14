import { selectEvent } from '/modules/events/form.mjs'
import { dateMask, idMask, telMask } from '/modules/events/imask.mjs'
import { nameEvent } from '/modules/events/person.mjs'
import { emailEvent } from '/modules/events/contacts.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import { check, onInput, onAccept, addressPredictions } from './support.mjs'

const TS = selector.id.text, SS = selector.id.select
const firstNameId = TS.firstName
const middleNameId = TS.middleName
const lastNameId = TS.lastName
const suffixId = SS.suffix
const dobId = TS.dob
// const ssnId = TS.ssn
const genderId = SS.gender
const phoneId = TS.phone
const emailId = TS.email
// const addr1Id = TS.address1
// const addr2Id = TS.address2
// const zipId = TS.addrZip
// const cityId = TS.addrCity
// const stateId = SS.addrState
// const addrSinceId = TS.addrSince
// const addrEnoughId = selector.id.hidden.addrEnough
// const positionId = SS.position
const statusExpId = TS.statusExp

const $card = $('#new-apl-card')


//


const duration = 750
$card.fadeIn(duration)