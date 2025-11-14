import selector from "/modules/registry/selectors/user.mjs"

const _id = $(selector.id.hidden.id).val()

if (_id) {
    const response = { categories: $.ajax('/api/source/company?filter=categories', { async: false, method: 'POST' }).responseJSON }
    const targets = ['roles', 'teams' ] //, 'companies']
    targets.forEach(target => response[target] = $.ajax(`/api/user/${_id}/${target}`, { async: false, method: 'POST' }).responseJSON)

    const defOpts = { available: '', applied: '' }
    const optgroup = '<optgroup><option value=""></option></optgroup>'
    const keys = Object.keys(defOpts)

    {
        const { data: roles } = response.roles
        const $roles = {
            available: $('#available-roles'),
            applied: $('#user-roles'),
        }

        const options = { ...defOpts }, optgroups = {}

        for (const prop of keys) {
            optgroups[prop] = roles[prop].reduce((cat, { _id, name, location, category}) => {
                if (!cat[category]) cat[category] = []
                cat[category].push({ _id, name, location })
    
                return cat
            }, {})

            for (const category in optgroups[prop]) {
                options[prop] += `<optgroup label="${response.categories[category].item[1]}">`
                for (const role of optgroups[prop][category]) {
                    const { _id, location } = role
                    let { name } = role
                    if (location) name = `${name} (${location})`

                    options[prop] += `<option value="${_id}">${name}</option>`
                }
                options[prop] += '</optgroup>'
            }

            $roles.available.html(options.available || optgroup)
            $roles.applied.html(options.applied || optgroup)
        }
    }

    {
        const { data: teams } = response.teams
        const $teams = {
            available: $('#available-teams'),
            applied: $('#user-teams'),
        }
        const $scoped = $('.scoped')
        const $unscoped = $('#unscoped')

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
            //     options[prop] += `<optgroup label="${response.categories[category].item[1]}">`
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

            $.ajax(`/api/user/${_id}/toggle-unscoped`, {
                method: 'POST',
                data: { unscoped },
                success(response) {
                    const { error } = response
                    if (error) {
                        $unscoped.prop('checked', !unscoped)
                        return alert('Could not toggle "unscoped" state')
                    }

                    $scoped.prop('disabled', unscoped)
                },
            })
        })
    }

    // {
    //     const { data: companies } = response.companies
    //     const $companies = {
    //         available: $('#available-companies'),
    //         applied: $('#user-companies'),
    //     }

    //     const options = { ...defOpts }, optgroups = {}

    //     for (const prop of keys) {
    //         optgroups[prop] = companies[prop].reduce((cat, { _id, name, category}) => {
    //             if (!cat[category]) cat[category] = []
    //             cat[category].push({ _id, name })
    
    //             return cat
    //         }, {})

    //         for (const category in optgroups[prop]) {
    //             options[prop] += `<optgroup label="${response.categories[category].item[1]}">`
    //             for (const company of optgroups[prop][category]) {
    //                 const { _id, name } = company
    //                 options[prop] += `<option value="${_id}">${name}</option>`
    //             }
    //             options[prop] += '</optgroup>'
    //         }
    //     }

    //     $companies.available.html(options.available || optgroup)
    //     $companies.applied.html(options.applied || optgroup)
    // }

    $('.loader-wrapper').remove()
}