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

  $form.add.find('input:not([type="checkbox"])').val(null);
  $form.add.find('[type="checkbox"]').prop('checked', false);
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

  $.ajax(`/api/resource/drivers/applications/${_id}/accidents`, {
    success(response) {
      let { data } = response;
      data = sortArrayByObjectKey(data, 'date');

      data.forEach((record, i) => {
        const $tr = $('<tr></tr>');
        const { _id, collision, other, date, state, injuries, fatalities } = record;
        const $cells = $form.template.clone().find('tr').children();

        const $collision = $($cells[0]).find('input');
        const $other = $($cells[1]).find('input');
        const $date = $($cells[2]).find('input');
        const $state = $($cells[3]).find('input');
        const $injuries = $($cells[4]).find('input');
        const $fatalities = $($cells[5]).find('input');
        const $save = $($cells[6]).find('.save.button');
        const $delete = $($cells[6]).find('.delete.button');

        $collision.val(collision);
        if (collision === 'other') $other.val(other).prop('disabled', false);
        $date.val(date);
        $state.val(state);
        $injuries.prop('checked', injuries);
        $fatalities.prop('checked', fatalities);
        $save.attr('data-id', _id);
        $delete.attr('data-id', _id);

        $tr.append($cells);
        $form.add.after($tr);
      });

      const $dropdown = {
        collision: $('.acc-type'),
        state: $('.acc-state'),
      };
      const $calendar = {
        date: $('.acc-date'),
      };

      $dropdown.collision.dropdown({
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
        $form.add.find('input:not([type="checkbox"])').val(null);
        $form.add.find('[type="checkbox"]').prop('checked', false);
        $form.add.find('.other-field').find('input').prop('disabled', true);
        $form.add.find('.dropdown').dropdown('clear');
        $form.add.hide();
        $add.show();
      });

      inputEvent(TS.accOtherType, {
        strip: true,
        word: true,
        onInput(accident, $accident) {
          $accident.val(capitalizeEach(accident));
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
        const _accId = $button.data('id');
        if (!_accId) return;

        const $fields = $button.parent().parent().find('input');
        const date = $($fields[2]).val();
        const data = {
          collision: $($fields[0]).val() || null,
          other: $($fields[1]).val(),
          date: date ? moment(date, 'MMM D, YYYY').format('YYYY-MM-DD') : null,
          state: $($fields[3]).val() || null,
          injuries: $($fields[4]).prop('checked'),
          fatalities: $($fields[5]).prop('checked'),
        };
        if (data.collision !== 'other') data.other = null;

        if (
          !data.collision ||
          (data.collision === 'other' && !data.other) ||
          !data.date ||
          !data.state
        ) {
          alert('Fill out all required fields');
          $button.removeClass('loading').find('.icon').removeClass('loading');
          return;
        }

        let url = `/api/resource/drivers/applications/${_id}/accidents`,
          method = 'POST';
        if (_accId !== 'new') {
          url += `/${_accId}`;
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

            if (_accId === 'new') {
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
        const accidents = $.ajax('/api/enum/driver-application?filter=accidents', {
          async: false,
        }).responseJSON;

        $('.delete').on('click', function () {
          const _accId = $(this).data('id');

          const { data: accident } = $.ajax(
            `/api/resource/drivers/applications/${_id}/accidents/${_accId}`,
            { async: false },
          ).responseJSON;
          if (!accident) return alert('Oops! Something went wrong!');

          const { other, state, date } = accident;
          let { collision } = accident;
          const participant = new Person(application);

          if (collision === 'other') collision = `<b>${other}</b>`;
          else
            loop: for (const group in accidents) {
              for (const value in accidents[group]) {
                if (collision !== value) continue;
                collision = `<b>${accidents[group][value]}</b> <small>(${group})</small>`;
                break loop;
              }
            }

          let html = `<b>${participant.fullName()}</b> <small>(${application.formId})</small><br/>`;
          html += `${collision} on ${moment(date).format('ll')} in ${Address.list.state[state]}`;

          $('#delete-info').html(html);
          $('#delete-id').val(_accId);
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
          const _accId = $('#delete-id').val();

          $.ajax(`/api/resource/drivers/applications/${_id}/accidents/${_accId}`, {
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
