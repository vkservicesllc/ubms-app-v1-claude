/* jQuery & jQuery Caret required */
import { tokenEvent, authEvent } from './events/user.mjs';
import selector from '/modules/registry/selectors/user.mjs';

tokenEvent();

authEvent(($form, $token, params) => {
    const { valid } = params;

    if (!valid) return alert('Invalid token');

    $form.unbind().submit();
});

$('#resend').click(() => {
    const params = new URLSearchParams(window.location.search);
    const _id = params.get('user');

    $.ajax('/api/token/resend', {
        method: 'POST',
        data: { _id },
        success(response) {
            const { status, token } = response;
            if (status === 'error') return alert('Error Occured');

            if (token) $(selector.id.text.token).val(token);
            else
                $('#notification').html(`
                    <p>
                        <i class="thumbs up outline icon"></i>
                        The token has been resent.
                    </p>
                    <span class="ui red text">
                        <i class="icon attention"></i>
                        If you still haven't received the token after trying again, there may be an issue with our mail system.
                        In such case, please contact technical support.
                    </span>
                `);
        },
        error(err) {
            console.error(err);
            alert(err.responseJSON);
        },
    });
});
