import Person from './tools/core/person.mjs';
import Address from './tools/core/address.us.mjs';
import escapeHTML from './tools/utils/html.mjs';
import { tel as formatTel } from './tools/utils/formatter.mjs';

const statusReq = $.ajax('/api/session/status', { method: 'POST' });

$.when(statusReq).done((statusRes) => {
  const [adminStatus] = statusRes;
  const interval = 30000;

  // let emptyTableMsg = 'No companies registered at this time'
  // if (adminStatus === 'A') emptyTableMsg = 'No companies to display'

  const table = new DataTable('#companies-table', {
    ajax: {
      url: '/api/resource/companies',
      data(query) {
        query.category = $('#dt-custom-select-categories').val() || undefined;
        query.owner = $('#dt-custom-select-owners').val() || undefined;
        query.state = $('#dt-custom-select-states').val() || undefined;
        query.alphabet = $('.alphabet.is-primary').text() || undefined;

        return query;
      },
      dataSrc(response) {
        const { data: companies } = response;
        let owners = [];
        const names = [];

        companies.map((company) => {
          const { confirmed, owner } = company;

          if (!confirmed)
            company.expansion.categoryGroup =
              '<small class="has-text-weight-normal has-text-danger">... pending</small>';

          if (owner._id) owner.name = new Person(owner).fullName();
          owners.push({ [owner._id]: owner.name });
        });

        owners = Array.from(new Set(owners.map((owner) => JSON.stringify(owner)))).map((str) =>
          JSON.parse(str),
        );

        owners.map((owner) => {
          const name = Object.values(owner)[0];
          names.push(name);
        });

        let dublicates = names.filter((name, i) => names.indexOf(name) !== i);
        dublicates = [...new Set(dublicates)];

        companies.forEach((company, i) => {
          const { owner } = company;
          const { name } = owner;

          owner.name = escapeHTML(owner.name);
          if (dublicates.includes(name))
            owner.name += ` <small class="has-text-grey">(${owner.age} yo)</small>`;
        });

        return companies;
      },
    },

    columns: [
      {
        data: null,
        title: 'Group',
        visible: false,
        searchable: false,
        render(data, type, row) {
          return row.expansion.categoryGroup;
        },
      },

      {
        data: 'category',
        title: 'Category',
        visible: false,
        searchable: false,
      },

      {
        data: 'active',
        searchable: false,
        orderable: false,
        width: '8.57rem',
        render(data, type, row) {
          if (row.until)
            return `<small class="has-text-danger-55" title="Permanently closed on ${moment(row.until).format('ll')}">Closed</small>`;
          if (!row.confirmed) return '<i class="fa fa-hourglass-half has-text-primary"></i>';
          let txt = data ? 'success-dark">Active' : 'danger-dark">Inactive';

          return `<small class="has-text-${txt}</small>`;
        },
      },

      {
        data: 'alias',
        orderable: false,
        width: '5%',
        render(data, type, row) {
          return `<span class="box py-0" data-target="${row._id}">${escapeHTML(data)}</span>`;
        },
        createdCell(cell, data, row) {
          const { style } = row;

          if (style) {
            const $box = $(cell).find('.box');
            const { background, color } = style;

            if (background) $box.css('background-color', background);
            if (color) $box.css('color', color);
          }
        },
      },

      {
        data: 'name',
        title: 'Name',
        render(data, type, row) {
          let link = '';
          if (row.website)
            link = `&nbsp; <a href="https://${row.website}" target="_blank"><i class="fa fa-arrow-up-right-from-square has-text-grey is-size-7"></i></a>`;

          return `<span class="has-text-weight-semibold">${escapeHTML(data) + link}</span>`;
        },
      },

      {
        data: 'since',
        title: 'Launch Date',
        searchable: false,
        width: '10.7rem',
        className: 'has-text-left',
        defaultContent: '<i class="has-text-danger">TBD</i>',
        render(data, type) {
          if (data === '0000-00-00') return;
          return type == 'display' ? moment(data, 'YYYY-MM-DD').format('ll') : data;
        },
      },

      {
        data: 'owner',
        title: 'Owner/Parent',
        render(data, type, row) {
          const { name } = row.owner?.parent || {};
          return name || data.name;
        },
      },

      {
        data: 'address',
        title: 'Base State',
        searchable: false,
        render(data) {
          if (!data.physical.state) return;

          return data.physical.expansion.state;
        },
      },

      {
        data: 'address',
        title: 'Address',
        searchable: false,
        orderable: false,
        render(data) {
          return new Address(data.physical).html();
        },
      },

      {
        data: 'phone',
        title: 'Phone',
        orderable: false,
        render(data) {
          return formatTel(data);
        },
      },

      {
        data: 'fax',
        title: 'Fax',
        orderable: false,
        render(data) {
          if (!data) return;
          return formatTel(data);
        },
      },

      {
        data: 'lastLogo',
        title: 'Logo',
        orderable: false,
        render(data) {
          return data
            ? '<span class="has-text-success-dark"><i class="fa fa-check"></i></span>'
            : '<span class="has-text-danger-dark"><i class="fa fa-close"></i></span>';
        },
      },

      {
        data: null,
        title:
          adminStatus != 'A'
            ? '<div class="dt-action"><a class="has-text-link-70" href="/business/company/new" title="Add"><i class="fas fa-plus"></i></a></div>'
            : '',
        orderable: false,
        searchable: false,
        visible: adminStatus != 'A',
        render(data, type, row) {
          let cell = '';

          if (adminStatus != 'A') {
            let fa,
              url = '/business';

            if (row.confirmed) {
              const category = row.expansion.path[1];
              const { route } = row;
              fa = 'file-lines';
              url += `/${category}/${route}`;
            } else {
              fa = 'pen-to-square';
              url += `/company/${row._id}`;
            }

            cell = '<div class="dt-action">';
            cell += `<a class="has-text-success-45 modify-company" href="${url}" title="Modify"><i class="fas fa-${fa}"></i></a>`;
            cell += '</div>';
          }

          return cell;
        },
      },
    ],

    createdRow(tr, data) {
      if (data.until) $(tr).find('td').css('color', 'grey');
      else if (!data.active) $(tr).addClass('is-warning');
    },

    dom: '<"dt-top-toolbar-1"><"dt-top-toolbar-2"lf>rt<"dt-bottom-toolbar"ip>',

    initComplete(settings, response) {
      if (!response.data.length) return;

      if (false)
        response.supData.alphabet = [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'I',
          'J',
          'K',
          'L',
          'M',
          'N',
          'O',
          'P',
          'Q',
          'R',
          'S',
          'T',
          'U',
          'V',
          'W',
          'X',
          'Y',
          'Z',
        ];
      const { alphabet, categories, owners, states } = response.supData;
      const $toolbar = $('<div class="custom-dt-toolbar"></div>');
      const $alphabet = $(
        '<div class="buttons"><button class="button alphabet is-primary is-dark">A-Z</button> - </div>',
      );
      alphabet.map((letter) =>
        $alphabet.append(`<button class="button alphabet">${letter}</button>`),
      );

      $('.dt-top-toolbar-1').append('<div></div>').append($alphabet).append('<div></div>');

      const dropdown = {
        categories:
          '<div><label for="dt-custom-select-categories">Filter by Category:</label><div class="select"><select id="dt-custom-select-categories">',
        owners:
          '<div><label for="dt-custom-select-owners">Filter by Owner:</label><div class="select"><select id="dt-custom-select-owners">',
        states:
          '<div><label for="dt-custom-select-states">Filter by Base State:</label><div class="select"><select id="dt-custom-select-states">',
      };
      dropdown.categories += '<option value="">All</option>';
      dropdown.owners += '<option value="">All</option>';
      dropdown.states += '<option value="">All</option>';
      categories.map(
        (category) =>
          (dropdown.categories += `<option value="${category.code}">${category.name}</option>`),
      );
      owners.map(
        (owner) => (dropdown.owners += `<option value="${owner._id}">${owner.name}</option>`),
      );
      states.map(
        (state) => (dropdown.states += `<option value="${state.code}">${state.name}</option>`),
      );

      dropdown.categories += '</select></div></div>';
      dropdown.owners += '</select></div></div>';
      dropdown.states += '</select></div></div>';
      $toolbar.append(dropdown.categories).append(dropdown.owners).append(dropdown.states);

      $('.dt-length').after($toolbar);

      $('.alphabet')
        .off('click')
        .on('click', function () {
          $('.alphabet').removeClass('is-primary is-dark');
          $(this).addClass('is-primary is-dark');

          table.ajax.reload();
        });
      $('#dt-custom-select-categories, #dt-custom-select-owners, #dt-custom-select-states')
        .off('change')
        .on('change', () => table.ajax.reload());
    },

    language: {
      emptyTable: `<span class="has-text-danger">No companies matching your query</span>`,
    },

    lengthMenu: [
      [10, 50, 100, -1],
      [10, 50, 100, 'All'],
    ],

    order: [
      [0, 'asc'],
      [4, 'asc'],
    ],

    rowGroup: {
      dataSrc(row) {
        return row.expansion.categoryGroup;
      },
    },
  });

  setInterval(() => {
    dtFnFilterData(table);
  }, interval);

  onDraw(table);
});
