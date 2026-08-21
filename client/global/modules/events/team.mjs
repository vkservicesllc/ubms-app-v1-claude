/* jQuery required */
import { inputEvent } from './form.mjs';
import selector from '../registry/selectors/team.mjs';
import patterns from '../registry/patterns.mjs';
import { capitalizeEach, capitalizeAfterPunctuation } from '../tools/utils/string.mjs';

export const teamNameEvent = (options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options;

    inputEvent(selector.id.text.name, {
        strip: true,
        word: true,
        value,
        onInput(name, $name, pos) {
            name = patterns.replace(name, 'teamName');
            name = capitalizeEach(name);

            $name.val(name);
            if (onInput) onInput(name, $name, pos);
        },
        onChange,
        onFocus,
        onBlur,
    });
};

export const teamDescEvent = (options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options;

    inputEvent(selector.id.text.desc, {
        strip: true,
        value,
        onInput(desc, $desc, pos) {
            desc = capitalizeAfterPunctuation(desc);

            $desc.val(desc);
            if (onInput) onInput(desc, $desc, pos);
        },
        onChange(desc, $desc) {
            desc = desc.trim();
            $desc.val(desc);

            if (onChange) onChange(desc, $desc);
        },
        onFocus,
        onBlur,
    });
};
