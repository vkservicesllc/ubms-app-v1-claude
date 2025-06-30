/* jQuery required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'


export const urlEvent = (id, options = {}) => {
    const { onInput, onChange, onFocus, onBlur, value } = options

    inputEvent(id, {
        lower: true,
        value,
        onInput(url, $url) {
            url = patterns.replace(url, 'url')

            $url.val(url)
            if (onInput) onInput(url, $url)
        },
        onChange(url, $url) {
            url = url.split('?')[0]

            $url.val(url)
            if (onChange) {
                const valid = url
                    ? patterns.match.url.test(url)
                    : null

                onChange(url, valid, $url)
            }
        },
        onFocus,
        onBlur,
    })
}