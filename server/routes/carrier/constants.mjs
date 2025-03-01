export const navBuilder = {
    simple: items => {
        let html = ''
        items.forEach(item => html += `\n\t\t\t<a class="item" href="${item[0]}">${item[1]}</a>`)
        return html
    },
}