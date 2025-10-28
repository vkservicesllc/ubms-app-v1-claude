import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'
import application, { dropdownEvent } from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, finishedAt } = application
})()