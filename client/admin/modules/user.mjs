import selector from "/modules/registry/selectors/user.mjs"

const _id = $(selector.id.hidden.id).val()

if (_id) {
    const categories = $.ajax('/api/source/company?filter=categories', { async: false, method: 'POST' }).responseJSON
    const relationships = $.ajax(`/api/resource/users/${_id}/relationships`, { async: false }).responseJSON.data

    const defOpts = { available: '', applied: '' }
    const optgroup = '<optgroup><option value=""></option></optgroup>'
    const keys = Object.keys(defOpts)

    {
        const { roles } = relationships
        const $roles = {
            available: $('#available-roles'),
            applied: $('#user-roles'),
        }

        const options = { ...defOpts }, optgroups = {}

        for (const prop of keys) {
            optgroups[prop] = roles[prop].reduce((cat, { _id, name, location, category, expansion }) => {
                if (!cat[category]) cat[category] = []
                cat[category].push({ _id, name, location, expansion })
    
                return cat
            }, {})

            for (const category in optgroups[prop]) {
                options[prop] += `<optgroup label="${categories[category].item[1]}">`
                for (const role of optgroups[prop][category]) {
                    const { _id, location } = role

                    let { name } = role
                    if (location) name = `${name} (${role.expansion.location})`

                    options[prop] += `<option value="${_id}">${name}</option>`
                }
                options[prop] += '</optgroup>'
            }

            $roles.available.html(options.available || optgroup)
            $roles.applied.html(options.applied || optgroup)
        }
    }

    {
        const { teams } = relationships
        const $teams = {
            available: $('#available-teams'),
            applied: $('#user-teams'),
        }
        const $scoped = $('.scoped')
        const $unscoped = $(selector.id.checkbox.unscoped)

        const options = { ...defOpts }, optgroups = {}

        for (const prop of keys) {
            for (const team of teams[prop]) {
                const { _id, name } = team
                options[prop] += `<option value="${_id}">${name}</option>`
            }
            // optgroups[prop] = teams[prop].reduce((cat, { _id, name, category}) => {
            //     if (!cat[category]) cat[category] = []
            //     cat[category].push({ _id, name })
    
            //     return cat
            // }, {})

            // for (const category in optgroups[prop]) {
            //     options[prop] += `<optgroup label="${categories[category].item[1]}">`
            //     for (const team of optgroups[prop][category]) {
            //         const { _id, name } = team
            //         options[prop] += `<option value="${_id}">${name}</option>`
            //     }
            //     options[prop] += '</optgroup>'
            // }
        }

        $teams.available.html(options.available || optgroup)
        $teams.applied.html(options.applied || optgroup)

        if ($unscoped.prop('checked')) $scoped.prop('disabled', true)

        $unscoped.on('change', function() {
            const unscoped = $(this).prop('checked')

            $.ajax(`/api/resource/users/${_id}/unscoped`, {
                method: 'PATCH',
                data: { unscoped },
                success(response) {
                    $scoped.prop('disabled', unscoped)
                    location.reload()
                },
                error(err) {
                    $unscoped.prop('checked', !unscoped)
                    console.error(err.responseJSON)
                    alert('Error occured')
                },
            })
        })
    }

    {
        const { companies } = relationships
        const $companies = {
            available: $('#available-companies'),
            applied: $('#user-companies'),
        }

        const options = { ...defOpts }, optgroups = {}

        for (const prop of keys) {
            optgroups[prop] = companies[prop].reduce((cat, { _id, name, category, active, until }) => {
                if (!cat[category]) cat[category] = []
                cat[category].push({ _id, name, active, until })
    
                return cat
            }, {})

            for (const category in optgroups[prop]) {
                options[prop] += `<optgroup label="${categories[category].item[1]}">`
                for (const company of optgroups[prop][category]) {
                    const { _id, name, active, until } = company
                    let style = ''
                    if (until) style = ' style="text-decoration: line-through; color: grey;"'
                    else if (!active) style = ' style="color: grey;"'
                    options[prop] += `<option value="${_id}"${style}>${name}</option>`
                }
                options[prop] += '</optgroup>'
            }
        }

        $companies.available.html(options.available || optgroup)
        $companies.applied.html(options.applied || optgroup)
    }

    $('.loader-wrapper').remove()
}