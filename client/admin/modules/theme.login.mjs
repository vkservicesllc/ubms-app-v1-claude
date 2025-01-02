import applyTheme, { createThemeSelectEvent } from './theme.mjs'
import { formSelectors } from './registry/selectors.mjs'


$(document).ready(function() {
    const $title = $('.title')
    const $label = $('label')
    const $button = $(`#${formSelectors.user.signInButtonId}`)

    const onLight = () => {
        $title.addClass('has-text-primary-30').removeClass('has-text-info')
        $label.removeClass('has-text-grey-light')
        $button.removeClass('is-dark')
    }

    const onDark = () => {
        $title.addClass('has-text-info').removeClass('has-text-primary-30')
        $label.addClass('has-text-grey-light')
        $button.addClass('is-dark')
    }

    applyTheme(onLight, onDark)
    createThemeSelectEvent(onLight, onDark)
    $('.hero').show()
})