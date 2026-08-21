import initialize from './support.mjs';

const prefix = 'company-refsource';

const selector = {
    class: {},
    id: {
        hidden: {
            id: 'id',
            deleteId: 'delete-id',
            name: 'current-name',
        },
        text: {
            name: 'name',
        },
    },
};

initialize(prefix, selector);

export default selector;
