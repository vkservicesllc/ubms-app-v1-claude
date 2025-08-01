import { capitalizeFirst } from '../../../../client/global/modules/tools/utils/string.mjs'



export const privileges = {
    data: [ 'view', 'comment', 'create', 'modify', 'update', 'delete' ],
    file: [ 'view', 'upload', 'download', 'delete' ],
}


export default {}



export const inPGroup = (searchGrp, permissions = {}, DS = false) => {
    if (DS) return true

    let found = false
    for (const grp in permissions) {
        if (grp.split('/')[0] !== searchGrp) continue

        found = true
        break
    }

    return found
}


export const inPEnvironment = (searchEnv, permissions = {}, DS = false) => {
    if (DS) return true

    let found = false
    for (const env in permissions) {
        if (env !== searchEnv) continue

        found = true
        break
    }

    return found
}


export const withPrivileges = (searchEnv, searchPrivs, permissions = {}, DS = false) => {
    if (DS) return true

    if (!Array.isArray(searchPrivs)) searchPrivs = [ searchPrivs ]
    const prop = { d: 'data', f: 'file' }[searchEnv.split(':')[0]]
    let found = false

    mainLoop:
    for (const env in permissions) {
        if (env !== searchEnv) continue

        const privs = permissions[env]
        for (let p of privs) {
            p = +p

            if (searchPrivs.includes(privileges[prop][p])) {
                found = true
                break mainLoop
            }
        }
    }

    return found
}


export const html = (branch, permissions, tabs = 0) => {
    let html = ''
    for (const target in permissions) {
        const permission = permissions[target]
        let src = target.split(':')[0]
        src = { d: 'data', f: 'file' }[src]
        const length = privileges[src].length

        const t = '\t'.repeat(tabs)
        let head = '', body = ''
        let headers = `\n${t}\t\t\t<th class="top-header checkbox-header">ALL</th>`
        privileges[src].map(priv => headers += `\n${t}\t\t\t<th class="top-header checkbox-header">${capitalizeFirst(priv)}</th>`)
        head += `\n${t}<table class="table is-fullwidth is-narrow">\n${t}\t<thead>\n${t}\t\t<tr>`
        head += `\n${t}\t\t\t<th>${permission.title}</th>`
        body += `\n${t}\t<tbody>`

        if (src === 'file') head += `\n${t}\t\t\t<th class="top-header">Format</th>`
        head += headers

        for (const prop in permission.groups) {
            const group = permission.groups[prop]
            const all = group.privileges === '*'
            const row = target.replace(':', '-') + '-' + prop
            let { name } = group
            let title = ''
            if (Array.isArray(name)) {
                [ name, title ] = name
                name += ' *'
            }
            if (title) title = ` title="${title}"`

            body += `\n${t}\t\t<tr>\n${t}\t\t\t<td${title}>${name}</td>`
            if (src === 'file') body += `\n${t}\t\t\t<td class="has-text-grey is-size-7">${group.format}</td>`
            body += `\n${t}\t\t\t<td><input type="checkbox" class="${branch}-role-checkbox-all switch is-rounded is-success is-small" id="${row}" /><label for="${row}"></td>`
            for (let i = 0; i < length; i++) {
                if (all || group.privileges.includes(i))
                    body+= `\n${t}\t\t\t<td><input type="checkbox" class="${branch}-role-checkbox ${row} switch is-rounded is-info is-small" id="${row}-${i}" name="permissions[${target}/${prop}][]" value="${i}" /><label for="${row}-${i}"></label></td>`
                else
                    body+= `\n${t}\t\t\t<td></td>`
            }
            body += `\n${t}\t\t</tr>`
        }

        head += `\n${t}\t\t<tr>\n${t}\t</thead>`
        body += `\n${t}\t</tbody>\n${t}</table>`

        html += head + body
    }

    return html
}