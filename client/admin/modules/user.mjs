import { formSelectors } from '/modules/registry/selectors.mjs'

const { id } = formSelectors.user
const _id = $(`#${id}`).val()


$.ajax(`/api/user/${_id}/teams`, {
    method: 'POST',
    success(response) {
        const { data: teams } = response

        console.log(teams)
    },
})