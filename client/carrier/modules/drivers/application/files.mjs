import application from './hub.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const croppers = {}
    const $upload = {
        dl: $('#upload-dl-file'),
    }

    const $modal = {
        upload: {
            dl: $('#upload-dl-modal'),
        },
    }
    const $button = {
        upload: {
            dl: {
                prev: $('#upload-dl-prev-button'),
                next: $('#upload-dl-next-button'),
                submit: $('#upload-dl-submit'),
            },
        },
    }
    const $step = {
        upload: {
            dl: $('#upload-dl-step'),
        },
    }

    $upload.dl.click(function() {
        $modal.upload.dl.modal({
            autofocus: false,
            closable: false,
        }).modal('show')
    })

    dropzoneEvents('dl-front', {
        onImageLoad() {
            $button.upload.dl.next.prop('disabled', false)
            $step.upload.dl.html("Driver's License <small>(Front)</small>")
        },
    })
    dropzoneEvents('dl-back')


    function dropzoneEvents(target, cb = {}) {
        const $cropArea = $(`#croparea-${target}`)
        const $dropZone = $cropArea.find('.cropper-dropzone')
        const $file = $cropArea.find('.cropper-file')
        const $image = $cropArea.find('.cropper-image')
        const $buttons = $cropArea.find('.cropper-buttons')
        const $preview = $cropArea.find('.cropper-preview')
        const aspectRatio = +$cropArea.data('aspect-ratio') || NaN

        $dropZone
            .on('click', function() {
                $file.click()
            })
            .on('dragover', (evt) => {
                evt.preventDefault()
                evt.stopPropagation()
                $(this).css('outline', '2px dashed #2185d0')
            })
            .on('dragleave', function() {
                $(this).css('outline', 'none')
            })
            .on('drop', function(evt) {
                evt.preventDefault()
                evt.stopPropagation()
                $(this).css('outline', 'none')

                loadImage(evt.originalEvent.dataTransfer.files[0])
            })

        $file.on('change', function () {
            loadImage(this.files[0])
        })

        function loadImage(file) {
            if (!file || !file.type.startsWith('image/')) return

            const reader = new FileReader()

            reader.onload = function (e) {
                const src = e.target.result

                if (croppers[target]) {
                    croppers[target].replace(src)
                } else {
                    $image.attr('src', src)

                    croppers[target] = new Cropper($image[0], {
                        aspectRatio,
                        viewMode: 1,
                        autoCropArea: 1,
                        responsive: true,
                        preview: $preview[0]
                    })
                }
            }

            reader.readAsDataURL(file)
            $image.parent().show()
            $dropZone.hide()
            $buttons.show()
            if (cb.onImageLoad) cb.onImageLoad()
        }
    }
})()