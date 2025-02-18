/* jQuery & jQuery Caret required */
import { inputEvent } from './form.mjs'
import patterns from '../registry/patterns.mjs'


export const urlEvent = (id, callback = {}) => {
    const { onInput, onChange, onFocus, onBlur } = callback

    inputEvent(id, {
        lower: true,
        onInput(url, $url, caret) {
            url = patterns.replace(url, 'url')

            $url.val(url).caret(caret || caret.end)
            if (onInput) onInput(url, $url, caret)
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