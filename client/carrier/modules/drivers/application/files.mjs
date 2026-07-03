import application from './hub.mjs'
import filenames from '/modules/registry/filenames/driver-application-uploads.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id } = application
    const filenameProps = {
        'dl-front': 'dlF',
        'dl-back': 'dlB',
        'mec': 'mec',
        //! add more
    }
    const croppers = {}
    const $upload = {
        dl: $('#upload-dl-file'),
        mec: $('#upload-mec-file'),
    }

    const $modal = {
        upload: {
            dl: $('#upload-dl-modal'),
            mec: $('#upload-mec-modal'),
        },
    }
    const $button = {
        upload: {
            dl: {
                prev: $('#upload-dl-prev-button'),
                next: $('#upload-dl-next-button'),
                submit: $('#upload-dl-submit'),
            },
            mec: {
                prev: $('#upload-mec-prev-button'),
                next: $('#upload-mec-next-button'),
                submit: $('#upload-mec-submit'),
            },
        },
    }
    const $step = {
        upload: {
            dl: $('#upload-dl-step'),
            mec: $('#upload-mec-step'),
        },
    }
    const steps = {
        upload: {
            dl: [
                "Editor: Driver's License <small>(Front)</small>",
                "Editor: Driver's License <small>(Back)</small>",
                'Data Verification and Confirmation',
            ],
            mec: [
                "Editor: Medical Certificate",
                'Data Verification and Confirmation',
            ],
        },
    }
    const activeStep = {
        dl: 0,
        mec: 0,
    }

    const $section = {
        upload: {
            dl: {
                all: $('.dl-section'),
                cropperFront: $('#croparea-dl-front'),
                cropperBack: $('#croparea-dl-back'),
                confirmation: $('#confirmation-dl'),
            },
            mec: {
                all: $('.mec-section'),
                cropper: $('#croparea-mec'),
                confirmation: $('#confirmation-mec'),
            },
        },
    }

    $upload.dl.click(function() {
        $modal.upload.dl.modal({
            autofocus: false,
            closable: false,
            onVisible() {
                setTimeout(() => {
                    croppers?.['dl-front']?.resize()
                    croppers?.['dl-back']?.resize()
                }, 250)
            },
        }).modal('show')
    })

    $upload.mec.click(function() {
        $modal.upload.mec.modal({
            autofocus: false,
            closable: false,
            onVisible() {
                setTimeout(() => {
                    croppers?.['mec']?.resize()
                    croppers?.['mec']?.resize()
                }, 250)
            },
        }).modal('show')
    })

    dropzoneEvents('dl-front', {
        onImageLoad() {
            $button.upload.dl.next.prop('disabled', false)
            $step.upload.dl.html(steps.upload.dl[0])
        },
    })
    dropzoneEvents('dl-back', {
        onImageLoad() {
            $button.upload.dl.next.prop('disabled', false)
        },
    })

    dropzoneEvents('mec', {
        onImageLoad() {
            $button.upload.mec.next.prop('disabled', false)
        },
    })

    $button.upload.dl.next.click(function() {
        $section.upload.dl.all.hide()
        if (activeStep.dl === 0) {
            $button.upload.dl.prev.show()
            if (!croppers['dl-back']) $button.upload.dl.next.prop('disabled', true)
            $section.upload.dl.cropperBack.show()
        }
        if (activeStep.dl === 1) {
            $button.upload.dl.next.hide()
            $button.upload.dl.submit.show()
            $section.upload.dl.confirmation.show()
        }
        $step.upload.dl.html(steps.upload.dl[++activeStep.dl])
    })

    $button.upload.dl.prev.click(function() {
        $section.upload.dl.all.hide()
        if (activeStep.dl === 1) {
            $button.upload.dl.prev.hide()
            $section.upload.dl.cropperFront.show()
            $button.upload.dl.next.prop('disabled', false)
        }
        if (activeStep.dl === 2) {
            $button.upload.dl.submit.hide()
            $button.upload.dl.next.show()
            $section.upload.dl.cropperBack.show()
        }
        $step.upload.dl.html(steps.upload.dl[--activeStep.dl])
    })

    $button.upload.mec.next.click(function() {
        $section.upload.mec.all.hide()
        if (activeStep.mec === 0) {
            $button.upload.mec.next.hide()
            $button.upload.mec.prev.show()
            $button.upload.mec.submit.show()
            $section.upload.mec.confirmation.show()
        }
        $step.upload.mec.html(steps.upload.mec[++activeStep.mec])
    })

    $button.upload.mec.prev.click(function() {
        $section.upload.mec.all.hide()
        if (activeStep.mec === 1) {
            $button.upload.mec.prev.hide()
            $button.upload.mec.submit.hide()
            $button.upload.mec.next.show()
            $section.upload.mec.cropper.show()
        }
        $step.upload.mec.html(steps.upload.mec[--activeStep.mec])
    })


    function dropzoneEvents(target, cb = {}) {
        const $cropArea = $(`#croparea-${target}`)
        const $dropZone = $cropArea.find('.cropper-dropzone')
        const $loadShared = $cropArea.find('.cropper-load-shared')
        const $file = $cropArea.find('.cropper-file')
        const $image = $cropArea.find('.cropper-image')
        const $buttons = $cropArea.find('.cropper-buttons')
        const $preview = $(`#cropper-preview-${target}`)
        const width = $preview.data('width') + 'rem'
        const aspectRatio = +$cropArea.data('aspect-ratio') || NaN

        const $editor = {
            rotate: {
                left: $cropArea.find('.cropper-rotate-left-button'),
                right: $cropArea.find('.cropper-rotate-right-button'),
            },
            zoom: {
                in: $cropArea.find('.cropper-zoom-in-button'),
                out: $cropArea.find('.cropper-zoom-out-button'),
            },
            reset: $cropArea.find('.cropper-reset-button'),
            replace: $cropArea.find('.cropper-replace-button'),
        }

        $dropZone
            .on('click', function(evt) {
                if ($(evt.target).closest('.cropper-load-shared').length) return
                $file.trigger('click')
            })
            .on('dragover', function(evt) {
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

        $loadShared.on('click', function(evt) {
            evt.preventDefault()

            $cropArea.addClass('loading')
            const filename = filenames[filenameProps[target]].filename

            const url = `/image/driver/application/${_id}/uploads/${filename}`
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([ blob ], filename, { type: blob.type })
                    loadImage(file)
                    $cropArea.removeClass('loading')
                })
        })

        $file.on('change', function () {
            loadImage(this.files[0])
        })

        $('.confirm-file-toggle').on('change', function() {
            const $check = $(this).parent().parent().parent().prev().find('.confirm-file-check > .check.icon')
            const action = $(this).prop('checked') ? 'show' : 'hide'
            $check[action]()
        })

        function loadImage(file) {
            if (!file || !file.type.startsWith('image/')) return

            window.loadImage(file, function(img) {
                const src = img.toDataURL ? img.toDataURL() : img.src

                // if (croppers[target]) {
                //     croppers[target].replace(src)

                //     setTimeout(() => {
                //         croppers[target].reset()

                //         updatePreview()
                //         resizeWorkZone()
                //     }, 50)

                //     return
                // }
                if (croppers[target]) {
                    croppers[target].destroy()
                    croppers[target] = null
                }

                $image
                    .off('load')
                    .attr('src', src)
                    .on('load', function() {
                        croppers[target] = new Cropper($image[0], {
                            aspectRatio,
                            viewMode: 1,
                            autoCropArea: 1,
                            responsive: true,
                            checkOrientation: true,
                            preview: `#cropper-preview-${target}`,
                            crop() { updatePreview() },
                            cropend() { updatePreview() },
                            zoom() { updatePreview() },
                        })

                        setTimeout(updatePreview, 100)
                    })
            }, {
                canvas: true,
                orientation: true,
            })

            $image.parent().show()
            $dropZone.hide()
            $buttons.show()

            $editor.rotate.left.on('click', function(evt) {
                evt.preventDefault()
                croppers[target].rotate(-.5)
                updatePreview()
            })

            $editor.rotate.right.on('click', function(evt) {
                evt.preventDefault()
                croppers[target].rotate(.5)
                updatePreview()
            })

            $editor.zoom.in.on('click', function(evt) {
                evt.preventDefault()
                croppers[target].zoom(.05)
                updatePreview()
            })

            $editor.zoom.out.on('click', function(evt) {
                evt.preventDefault()
                croppers[target].zoom(-.05)
                updatePreview()
            })

            $editor.reset.on('click', function(evt) {
                evt.preventDefault()
                croppers[target].reset()
                updatePreview()
            })

            $editor.replace.on('click', function(evt) {
                evt.preventDefault()
                $file.click()
            })

            if (cb.onImageLoad) cb.onImageLoad()

            function updatePreview() {
                const cropper = croppers[target]
                if (!cropper) return

                const canvas = cropper.getCroppedCanvas()
                if (!canvas) return

                const dataUrl = canvas.toDataURL()
                if (!dataUrl) return

                $preview.find('img').attr('src', dataUrl)
                resizeWorkZone()
            }

            function resizeWorkZone() { //! SOME ISSUES PERSIST
                //! $image.css()
                $preview.css({ width, height: '100%', overflow: 'hidden' })
                    .find('img').css({ width: 'inherit', height: 'inherit' })
            }
        }
    }
})()