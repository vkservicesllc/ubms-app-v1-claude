import initialize from './support.mjs'

const prefix = 'user-role'

const selector = {
    class: {},
    id: {
        hidden: {
            roleId: 'role-id',
            carrierRoleId: 'carrier-role-id',
        },
        text: {
            roleName: 'role-name',
            carrierRoleName: 'carrier-role-name',
        },
        select: {
            roleLocation: 'role-location',
            carrierRoleLocation: 'carrier-role-location',
        },
    },
}

initialize(prefix, selector)

export default selector