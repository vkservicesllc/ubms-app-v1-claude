import initialize from './support.mjs';

const prefix = 'user';

const selector = {
    class: {
        combo: {
            id: 'id',
            gender: 'gender',
            roleId: 'role-id',
        },
        text: {
            signIn: 'sign-in',
            signUp: 'sign-up',
            name: 'name',
            contacts: 'contacts',
            roleName: 'role-name',
        },
        select: {
            gender: 'gender',
            props: 'properties',
            roles: 'roles',
            teams: 'teams',
            roleLocation: 'role-location',
        },
        radio: {
            gender: 'gender',
            condition: 'condition',
        },
    },
    id: {
        hidden: {
            id: 'id',
            username: 'username',
            email: 'email',
            modifyId: 'modify-id',
            deleteId: 'delete-id',
            resetId: 'reset-id',
        },
        text: {
            username: 'username',
            password: 'password',
            token: 'token',
            newUsername: 'username-new',
            createPassword: 'password-create',
            confirmPassword: 'password-confirm',
            firstName: 'first-name',
            lastName: 'last-name',
            alias: 'alias',
            email: 'email',
            phone: 'phone',
        },
        select: {
            gender: 'gender',
            status: 'status',
            location: 'location',
            condition: 'condition',
            roles: 'roles',
            availableRoles: 'roles-available',
            teams: 'teams',
            availableTeams: 'teams-available',
        },
        radio: {
            gender: {
                male: 'gender-male',
                female: 'gender-female',
            },
            condition: {
                active: 'condition-active',
                inactive: 'condition-inactive',
                locked: 'condition-locked',
            },
        },
        checkbox: {
            unscoped: 'unscoped',
        },
    },
};

initialize(prefix, selector);

export default selector;
