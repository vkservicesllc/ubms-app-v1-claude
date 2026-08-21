import { inputEvent } from '../events/form.mjs';

let cropper;
const _id = $('#company-logo-id').val();
const $modal = $('#company-logo-modal');
const $area = $('#company-log-droparea');
const $container = $('#company-logo-cropper');
const $logo = $('#company-logo');
const $input = $('#company-logo-file-input');
const $since = $('#company-logo-since');
const $form = $('#company-logo-form');
const defSince = $('#company-logo-default-since').val();

$('#add-company-logo').on('click', () => $modal.addClass('is-active'));

$('#close-company-logo-modal').on('click', () => {
    $modal.removeClass('is-active');
    if (cropper) cropper.destroy();
    $logo.attr('src', '');
    $container.hide();
    $area.show();
    if ($since.length) $since.val(moment().format('MM/DD/YYYY'));
});

$area
    .on('click', function () {
        $input[0].click();
    })
    .on('dragover', function (evt) {
        evt.preventDefault();
        $(this).css('border-color', '#3273dc');
    })
    .on('dragleave', function (evt) {
        evt.preventDefault();
        $(this).css('border-color', '#ccc');
    })
    .on('drop', function (evt) {
        evt.preventDefault();
        $(this).css('border-color', '#ccc');
        handleFile(evt.originalEvent.dataTransfer.files[0]);
    });

$input.on('change', function (evt) {
    handleFile(evt.target.files[0]);
});

if ($since.length)
    inputEvent('#company-logo-since', {
        datepicker: {
            maxDate: new Date(),
            minDate: defSince !== '0000-00-00' ? moment(defSince).toDate() : undefined,
            dateFormat: 'mm/dd/yy',
        },
    });

$form.on('submit', function (evt) {
    evt.preventDefault();
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob(function (blob) {
        const formData = new FormData();
        formData.append('companyLogo', blob, 'cropped-company-logo.png');

        let url = `/upload/business/company/${_id}/logo`;
        if ($since.length) {
            const since = moment($since.val(), 'MM/DD/YYYY').format('YYYY-MM-DD');
            url += `?since=${since}`;
        }

        $.ajax(
            {
                url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success(response) {
                    reloadPage();
                },
                error(err) {
                    console.error(err);
                },
            },
            'image/png',
        );
    });
});

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();

    reader.onload = function (evt) {
        $logo.attr('src', evt.target.result);
        $container.show();

        if (cropper) cropper.destroy();
        cropper = new Cropper($logo[0], {
            viewMode: 1,
        });
    };

    reader.readAsDataURL(file);
    $area.hide();
}

$('.delete-company-logo').click(function () {
    if (confirm('Confirm deletion: Are you sure you want to delete the current logo?')) {
        const filename = $(this).data('filename');

        $.ajax(`/file/delete/business/company/${_id}/logo`, {
            method: 'POST',
            data: { filename },
            success(response) {
                reloadPage();
            },
            error(err) {
                console.error(err);
            },
        });
    }
});

function reloadPage() {
    const url = new URL(window.location.href);
    url.searchParams.set('logo', '');
    window.location.href = url.toString();
}
