import { query } from '../../../settings/mysql.mjs'
import { tz2utc } from '../../utils/date.mjs'
import Individual from '../individual.mjs'
import Driver from '../driver.mjs'
import Carrier from '../carrier.mjs'
import Team from '../team.mjs'
import appSettings from '../../../../client/global/modules/settings/driver-application.mjs'

const mysql = require('../../utils/mysql')


export const initialProgress = async (inst, step, body, office = false) => {
    const person = await Individual.fetch(inst.session, { id: inst.personId || Individual.matchHash(inst._personId) })
    if (!person) throw new Error('Person not found')

    const driver = await Driver.fetch(inst.session, { id: inst.driverId || Driver.matchIdHash(inst._driverId) })
    if (!driver) throw new Error('Driver not found')

    let { cache } = driver.appDef
    if (!cache) cache = {}

    switch (step) {


        case 'profile':
            {
                const { prefix, firstName, middleName, lastName, suffix, dob, gender, marital, phone, email } = body
                const since = tz2utc(inst.appliedOn, true)

                await person.update({ dob, gender })
                await person.update('names', { prefix, firstName, middleName, lastName, suffix }, { since: inst.dob })
                await person.update('maritals', { status: marital }, { since })
                await person.update('phones', { phone }, { since })
                await person.update('emails', { email }, { since })
            }
            break


        case 'residence':
            {
                const { address, addresses, prevCountry = null } = body
                const { since, currentSince, enough, livedAbroad, address1, address2, city, state, zip } = address
                const { personId = person.id } = inst

                await person.update('addresses', { since, address1, address2, city, state, zip }, { since: currentSince })
                await inst.update('addresses', { enough, livedAbroad }, { since }) //* since cascaded

                body = {
                    main: { addrComplete: true },
                    appDef: { prevCountry },
                }
                if (inst.step === 0) {
                    body.main.step = 1
                    cache.step = 1
                }
                cache.addrComplete = true
                cache.addrEnough = enough
                cache.livedAbroad = !!prevCountry

                await person.delete('addresses', { since: { not: since } })
                if (addresses) {
                    const { address1, address2, zip, city, state, since, enough, livedAbroad } = addresses
                    const count = zip.length

                    for (let i = 0; i < count; i++) {
                        await person.add('addresses', {
                            since: since[i],
                            address1: address1[i],
                            address2: address2[i],
                            city: city[i],
                            state: state[i],
                            zip: zip[i],
                        })
                        inst.add('addresses', {
                            personId,
                            since: since[i],
                            enough: enough[i],
                            livedAbroad: typeof livedAbroad?.[i] === 'boolean' ? livedAbroad[i] : null,
                        })
                        cache.addrEnough = enough[i]
                    }
                }

                if (!office) body.appDef.cache = cache //? JSON.stringify(cache)

                await inst.update(body.main)
                await driver.update('appDef', body.appDef)
            }
            break


        case 'driver-license':
            {
                if (!body.dlDenied) body.dlDeniedExpl = null
                if (!body.dlRevoked) body.dlRevokedExpl = null

                const { dlDenied, dlRevoked, dlDeniedExpl, dlRevokedExpl } = body
                delete body.dlDenied
                delete body.dlRevoked
                delete body.dlDeniedExpl
                delete body.dlRevokedExpl

                body = {
                    dl: body,
                    main: { dlDenied, dlRevoked, dlDeniedExpl, dlRevokedExpl },
                }

                let dlId

                //* Attempt to Avoid Dublicates (NOT GUARANTEED)
                const identifications = await person.fetch('identifications')
                if (identifications.length)
                    for (const card of identifications) {
                        if (!card.driver) continue
                        if (!!card.commercial !== !!body.dl.commercial) continue
                        if (card.number !== body.dl.number) continue
                        if (card.class !== body.dl.class) continue
                        if (card.state !== body.dl.state) continue
                        if (card.issuedOn !== body.dl.issuedOn) continue
                        if (card.expiresOn !== body.dl.expiresOn) continue
                        dlId = card.id
                    }

                if (!inst.dl) {
                    if (!dlId) {
                        const { insertId } = await person.add('identifications', body.dl)
                        if (!insertId) throw new Error("Failed to add driver's license")

                        dlId = insertId
                    }
                    body.main.step = 2
                    cache.step = 2
                } else {
                    if (!dlId) await person.update('identifications', body.dl, { id: inst.dlId })
                }

                body.main.dlId = dlId
                await inst.update(body.main)

                cache.dlId = dlId
                cache.dlExpiresOn = body.dl.expiresOn
                cache.dlDenied = dlDenied
                cache.dlRevoked = dlRevoked
                cache.dlDeniedExpl = dlDeniedExpl || null
                cache.dlRevokedExpl = dlRevokedExpl || null

                //? cache = JSON.stringify(cache)
                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'medical-card':
            {
                const { expiresOn, issuedOn, nrcme, mecAbsent } = body
                delete body.expiresOn
                delete body.issuedOn
                delete body.nrcme
                delete body.mecAbsent

                if (!body.underMeds) body.medList = null
                if (mecAbsent) body.mecId = null

                body = {
                    main: body,
                    mec: { expiresOn, issuedOn, nrcme },
                }

                if (inst.step < 3) {
                    body.main.step = 3
                    cache.step = 3
                }

                if (expiresOn) {
                    if (inst.mecId) await driver.update('mecs', body.mec, { id: inst.mecId })
                    else {
                        const { insertId } = await driver.add('mecs', body.mec)
                        if (!insertId) throw new Error('Failed to add medical card')

                        body.main.mecId = insertId
                    }
                } else {
                    await inst.update({ mecId: null })
                    await driver.delete('mecs', { id: inst.mecId })
                    body.main.mecId = null
                }

                await inst.update(body.main)

                cache.mecUntil = expiresOn || null
                cache.underMeds = body.main.underMeds
                cache.medList = body.main.medList || null

                //? cache = JSON.stringify(cache)
                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'legal-compliance':
            {
                if (body.dui === undefined) body.dui = false
                if (body.criminal === undefined) body.criminal = false
                if (body.dotDat === undefined) body.dotDat = false

                if (!body.dui) body.duiInDecade = null
                if (!body.criminal) body.criminalExpl = null

                const { violation, other, citedOn, state } = body
                delete body.violation
                delete body.other
                delete body.citedOn
                delete body.state
                if (!violation && body.citations) body.citations = false

                if (inst.step < 4) {
                    body.step = 4
                    cache.step = 4
                }

                cache.dui = body.dui
                cache.duiInDecade = body.duiInDecade
                cache.criminal = body.criminal
                cache.criminalExpl = body.criminalExpl
                cache.dotDat = body.dotDat
                cache.citations = body.citations
                cache.citIds = []

                if (body.citations) {
                    const count = violation.length

                    await driver.delete('citations') //* Cascades on delete in application citations
                    for (let i = 0; i < count; i++) {
                        const { insertId: citId } = await driver.add('citations', {
                            violation: violation[i],
                            other: violation[i] === 'other' ? other?.[i] : null,
                            citedOn: citedOn[i],
                            state: state[i],
                        })
                        if (!citId) throw new Error('Failed adding citation')
                        await inst.add('citations', { citId })
                        cache.citIds.push(citId)
                    }
                }

                await inst.update(body)

                //? cache = JSON.stringify(cache)
                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'safety':
            {
                const { accidents, collision, other, date, state, injuries, fatalities } = body
                body = { accidents }
                if (!collision && body.accidents) body.accidents = false

                if (inst.step < 5) {
                    body.step = 5
                    cache.step = 5
                }

                cache.accidents = body.accidents
                cache.accIds = []

                if (body.accidents) {
                    const count = collision.length

                    await driver.delete('accidents') //* Cascades on delete in application accidents
                    for (let i = 0; i < count; i++) {
                        const { insertId: accId } = await driver.add('accidents', {
                            collision: collision[i],
                            other: collision[i] === 'other' ? other?.[i] : null,
                            date: date[i],
                            state: state[i],
                            injuries: injuries[i],
                            fatalities: fatalities[i],
                        })
                        if (!accId) throw new Error('Failed adding accident')
                        await inst.add('accidents', { accId })
                        cache.accIds.push(accId)
                    }
                }

                await inst.update(body)

                //? cache = JSON.stringify(cache)
                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'experience':
            {
                const experience = body.noExp !== true
                const prevEmployed = experience === true ? true : inst.prevEmployed
                let { cdlSchool } = body
                const { cmv, vehicles = {}, firstDate = null,
                    // lastDate,
                    mileage,
                    // hours,
                } = body
                const { name, phone, state, endDate, duration } = body
                if (cdlSchool === undefined) cdlSchool = null

                let { misc } = vehicles
                if (misc) {
                    if (!cmv) { //* VERY IMPORTANT! If other non-cmv types are added, they must be deleted also
                        delete misc.tandem
                    }

                    misc = Object.keys(misc)
                    vehicles.misc = misc
                }
                if (!cmv) delete vehicles.semi

                body = {
                    main: { experience, cdlSchool, prevEmployed },
                    appDef: { expDate: firstDate },
                    experience: {
                        cmv, vehicles,
                        // lastDate,
                        mileage,
                        // hours,
                    },
                    school: { name, phone, state, endDate, duration },
                }

                if (inst.step < 6) {
                    body.main.step = 6
                    cache.step = 6
                }

                cache.experience = experience ? { ...body.experience } : false
                cache.cdlSchool = cdlSchool
                cache.prevEmployed

                if (!office) body.appDef.cache = cache

                if (experience) await inst[inst.experience ? 'update' : 'add']('experience', body.experience)
                else {
                    await inst.delete('experience')
                    body.appDef.expDate = null
                }

                if (cdlSchool) await driver[inst.cdlSchool ? 'update' : 'add']('school', body.school)
                else await driver.delete('school')

                await inst.update(body.main)
                await driver.update('appDef', body.appDef)
            }
            break


        case 'prev-employment':
            {
                delete body.explGap
                if (inst.step < 7) {
                    body.step = 7
                    cache.step = 7
                }
                cache.prevEmployed = body.prevEmployed

                if (!body.prevEmployed) await mysql.execute(query.driver_employment.main.delete({ driverId: driver.id }))
                await inst.update(body)
                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'preference':
            {
                if (body.operType === 's' || !inst.cdlRole) {
                    body.teamName = null
                    body.teamPhone = null
                }

                if (!inst.cdlRole) {
                    body.haulRegion = null
                    body.equipment = null
                }
                cache.preference = { ...body }

                await inst[inst.preference ? 'update' : 'add']('preference', body)

                if (inst.step < 8) {
                    await inst.update({ step: 8 })
                    cache.step = 8
                }

                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'business':
            {
                let { activeLLC } = body
                const {
                    inactiveLLC, busName, state, ein,
                    mmt, type, make, model, year, length, trailer,
                } = body
                if (inactiveLLC) activeLLC = false
                else if (activeLLC === undefined) activeLLC = true

                body = { activeBusiness: activeLLC }
                if (inst.step < 9) {
                    body.step = 9
                    cache.step = 9
                }

                let busId = inst.busId
                if (activeLLC) {
                    const busBody = { busName, state, ein }
                    if (!inst.activeBusiness) {
                        const { insertId } = await driver.add('businesses', busBody)
                        if (!insertId) throw new Error("Failed to add driver's business")

                        busId = insertId
                    } else await driver.update('businesses', busBody, { id: busId })
                } else {
                    await driver.delete('businesses', { id: busId }) //* No need to filter since it is not rehire
                    busId = null
                }
                body.busId = busId

                //* Driver Application only (when type is defined)
                cache = await vehicleRecord(inst, { mmt, type, make, model, year, length, trailer }, cache)

                await inst.update(body)
                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'beneficiary':
            {
                if (body.relation !== 'Other') body.otherRel = null

                cache.beneficiary = { ...body }
                if (!inst.beneficiary) {
                    await inst.add('beneficiary', body)
                    await inst.update({ step: 10 })
                    cache.step = 10
                } else await inst.update('beneficiary', body)

                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'misc':
            {
                cache.emergency = { ...body }
                if (!inst.emergency) {
                    await inst.add('emergency', body)
                    await inst.update({ step: 11 })
                    cache.step = 10
                } else await inst.update('emergency', body)

                if (!office) await driver.update('appDef', { cache })
            }
            break


        case 'certify':
            {
                if (inst.step < 12) await inst.update({ step: 12 })
            }
            break


        case 'address': //* Carrier UI only (no step)
            {
                const { address, prevCountry = null } = body
                const { since, currentSince, enough, livedAbroad = false, address1, address2, city, state, zip } = address
                const { personId } = inst

                if (enough || (livedAbroad && prevCountry)) await person.delete('addresses', { since: { not: currentSince } })
                await person.update('addresses', { since, address1, address2, city, state, zip }, { since: currentSince })
                await inst.update('addresses', { enough, livedAbroad }, { since }) //* since cascaded
                await driver.update('appDef', { prevCountry })
            }
            break


        case 'prior-addresses': //* Carrier UI only (no step)
            {
                const { maxDate, addresses, prevCountry = null } = body
                await person.delete('addresses', { since: { not: maxDate } })
                if (addresses) {
                    const { address1, address2, zip, city, state, since, enough, livedAbroad } = addresses
                    const count = zip.length

                    for (let i = 0; i < count; i++) {
                        await person.add('addresses', {
                            since: since[i],
                            address1: address1[i],
                            address2: address2[i],
                            city: city[i],
                            state: state[i],
                            zip: zip[i],
                        })
                        inst.add('addresses', {
                            personId,
                            since: since[i],
                            enough: enough[i],
                            livedAbroad: count - i === 1 ? !!prevCountry : null,
                        })
                    }
                }
            }
            break


        case 'legal-status': //* Carrier UI only (no step)
            {
                if (body.legalStatus < 2) body.legalExpiration = null

                const { legalStatus: status, legalExpiration: expiresOn } = body
                await person.update('legal', { status, expiresOn }, { since: tz2utc(inst.appliedOn, true) })
            }
            break


        case 'position': //* Carrier UI only (no step)
            {
                const { position, mmt, type, make, model, year, length, trailer } = body

                await inst.update({ position })
                inst.position = position

                await vehicleRecord(inst, { mmt, type, make, model, year, length, trailer })
            }
            break


        case 'workflow': //* Carrier UI only
            {
                const { _userId, _carrierId, _teamId, condition, experience, position } = body
                body = { main: {}, decision: {} }

                if (_carrierId && _carrierId !== inst._carrierId) {
                    const carrier = await Carrier.fetch(inst.session, { _id: _carrierId })
                    if (!carrier) throw new Error('Carrier not found')

                    body.main.carrierId = carrier.id
                }

                if (_teamId && _teamId !== inst._teamId) {
                    const team = await Team.fetch(inst.session, { _id: _teamId })
                    body.main.teamId = team.id
                }

                await inst.update(body.main)
            }
            break


    }
}


export const rehireProgress = async (inst, step, body, office = false) => {
    //
}


async function vehicleRecord(application, body, cache = {}) {
    if (application.position !== 'OO') {
        await application.delete('vehicle')
        delete cache.vehicle
    } else {
        const trailerValue = (trailer = null, type) => {
            if (appSettings.vhlType_wTrailer.includes(type)) trailer = !!trailer
            return trailer
        }
        if (body.mmt) {
            if (body.mmt !== 'other') {
                body.type = null
                body.make = null
                body.model = null

                const type = body.mmt.split(':')[0]

                if (type !== 'straightBox') body.length = null
                body.trailer = trailerValue(body.trailer, type)
            } else {
                if (body.type !== 'straightBox') body.length = null
                body.trailer = trailerValue(body.trailer, body.type)
            }
        } else body.trailer = trailerValue(body.trailer, body.type)

        cache.vehicle = { ...body }

        await application[application.vehicle ? 'update' : 'add']('vehicle', body)
    }

    return cache
}
