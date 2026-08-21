import initialize from './support.mjs';

const prefix = 'user-role';

const selector = {
    class: {
        text: {
            roleName: 'name',
        },
        select: {
            roleLocation: 'location',
        },
    },
    id: {
        hidden: {
            roleId: 'id',
            roleDeleteId: 'delete-id',
            carrierRoleId: 'id-in-carrier',
            carrierRoleDeleteId: 'delete-id-in-carrier',
        },
        text: {
            roleName: 'name',
            carrierRoleName: 'name-in-carrier',
        },
        select: {
            roleLocation: 'location',
            carrierRoleLocation: 'location-in-carrier',
        },
    },
};

initialize(prefix, selector);

export default selector;
