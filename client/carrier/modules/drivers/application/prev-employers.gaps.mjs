import selector from '/modules/registry/selectors/driver-application-employment.mjs';
import application from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;

  const { _id, appliedOn } = application;
  const $table = $('#empl-gap-table');

  $.ajax(`/api/resource/drivers/applications/${_id}/employments`, {
    success(response) {
      const { data } = response;
      const body = [];
      let prevDate = appliedOn,
        i = 0;

      data.map((employment) => {
        const { _id, employer, startedOn, leftOn, gapExpl } = employment;
        const date = {
          previous: moment(prevDate),
          current: moment(leftOn || application.appliedOn),
        };

        if (date.current.isSameOrBefore(date.previous)) {
          prevDate = startedOn;

          const difference = Math.abs(date.previous.diff(date.current, 'days'));

          if (difference > 30) {
            const gapPeriod = date.current.format('ll') + ' – ' + date.previous.format('ll');

            let period = moment(startedOn).format('ll') + ' – ';
            period += leftOn ? moment(leftOn).format('ll') : 'Present Day';
            const style = gapExpl ? 'dark green' : 'blue';

            body.push($('<tr></tr>'));
            body[i].append(`<td title="${period}"><b>${employer}</b></td>`);
            body[i].append(`<td>${gapPeriod}</td>`);
            body[i].append(
              `<td><div class="field"><textarea class="explain-employment-gap" name="explGap[]" placeholder=" " rows="2" required>${gapExpl}</textarea></div></td>`,
            );
            body[i].append(
              `<td class="right aligned"><button class="ui tiny ${style} icon button"><i class="save icon"></i></button></td>`,
            );
            i++;
          }
        }
      });

      if (body.length) $table.html(null).append(body);
      $table.parent().fadeIn();
    },
  });
})();
