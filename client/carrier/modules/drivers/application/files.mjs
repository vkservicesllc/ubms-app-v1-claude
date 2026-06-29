import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const $upload = {
        dl: $('#upload-dl-file'),
    }

    const $modal = {
        upload: {
            dl: $('#upload-dl-modal'),
        },
    }

    $upload.dl.click(function() {
        $modal.upload.dl.modal({
            autofocus: false,
            closable: false,
        }).modal('show')
    })
})()