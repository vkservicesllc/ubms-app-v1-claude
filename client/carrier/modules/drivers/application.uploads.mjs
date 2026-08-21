import table from './applications.mjs';

const $loader = $('#img-loader');
const $modal = $('#apl-upl-card-modal');
const $fullName = $('#apl-upl-card-fullname');
const $content = $('#apl-upl-content');

$modal.modal({
    onHidden() {
        $fullName.html(null);
        $content.html(null);
        $('.special.cards .image').dimmer('destroy');
    },
});

table.on('draw', function () {
    $('.apl-uploads').off('click');

    $('.apl-uploads').on('click', function (evt) {
        evt.preventDefault();
        $loader.addClass('active');

        const _id = $(this).data('id');

        $.ajax(`/api/resource/drivers/applications/${_id}`, {
            success(response) {
                const { fullName, formId, uploads } = response.data.application;
                if (uploads === null) return;

                $fullName.html(fullName);
                let fileName = fullName.replace(',', '').replace(/[\s+]/g, '_');
                fileName += `_${formId}`;

                let html = '<div class="ui special cards">';
                for (const prop in uploads) {
                    const [proceed, filename, name, nameExt] = uploads[prop];
                    if (!proceed) continue;

                    const path = `/image/driver/application/${_id}/uploads/${filename}`;
                    let header = name;
                    if (nameExt)
                        header += ` <span class="ui grey text"><small>(${nameExt})</small></span>`;
                    html += `
                        <div class="card" style="max-height: 16.4rem; overflow: hidden;">
                            <div class="blurring dimmable image" style="height: 12rem; overflow: hidden;">
                                <div class="ui dimmer">
                                    <div class="content">
                                        <div class="center">
                                            <a class="ui inverted button" href="${path}" download="${filename}__${fileName}">Download</a>
                                        </div>
                                    </div>
                                </div>
                                <img src="${path}" onerror="this.closest('.card').remove()" style="width: 100%; height: 100%; object-fit: cover;" />
                            </div>
                            <div class="content">
                                <span class="header">${header}</span>
                            </div>
                        </div>
                    `;
                }
                html += '</div>';
                $content.html(html);

                setTimeout(() => {
                    $modal.modal('show');
                    $('.special.cards .image').dimmer({
                        on: 'ontouchstart' in document.documentElement ? 'click' : 'hover',
                    });
                    $loader.removeClass('active');
                }, 350);
            },
        });
    });
});
