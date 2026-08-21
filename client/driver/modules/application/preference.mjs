import { selectEvent } from '/modules/events/form.mjs';
import { onChange } from './support.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';

selectEvent(selector.id.select.startPref, {
    fill: true,
    onChange,
});
