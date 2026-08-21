import Person from '/modules/tools/core/person.mjs';
import Address from '/modules/tools/core/address.us.mjs';
import escapeHTML from '/modules/tools/utils/html.mjs';
import styleSearch, { tag as searchTag } from '/modules/tools/search.mjs';
import { tel as formatTel } from '/modules/tools/utils/formatter.mjs';

const interval = 300000;

const table = $('#driver-applicants-table').DataTable({
    ajax: {
        url: '/api/resource/drivers/applicants/query',
        dataSrc(response) {
            const { data } = response;
            const today = moment();

            data.map((row) => {
                if (row.identification.expiresOn) {
                    const dlExpiresOn = moment(row.identification.expiresOn);
                    row.dlExpiresOn = dlExpiresOn;
                    row.dlStatus = 'Valid';
                    row.dlState = row.identification.state;

                    if (today.isSameOrAfter(dlExpiresOn)) row.dlStatus = 'Expired';
                    else {
                        const dlDiff = dlExpiresOn.diff(today, 'days');
                        if (dlDiff < 30) {
                            row.dlStatus = 'Expires Soon';
                            row.dlDiff = dlDiff;
                        }
                    }
                }
            });

            return data;
        },
    },

    columns: [
        {
            data: 'blackListed',
            searchable: false,
            orderable: false,
            render(data) {
                if (!data) return '<i class="dark green thumbs up icon outline"></i>';

                return '<i class="dark red thumbs down icon outline" title="Blacklisted"></i>';
            },
        },

        {
            title: `Legal Name ${searchTag}`,
            orderable: false,
            render(data, type, row) {
                return new Person(row).fullName('FMLs');
            },
        },

        {
            data: 'gender',
            title: 'Gender',
            searchable: false,
            orderable: false,
            render(data) {
                if (data === null) return;
                return { M: 'Male', F: 'Female' }[data];
            },
        },

        {
            data: 'dob',
            title: 'Date of Birth',
            searchable: false,
            orderable: false,
            render(data) {
                return moment(data).format('ll');
            },
        },

        {
            title: 'Age',
            searchable: false,
            orderable: false,
            type: 'string',
            data(row) {
                return new Person(row).age;
            },
        },

        {
            data: 'phone',
            title: `Phone ${searchTag}`,
            orderable: false,
            render(data) {
                return formatTel(data);
            },
        },

        {
            data: 'email',
            title: 'Email',
            searchable: false,
            orderable: false,
        },

        {
            data: null,
            title: 'Address',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                return new Address(row.address).html();
            },
        },

        {
            data: 'dlState',
            title: 'DL State',
            searchable: false,
            orderable: false,
            render(data) {
                return Address.list.state[data];
            },
        },

        {
            data: 'dlExpiresOn',
            title: 'DL Expires on',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                if (!data) return;

                let warning = '';
                if (row.dlStatus === 'Expired')
                    warning = ' <i class="dark red exclamation triangle icon"></i>';
                if (row.dlStatus === 'Expires Soon')
                    warning = ' <i class="dark orange exclamation circle icon"></i>';

                return moment(data).format('ll') + warning;
            },
        },

        {
            data: 'dlStatus',
            title: 'DL Status',
            searchable: false,
            orderable: false,
            render(data, type, row) {
                if (!data) return;

                let style = ' green';
                if (data === 'Expired') style = ' red';
                if (data === 'Expires Soon') {
                    style = ' orange';
                    data += ` <small>(${row.dlDiff} days)</small>`;
                }

                if (row.blackListed) style = '';
                else style = ` dark ${style}`;

                return `<span class="ui${style} text">${data}</span>`;
            },
        },
    ],

    createdRow(row, data) {
        if (data.blackListed)
            $(row).css({
                backgroundColor: '#FFE9EC',
                color: '#d32d2dff',
            });
    },

    dom: '<"top-toolbar"lf>rt<"bottom-toolbar"ip><"clear">',

    fixedHeader: {
        header: true,
        headerOffset: $('#top-nav').height(),
    },

    initComplete(settings, data) {
        styleSearch();

        const toolbar = $('<div class="custom-dt-toolbar"></div>');
        $('.dt-length').after(toolbar);

        $('#dt-search-0').on('input', function () {
            $(this).val($(this).val().replace(/\W/gi, ''));
        });

        $('.dt-length, .dt-search, .custom-dt-toolbar').css('visibility', 'visible');
    },

    language: {
        emptyTable: '<span class="ui red text">No applicants at this time</span>',
    },

    lengthMenu,
    processing: true,
    serverSide: true,
});

setInterval(() => {
    dtFnFilterData(table);
}, interval);
