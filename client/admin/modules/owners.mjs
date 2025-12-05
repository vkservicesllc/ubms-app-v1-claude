import Person from './tools/core/person.mjs'
import escapeHTML from './tools/utils/html.mjs'
import { tel as formatTel } from './tools/utils/formatter.mjs'
import { openModifyModal, openDeleteModal, closeModals } from './company/owner.mjs'

const categories = $.ajax('/api/source/company?filter=categories', { async: false, method: 'POST' }).responseJSON
const interval = 30000
let refreshed = false

const tags = true  // temp, must be withdrawn from settings

const columns = [

    {
        data: 'gender',
        searchable: false,
        orderable: false,
        render(data) {
            if (data === 'X') return '<span class="has-text-grey">?</span>'

            let fa = 'fa-person', color = 'link-75'
            if (data[0] == 'F') {
                fa += '-dress'
                color = 'danger-70'
            }

            return `<i class="fa ${fa} has-text-${color}"></i>`
        },
    },

    {
        data: null,
        title: 'Last Name',
        render(data, type, row) {
            return `<span class="has-text-weight-semibold">${escapeHTML(new Person(row).fullLastName())}</span>`
        },
    },

    {
        data: null,
        title: 'First Name',
        render(data, type, row) {
            return `<span class="has-text-weight-semibold">${escapeHTML(new Person(row).fullFirstName())}</span>`
        },
    },

    {
        data: 'dob',
        title: 'DOB',
        searchable: false,
        className: 'has-text-left',
        render(data, type) {
            return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data
        },
    },

    {
        data: 'age',
        title: 'Age',
        searchable: false,
        type: 'string',
    },

    {
        data(row) {
            return formatTel(row.phone || null)
        },
        title: 'Phone',
    },

]

if (tags) columns.push({
    data: 'count',
    searchable: false,
    orderable: false,
    render(data) {
        const count = data.companies
        const tag = !count ? 'span' : 'a' // add trigger and attributes

        let cell = '<div class="field is-grouped is-grouped-multiline">'
        cell += '<div class ="control"><div class="tags has-addons">'
        cell += `<${tag} class="tag has-text-weight-semibold${!data.companies ? ' has-text-danger' : ''}">Companies</${tag}>`
        cell += `<span class="tag is-${!data.companies ? 'danger' : 'success'}">${data.companies}</span>`
        cell += '</div></div>'
        for (const catId in categories) {
            const { item, path } = categories[catId]
            const label = item[0]
            const count = data[path[0]]
            const tag = !count ? 'span' : 'a' // add trigger and attributes

            cell += '<div class ="control"><div class="tags has-addons">'
            cell += `<${tag} class="tag${!count ? ' has-text-danger' : ''}">${label}</${tag}>`
            cell += `<span class="tag is-${!count ? 'danger' : 'success'}">${count}</span>`
            cell += '</div></div>'
        }
        cell += '</div>'

        return cell
    },
})

else {
    columns.push({
        data: 'count',
        title: 'Companies',
        className: 'has-text-left',
        render(data, type) {
            const count = data.companies
            const style = !count ? 'danger' : 'success'
            const tag = !count ? 'span' : 'a' // add trigger and attributes

            return type == 'display' ? `<${tag} class="tag is-${style}">${count}</${tag}>` : count
        },
    })

    for (const catId in categories) {
        const { item, path } = categories[catId]

        columns.push({
            data: 'count',
            title: item[0],
            className: 'has-text-left',
            render(data, type) {
                const count = data[path[0]]
                const style = !count ? 'danger' : 'success'
                const tag = !count ? 'span' : 'a' // add trigger and attributes

                return type == 'display' ? `<${tag} class="tag is-${style}">${count}</${tag}>` : count
            },
        })
    }
}



columns.push({
    data: null,
    orderable: false,
    searchable: false,
    render(data, type, row) {
        let cell = '<div class="dt-action">'
        if (!row.count.companies)
            cell += `<a class="has-text-danger delete-owner" data-id="${row._id}" title="Delete"><i class="fas fa-trash-can"></i></a>`
        cell += `<a class="has-text-link-80 modify-owner-signature" data-id="${row._id} title="Modify Signature"><i class="fas fa-signature"></i></a>`
        cell += `<a class="has-text-primary-35 modify-owner-phone" data-id="${row._id} title="Add/Modify Phone"><i class="fas fa-mobile-screen"></i></a>`
        cell += `<a class="has-text-success-45 modify-owner" data-id="${row._id}" title="Modify"><i class="fas fa-pen-to-square"></i></a>`
        cell += '</div>'

        return cell
    },
})


const table = $('#owners-table').DataTable({

    ajax: {
        url: '/api/list/company-owners',
        dataSrc(response) {
            const { data } = response
            return data
        },
    },

    columns,

    language: {
        emptyTable: '<span class="has-text-danger">No company owners registered at this time</span>',
    },

    lengthMenu,

    order: [ [ 1, 'asc' ], [ 2, 'asc' ] ],

})

setInterval(() => {
    dtFnFilterData(table)
    refreshed = true
}, interval)

onDraw(table, () => {
    if (!refreshed)
        $('.modal-cancel, .modal-close, .delete').click(closeModals)

    $('.modify-owner').click(function() {
        const _id = $(this).data('id')

        openModifyModal(_id)
    })

    $('.delete-owner').click(function() {
        const _id = $(this).data('id')

        openDeleteModal(_id)
    })
})