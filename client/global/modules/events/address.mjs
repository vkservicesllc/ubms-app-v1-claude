/* jQuery & jQuery Caret required */
import { inputEvent } from './form.mjs';
import patterns from '../registry/patterns.mjs';
import { capitalizeEach } from '../tools/utils/string.mjs';

export const addr1Event = (id, options = {}) => {
    const { addr2Id, onInput, onChange, onFocus, onBlur, value } = options;
    let { mail } = options;
    if (mail === undefined || typeof mail != 'boolean') mail = false;

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(addr1, $addr1, pos) {
            addr1 = capitalizeEach(addr1);

            $addr1.val(addr1);
            if (onInput) onInput(addr1, $addr1, pos);
        },
        onChange(addr1, $addr1) {
            addr1 = patterns.replace(addr1, 'addr1');
            const poBox = /\bPO Box\b/gi.test(addr1);
            let addr2, $addr2;

            if (!mail && poBox) addr1 = '';
            else if (addr2Id) {
                $addr2 = $(addr2Id);
                if (poBox) $addr2.val('');
                else {
                    const addr2Patt = patterns.match.addr2;
                    addr2 = addr2Patt.test(addr1) ? addr2Patt.exec(addr1)[0].toUpperCase() : '';

                    addr1 = addr1.replace(addr2Patt, '').trim();
                    if (addr2) {
                        addr2 = patterns.replace(addr2, 'addr2');
                        $addr2.val(addr2);
                    }
                }
            }

            $addr1.val(addr1);
            if (onChange) onChange(addr1, $addr1, addr2, $addr2);
        },
        onFocus,
        onBlur,
    });
};

export const addr2Event = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options;

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(addr2, $addr2, pos) {
            addr2 = capitalizeEach(addr2);

            $addr2.val(addr2);
            if (onInput) onInput(addr2, $addr2, pos);
        },
        onChange(addr2, $addr2) {
            addr2 = patterns.replace(addr2, 'addr2');

            $addr2.val(addr2);
            if (onChange) onChange(addr2, $addr2);
        },
        onFocus,
        onBlur,
    });
};

export const zipEvent = (id, options = {}) => {
    const { cityId, stateId, onInput, onChange, onFocus, onBlur, value } = options;

    inputEvent(id, {
        value,
        onInput(zip, $zip, pos) {
            zip = patterns.replace(zip, 'zip');

            const { length } = zip;
            const maxLength = $zip.attr('maxlength');

            $zip.val(zip);
            if (length == maxLength) $zip.blur();
            if (onInput) onInput(zip, $zip, pos);
        },
        onChange(zip, $zip) {
            const { length } = zip;
            const maxLength = $zip.attr('maxlength');
            if (length < maxLength) zip = '';

            $zip.val(zip);
            if (zip)
                $.ajax(`/api/public/us-zips/${zip}`, {
                    success(response) {
                        if (!('data' in response)) {
                            if (onChange) return onChange(zip, $zip);
                            return;
                        }

                        const { city, state } = response.data;
                        let $city, $state;

                        if (city && cityId) {
                            $city = $(cityId);
                            $city.val(city);
                        }

                        if (state && stateId) {
                            $state = $(stateId);
                            $state.val(state).find('option[value=""]').remove();
                        }

                        if (onChange) onChange(zip, $zip, city, state, $city, $state);
                    },
                });
            else if (onChange) onChange(zip, $zip);
        },
        onFocus,
        onBlur,
    });
};

export const cityEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options;

    inputEvent(id, {
        strip: true,
        word: true,
        value,
        onInput(city, $city, pos) {
            city = capitalizeEach(city);
            city = patterns.replace(city, 'city');

            $city.val(city);
            if (onInput) onInput(city, $city, pos);
        },
        onChange,
        onFocus,
        onBlur,
    });
};
