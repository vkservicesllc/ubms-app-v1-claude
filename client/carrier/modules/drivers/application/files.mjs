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

    function dropzoneEvents(target) {
        const $drop = $(`#dropzone-${target}`)
        const $file = $(`#file-${target}`)
        const $image = $(`#image-${target}`)
        const $preview = $(`#preview-${target}`)

        $drop
            .on('click', function(evt) {
                evt.preventDefault()
                $file.click()
            })
            .on('dragover', (evt) => {
                evt.preventDefault()
                $(this).css('outline', '1px dotted grey')
            })
            .on('drop', function(evt) {
                evt.preventDefault()
                $(this).css('outline', 'none')

                //
            })
    }
})()