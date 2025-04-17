import { formSelectors } from '/modules/registry/selectors.mjs'

const { id } = formSelectors.user
const _id = $(`#${id}`).val()
const categories = $.ajax('/api/source/company?filter=categories', { async: false, method: 'POST' }).responseJSON

if (_id)
    $.ajax(`/api/user/${_id}/teams`, {
        method: 'POST',
        success(response) {
            const { data: teams } = response
            const $teams = {
                available: $('#available-teams'),
                applied: $('#user-teams'),
            }

            const options = { available: '', applied: '' }
            const optgroups = {}
            const optgroup = '<optgroup><option value=""></option></optgroup>'

            for (const prop of ['available', 'applied']) {
                optgroups[prop] = teams[prop].reduce((cat, { _id, name, catId}) => {
                    if (!cat[catId]) cat[catId] = []
                    cat[catId].push({ _id, name })
        
                    return cat
                }, {})

                for (const catId in optgroups[prop]) {
                    options[prop] += `<optgroup label="${categories[catId].item[1]}">`
                    for (const team of optgroups[prop][catId]) {
                        const { _id, name } = team
                        options[prop] += `<option value="${_id}">${name}</option>`
                    }
                    options[prop] += '</optgroup>'
                }
            }

            $teams.available.html(options.available || optgroup)
            $teams.applied.html(options.applied || optgroup)

            $.ajax(`/api/user/${_id}/roles`, {
                method: 'POST',
                success(response) {
                    const { data: roles } = response
                    const $roles = {
                        available: $('#available-roles'),
                        applied: $('#user-roles'),
                    }

                    const options = { available: '', applied: '' }
                    const optgroups = {}
                    const optgroup = '<optgroup><option value=""></option></optgroup>'

                    for (const prop of ['available', 'applied']) {
                        optgroups[prop] = roles[prop].reduce((cat, { _id, name, location, catId}) => {
                            if (!cat[catId]) cat[catId] = []
                            cat[catId].push({ _id, name, location })
                
                            return cat
                        }, {})

                        for (const catId in optgroups[prop]) {
                            options[prop] += `<optgroup label="${categories[catId].item[1]}">`
                            for (const role of optgroups[prop][catId]) {
                                const { _id, location } = role
                                let { name } = role
                                if (location) name = `${name} (${location})`

                                options[prop] += `<option value="${_id}">${name}</option>`
                            }
                            options[prop] += '</optgroup>'
                        }

                        $roles.available.html(options.available || optgroup)
                        $roles.applied.html(options.applied || optgroup)

                        $('.loader-wrapper').remove()
                    }
                },
            })
        },
    })