/* jQuery required */

class Tip {

    constructor($tipObj, tipDefs, messageObj) {
        this.$tip = $tipObj
        this.tipDefs = tipDefs
        this.message = messageObj
    }

    failed(key) {
        if (!(key in this.$tip)) return

        this.$tip[key]
            .removeClass('is-info is-success is-hidden')
            .addClass('is-danger')
            .html(`<i class="fas fa-close"></i> ${this.message.failed[key]}`)
    }

    passed(key) {
        if (!(key in this.$tip)) return

        this.$tip[key]
            .removeClass('is-info is-danger is-hidden')
            .addClass('is-success')
            .html(`<i class="fas fa-check"></i> ${this.message.success[key]}`)
    }

    default(key, hide = false) {
        if (!(key in this.$tip)) return

        this.$tip[key]
            .removeClass('is-danger is-success')
            .addClass(hide ? 'is-hidden' : 'is-info')
            .html(this.tipDefs[key])
    }

}

export default Tip