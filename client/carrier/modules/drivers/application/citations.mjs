import { inputEvent } from '/modules/events/form.mjs';
import Person from '/modules/tools/core/person.mjs';
import Address from '/modules/tools/core/address.us.mjs';
import { capitalizeEach } from '/modules/tools/utils/string.mjs';
import { sortArrayByObjectKey } from '/modules/tools/utils/sorter.mjs';
import calSettings from '/modules/settings/calendar.mjs';
import selector from '/modules/registry/selectors/driver-application.mjs';
import application from './hub.mjs';

const $form = {
  add: $('#new-form'),
  template: $('#form-template'),
};
{
  const templates = $form.template.find('input');
  templates.each(function (i, template) {
    $(template).attr('id', null);
  });

  $form.add.find('input').val(null);
}

(() => {
  if (!application || !Object.keys(application).length) return;

  const { _id, finishedAt } = application;
  const TS = selector.class.text;
  const $table = $('table');
  const $modal = {
    delete: $('#delete-modal'),
  };

  const $add = $('#add'),
    $cancel = $('#cancel');
  $('input:not([type="hidden"]):not([type="checkbox"])').attr('autocomplete', 'off');

  $.ajax(`/api/resource/drivers/applications/${_id}/citations`, {
    success(response) {
      let { data } = response;
      data = sortArrayByObjectKey(data, 'citedOn');

      data.forEach((record, i) => {
        const $tr = $('<tr></tr>');
        const { _id, violation, other, citedOn, state } = record;
        const $cells = $form.template.clone().find('tr').children();

        const $violation = $($cells[0]).find('input');
        const $other = $($cells[1]).find('input');
        const $date = $($cells[2]).find('input');
        const $state = $($cells[3]).find('input');
        const $save = $($cells[4]).find('.save.button');
        const $delete = $($cells[4]).find('.delete.button');

        $violation.val(violation);
        if (violation === 'other') $other.val(other).prop('disabled', false);
        $date.val(citedOn);
        $state.val(state);
        $save.attr('data-id', _id);
        $delete.attr('data-id', _id);

        $tr.append($cells);
        $form.add.after($tr);
      });

      const $dropdown = {
        violation: $('.cit-violation'),
        state: $('.cit-state'),
      };
      const $calendar = {
        date: $('.cit-date'),
      };

      $dropdown.violation.dropdown({
        onChange(value, text, $choice) {
          const $other = $choice.parent().parent().parent().parent().next().find('input');
          const disabled = value !== 'other';

          $other.prop('disabled', disabled);
        },
      });
      $dropdown.state.dropdown({
        onChange(value, text, $choice) {
          //? $choice.parent().parent().parent().parent().parent().find('.unsaved-changes').text('Unsaved Changes')
        },
      });
      $calendar.date.calendar({
        ...calSettings,
        minDate: moment(finishedAt).subtract(3, 'years').toDate(),
        maxDate: moment(finishedAt).toDate(),
      });

      $add.click(function () {
        $form.add.show();
        $(this).hide();
      });
      $cancel.click(function () {
        $form.add.find('input').val(null);
        $form.add.find('.other-field').find('input').prop('disabled', true);
        $form.add.find('.dropdown').dropdown('clear');
        $form.add.hide();
        $add.show();
      });

      inputEvent(TS.citOtherReason, {
        strip: true,
        word: true,
        onInput(citation, $citation) {
          $citation.val(capitalizeEach(citation));
        },
      });

      $('input').on('change', function () {
        const $tr = $(this).closest('tr');
        $tr
          .find('.unsaved-changes')
          .html('<i class="red exclamation triangle icon"></i>')
          .next()
          .prop('disabled', false);
      });

      $('#create, .save').on('click', function () {
        const $button = $(this);
        $button.addClass('loading');
        const _citId = $button.data('id');
        if (!_citId) return;

        const $fields = $button.parent().parent().find('input');
        const citedOn = $($fields[2]).val();
        const data = {
          violation: $($fields[0]).val() || null,
          other: $($fields[1]).val(),
          citedOn: citedOn ? moment(citedOn, 'MMM D, YYYY').format('YYYY-MM-DD') : null,
          state: $($fields[3]).val() || null,
        };
        if (data.violation !== 'other') data.other = null;

        if (
          !data.violation ||
          (data.violation === 'other' && !data.other) ||
          !data.citedOn ||
          !data.state
        ) {
          alert('Fill out all required fields');
          $button.removeClass('loading').find('.icon').removeClass('loading');
          return;
        }

        let url = `/api/resource/drivers/applications/${_id}/citations`,
          method = 'POST';
        if (_citId !== 'new') {
          url += `/${_citId}`;
          method = 'PUT';
        }

        $.ajax({
          url,
          method,
          contentType: 'application/json',
          data: JSON.stringify(data),
          success(response) {
            // const { error } = response
            // if (error) return alert(error)

            if (_citId === 'new') {
              const { added } = response;
              if (added) location.reload();
              return;
            }

            location.reload();
            // else {
            //     $button.prev().html('<i class="green checkmark icon"></i>')
            //     $button.removeClass('loading').prop('disabled', true)
            //         .find('.icon').removeClass('loading')
            //     setTimeout(() => $button.prev().html(null), 5000)
            // }
          },
        });
      });

      $table.fadeIn();

      if (data.length) {
        const violations = $.ajax('/api/enum/driver-application?filter=violations', {
          async: false,
        }).responseJSON;

        $('.delete').on('click', function () {
          const _citId = $(this).data('id');

          const { data: citation } = $.ajax(
            `/api/resource/drivers/applications/${_id}/citations/${_citId}`,
            { async: false },
          ).responseJSON;
          if (!citation) return alert('Oops! Something went wrong!');

          const { other, state, citedOn } = citation;
          let { violation } = citation;
          const recipient = new Person(application);

          if (violation === 'other') violation = `<b>${other}</b>`;
          else
            loop: for (const group in violations) {
              for (const value in violations[group]) {
                if (violation !== value) continue;
                violation = `<b>${violations[group][value]}</b> <small>(${group})</small>`;
                break loop;
              }
            }

          let html = `<b>${recipient.fullName()}</b> <small>(${application.formId})</small><br/>`;
          html += `${violation} on ${moment(citedOn).format('ll')} in ${Address.list.state[state]}`;

          $('#delete-info').html(html);
          $('#delete-id').val(_citId);
          $modal.delete.modal('show');
        });
        $modal.delete.modal({
          autofocus: false,
          closable: false,
          onHidden() {
            $('#delete-id').val(null);
            $('#delete-info').html(null);
          },
        });
        $('#delete-form').submit(function (evt) {
          evt.preventDefault();
          const _citId = $('#delete-id').val();

          $.ajax(`/api/resource/drivers/applications/${_id}/citations/${_citId}`, {
            method: 'DELETE',
            success(response) {
              const { deleted } = response;
              if (!deleted) return alert('Oops! Something went wrong!');

              location.reload();
            },
          });
        });
      }
    },
  });
})();
