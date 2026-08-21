import Address from '/modules/tools/core/address.us.mjs';
import { tel as formatTel, ssn as formatSsn } from '/modules/tools/utils/formatter.mjs';

const $modal = $('#apl-clipboard-modal');
const $fullName = $('#apl-clipboard-fullname');

$modal.modal({
  onHidden() {
    $('.apl-data').html(null);
    $('.copy-apl-info-cred').off('click');
    $fullName.html(null);
  },
});

export default function (application) {
  $('.apl-clipboard').off('click');
  $('.apl-clipboard').on('click', function (evt) {
    evt.preventDefault();

    if (application) return showClipboard(application);

    const _id = $(this).data('id');

    $.ajax(`/api/resource/drivers/applications/${_id}?sensitive=true`, {
      success(response) {
        const { application } = response.data;
        showClipboard(application);
      },
    });
  });
}

function showClipboard(application) {
  const { fullName, formId, dob, ssn, phone, address, dl } = application;
  const view = { ...application };

  const cp =
    ' <sup style="font-size: .65rem;" title="Copy Text"><a href="" class="copy-apl-info-cred"><i class="teal copy outline icon"></i></a></sup>';
  const na = '<span class="ui red text"><small><i>N/A</i></small></span>';

  view.gender = application.expansion.gender;
  view.dob = moment(dob).format('MM/DD/YYYY');
  view.ssn = formatSsn(ssn);
  view.phone = formatTel(phone);
  view.address = new Address(address).html({ inline: false });
  view.dlNum = dl.number;
  // view.dlClass = dl.class
  view.dlState = application.expansion.dlState;
  // view.dlExp = moment(dl.expiresOn).format('MM/DD/YYYY')
  view.dlDuration = `<strong style="font-size: 1.05em;">${moment(dl.issuedOn).format('MM/DD/YYYY')}</strong>${cp}`;
  view.dlDuration += ` — <strong style="font-size: 1.05em;">${moment(dl.expiresOn).format('MM/DD/YYYY')}</strong>${cp}`;
  if (dl?.address?.zip) {
    view.dlAddress = `<span>${dl.address.address1}</span>${cp}`;
    if (dl.address.address2) view.dlAddress += `, <span>${dl.address.address2}</span>${cp}`;
    view.dlAddress += `<br/><span>${dl.address.city}</span>${cp}, <span>${dl.address.state}</span>${cp}`;
    view.dlAddress += ` <span>${dl.address.zip}</span>${cp}`;
  }

  const items = [
    'firstName',
    '^middleName',
    'lastName',
    '^suffix',
    '!gender',
    'dob',
    'ssn',
    'phone',
    'email',
    '!address',
    'dlState',
    'dlNum',
    // '^!dlClass',
    // 'dlExp',
    '!dlDuration',
    '^!dlAddress',
  ];
  items.forEach((prop) => {
    let optional = false,
      ncp = false;
    if (prop[0] === '^') {
      prop = prop.replace('^', '');
      optional = true;
    }
    if (prop[0] === '!') {
      prop = prop.replace('!', '');
      ncp = true;
    }
    let item = view[prop];
    if (optional && !item) item = na;
    else item = `<strong style="font-size: 1.05em;">${item}</strong>${!ncp ? cp : ''}`;
    $(`#apl-clipboard\\:${prop}`).html(item);
  });
  if (dl.class)
    $('#apl-clipboard\\:dlNum').append(`&nbsp; <strong>/&nbsp; ${dl.class}</strong>${cp}`);
  if (!dl.commercial) $('#apl-clipboard\\:dlNum').append('<small> &nbsp;—&nbsp; CDL</small>');
  // if (dl.commercial) $('#apl-clipboard\\:dlClass').append('<small> &nbsp;—&nbsp; CDL</small>')

  $fullName.html(`${fullName} &nbsp;<small style="font-weight: normal;">(${formId})</small>`);

  $modal.modal('show');

  $('.copy-apl-info-cred').on('click', function (evt) {
    evt.preventDefault();

    const text = $(this).parent().prev().text();
    navigator.clipboard.writeText(text).then(() => {
      $.toast({
        title: 'Success!',
        message: 'Copied to clipboard',
        class: 'success',
      });
    });
  });
}
