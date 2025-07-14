import { inputEvent } from '/modules/events/form.mjs'
import { nameEvent } from '/modules/events/person.mjs'
import { telEvent } from '/modules/events/contacts.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { phone, name, relation } = application.emergency
    const TS = selector.id.text

    telEvent(TS.emergPhone, { value: phone })
    nameEvent(TS.emergName, { value: name })
    inputEvent(TS.emergRelation, { strip: true, word: true, capitalize: 'first', value: relation })

    $('.loading.form').removeClass('loading')
})()