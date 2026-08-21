export function refreshPreview(croppers, target) {
    const cropper = croppers[target]
    if (!cropper) return

    const canvas = cropper.getCroppedCanvas()
    if (!canvas) return

    const dataUrl = canvas.toDataURL()
    if (!dataUrl) return

    const $preview = $(`#cropper-preview-${target}`)
    const maxWidth = $preview.data('width') + 'rem'

    let $img = $preview.find('img')
    if (!$img.length) $img = $('<img />').appendTo($preview)

    $preview.css({ width: 'auto', height: 'auto', overflow: 'visible' })
    $img.attr('src', dataUrl)
        .css({ width: 'auto', height: 'auto', maxWidth, maxHeight: '100%' })
}

export function buttonEvents({ $button, $section, $step, steps, activeStep, croppers }, prop) {
    const button = $button.upload[prop];
    const section = $section.upload[prop];
    const twoStep = !!section.cropperFront;

    const frontKey = twoStep ? `${prop}-front` : prop;
    const backKey = `${prop}-back`;

    button.next.click(function () {
        section.all.hide();

        if (activeStep[prop] === 0) {
            if (button.ignore) button.ignore.hide();

            if (twoStep) {
                button.prev.show();
                if (!croppers[backKey]) button.next.prop('disabled', true);
                section.cropperBack.show();
                if (button.skip) button.skip.show();
            } else {
                button.next.hide();
                button.prev.show();
                button.submit.show();
                section.confirmation.show();
            }
        }

        if (twoStep && activeStep[prop] === 1) {
            button.next.hide();
            button.submit.show();
            if (button.skip) button.skip.hide();
            section.confirmation.show();
        }

        $step.upload[prop].html(steps.upload[prop][++activeStep[prop]]);
    });

    button.prev.click(function () {
        section.all.hide();

        if (twoStep) {
            if (activeStep[prop] === 1) {
                button.prev.hide();
                section.cropperFront.show();
                button.next.prop('disabled', false);
                if (button.skip) button.skip.hide();
            }
            if (activeStep[prop] === 2) {
                button.submit.hide();
                button.next.show();
                section.cropperBack.show();
                if (!croppers[backKey] && button.skip) button.skip.show();
            }
        } else if (activeStep[prop] === 1) {
            button.prev.hide();
            button.submit.hide();
            button.next.show();
            section.cropper.show();
        }

        $step.upload[prop].html(steps.upload[prop][--activeStep[prop]]);
    });

    if (button.skip)
        button.skip.click(function () {
            section.all.hide();
            button.next.hide();
            button.submit.show();
            section.confirmation.show();
            $(this).hide();
            $step.upload[prop].html(steps.upload[prop][++activeStep[prop]]);
        });
}

export function uploadFormEvent(
    { $form, $section, $button, croppers, getResizedBlob, formId },
    prop,
    { fieldName = prop, endpoint, dateFields = [], validate, extend } = {},
) {
    const section = $section.upload[prop]
    const twoStep = !!section.cropperFront
    const backKey = `${prop}-back`

    $form.upload[prop].on('submit', function(evt) {
        evt.preventDefault()
        if (validate && !validate()) return

        const form = this

        const blobs = [ getResizedBlob(twoStep ? `${prop}-front` : prop) ]
        if (twoStep && (!$button.upload[prop].skip || croppers[backKey]))
            blobs.push(getResizedBlob(backKey))

        Promise.all(blobs).then(([ front, back ]) => {
            const formData = new FormData(form)

            if (twoStep) {
                formData.set(`${fieldName}F`, front, `${fieldName}F.jpg`)
                if (back) formData.set(`${fieldName}B`, back, `${fieldName}B.jpg`)
                else formData.delete(`${fieldName}B`)
            } else
                formData.set(fieldName, front, `${fieldName}.jpg`)

            if (extend) extend(formData)

            for (const [ key, value ] of formData.entries())
                if (dateFields.includes(key) && value)
                    formData.set(key, moment(value, 'MMM D, YYYY').format('YYYY-MM-DD'))

            fetch(`/upload/api/drivers/application/${formId}/${endpoint}`, {
                method: 'POST',
                body: formData,
            }).then(() => location.reload())
        })
    })
}

export function createGetResizedBlob({ croppers, maxWidth }) {
    return function getResizedBlob(target, { quality = .85 } = {}) {
        return new Promise(resolve => {
            croppers[target]
                .getCroppedCanvas({ width: maxWidth })
                .toBlob(resolve, 'image/jpeg', quality)
        })
    }
}

export function dropzoneEvents({ _id, filenames, filenameProps, croppers }, target, cb = {}) {
    const $cropArea = $(`#croparea-${target}`)
    const $dropZone = $cropArea.find('.cropper-dropzone')
    const $loadShared = $cropArea.find('.cropper-load-shared')
    const $file = $cropArea.find('.cropper-file')
    const $image = $cropArea.find('.cropper-image')
    const $buttons = $cropArea.find('.cropper-buttons')
    const $preview = $(`#cropper-preview-${target}`)
    const width = $preview.data('width') + 'rem'
    const aspectRatio = +$cropArea.data('aspect-ratio') || NaN
    const initialAspectRatio = +$cropArea.data('init-aspect-ratio') || NaN

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

    $file.on('change', function() {
        loadImage(this.files[0])
    })

    $('.confirm-file-toggle').on('change', function() {
        const $check = $(this).parent().parent().parent().prev().find('.confirm-file-check > .check.icon')
        const action = $(this).prop('checked') ? 'show' : 'hide'
        $check[action]()
    })

    function loadImage(file) {
        if (!file || !file.type.startsWith('image/')) return

        let rotation = 0

        window.loadImage(file, function(img) {
            const src = img.toDataURL ? img.toDataURL() : img.src

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
                        initialAspectRatio,
                        viewMode: 1,
                        autoCropArea: 1,
                        responsive: false,
                        checkOrientation: true,
                        crop() { updatePreview() },
                        cropend() { setTimeout(updatePreview, 100) },
                        zoom() { setTimeout(updatePreview, 100) },
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
            rotation -= .5
            croppers[target].rotateTo(rotation)
            setTimeout(updatePreview, 100)
        })

        $editor.rotate.right.on('click', function(evt) {
            evt.preventDefault()
            rotation += .5
            croppers[target].rotateTo(rotation)
            setTimeout(updatePreview, 100)
        })

        $editor.zoom.in.on('click', function(evt) {
            evt.preventDefault()
            croppers[target].zoom(.05)
            setTimeout(updatePreview, 100)
        })

        $editor.zoom.out.on('click', function(evt) {
            evt.preventDefault()
            croppers[target].zoom(-.05)
            setTimeout(updatePreview, 100)
        })

        $editor.reset.on('click', function(evt) {
            evt.preventDefault()
            rotation = 0
            croppers[target].reset()
            setTimeout(updatePreview, 100)
        })

        $editor.replace.on('click', function(evt) {
            evt.preventDefault()
            $file.click()
        })

        if (cb.onImageLoad) cb.onImageLoad()

        function updatePreview() {
            refreshPreview(croppers, target)
        }
    }
}
