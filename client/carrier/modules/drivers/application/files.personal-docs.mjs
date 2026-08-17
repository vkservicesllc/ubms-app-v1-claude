import { inputEvent } from '/modules/events/form.mjs'
import { driverLicenseEvent, dlClassEvent } from '/modules/events/person.mjs'
import { nameEvent, ssnEvent } from '/modules/events/person.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import calSettings from '/modules/settings/calendar.mjs'
import application, { addresses, dropdownEvent } from './hub.mjs'
import stripNum from '/modules/tools/utils/formatter.mjs'
import selector from '/modules/registry/selectors/driver-application-files.mjs'
import filenames from '/modules/registry/filenames/driver-application-uploads.mjs'


(() => {
    if (!application || !Object.keys(application).length) return

    const { _id, formId, cdlRole, dl, mec, legalStatus, ssn, finishedAt } = application
    const TS = selector.id.text, RS = selector.id.radio, CS = selector.id.checkbox
    const $commercial = $(selector.class.radio.dlCommercial)
    const legalDoc = !!legalStatus[0]

    const filenameProps = {
        'dl-front': 'dlF',
        'dl-back': 'dlB',
        'dl2-front': 'dlF',
        'dl2-back': 'dlB',
        'mec': 'mec',
        //! add more
        'ssc': 'ssc',
    }
    const uploadMaxWidth = 1200
    const croppers = {}
    const $upload = {
        dl: $('#upload-dl-file'),
        dl2: $('#upload-add-dl-file'),
        mec: $('#upload-mec-file'),
        ssc: $('#upload-ssc-file'),
    }

    const $modal = {
        upload: {
            dl: $('#upload-dl-modal'),
            dl2: $('#upload-add-dl-modal'),
            mec: $('#upload-mec-modal'),
            ssc: $('#upload-ssc-modal'),
        },
        delete: $('#delete-files-modal'),
    }
    const $button = {
        upload: {
            dl: {
                prev: $('#upload-dl-prev-button'),
                next: $('#upload-dl-next-button'),
                submit: $('#upload-dl-submit'),
            },
            dl2: {
                prev: $('#upload-add-dl-prev-button'),
                skip: $('#upload-add-dl-skip-button'),
                next: $('#upload-add-dl-next-button'),
                submit: $('#upload-add-dl-submit'),
            },
            mec: {
                prev: $('#upload-mec-prev-button'),
                next: $('#upload-mec-next-button'),
                submit: $('#upload-mec-submit'),
            },
            ssc: {
                prev: $('#upload-ssc-prev-button'),
                ignore: $('#skip-ssc-submit'),
                next: $('#upload-ssc-next-button'),
                submit: $('#upload-ssc-submit'),
            },
        },
    }
    const $a = {
        delete: $('.delete-files'),
    }
    const $step = {
        upload: {
            dl: $('#upload-dl-step'),
            dl2: $('#upload-add-dl-step'),
            mec: $('#upload-mec-step'),
            ssc: $('#upload-ssc-step'),
        },
    }
    const steps = {
        upload: {
            dl: [
                "Editor: Driver's License <small>(Front)</small>",
                "Editor: Driver's License <small>(Back)</small>",
                'Data Verification and Confirmation',
            ],
            dl2: [
                "Editor: Driver's License <small>(Front)</small>",
                "Editor: Driver's License <small>(Back) — <i>Optional</i></small>",
                'Data Registration and Confirmation',
            ],
            mec: [
                "Editor: Medical Certificate",
                'Data Verification and Confirmation',
            ],
            ssc: [
                "Editor: Social Security Card",
                'Data Verification and Confirmation',
            ],
        },
    }
    const activeStep = {
        dl: 0,
        dl2: 0,
        mec: 0,
        ssc: 0,
    }

    const $section = {
        upload: {
            dl: {
                all: $('.dl-section'),
                cropperFront: $('#croparea-dl-front'),
                cropperBack: $('#croparea-dl-back'),
                confirmation: $('#confirmation-dl'),
            },
            dl2: {
                all: $('.dl2-section'),
                cropperFront: $('#croparea-dl2-front'),
                cropperBack: $('#croparea-dl2-back'),
                confirmation: $('#confirmation-add-dl'),
            },
            mec: {
                all: $('.mec-section'),
                cropper: $('#croparea-mec'),
                confirmation: $('#confirmation-mec'),
            },
            ssc: {
                all: $('.ssc-section'),
                cropper: $('#croparea-ssc'),
                confirmation: $('#confirmation-ssc'),
            },
        },
    }

    const $dropdown = {
        dlState: [ $('#dl-state-confirm-dropdown'), dl.state ],
        dlState2: [ $('#dl-state-2-confirm-dropdown') ],
        dlSuffix: [ $('#dl-suffix-confirm-dropdown'), application.suffix ],
        dlGender: [ $('#dl-gender-confirm-dropdown'), application.gender ],
        dlAddrState: [ $('#dl-addr-state-confirm-dropdown') ],
        dlChooseAddr: [ $('#dl-choose-addr-confirm-dropdown'), null, function(value) {
            let since = null, address1 = null, address2 = null, zip = null, city = null, state = null

            if (value === application.address.since) {
                ({ since, address1, address2, zip, city, state } = application.address)
            } else
                for (const address of addresses) {
                    if (value === address.since) {
                        ({ since, address1, address2, zip, city, state } = address)
                        break
                    }
                }

            $(selector.id.hidden.dlAddrSince).val(since)
            $(selector.id.text.dlAddress1).val(address1)
            $(selector.id.text.dlAddress2).val(address2)
            $(selector.id.text.dlAddrZip).val(zip)
            $(selector.id.text.dlAddrCity).val(city)

            const $stateDropdown = $('#dl-addr-state-confirm-dropdown')
            if (state) $stateDropdown.dropdown('set selected', state)
            else $stateDropdown.dropdown('clear')
            $('#dl-addr-confirm-table').show()
        } ],
    }
    const $calendar = {
        dlIssuedOn: $('#dl-issued-confirm-calendar'),
        dlExpiresOn: $('#dl-expires-confirm-calendar'),
        dlIssuedOn2: $('#dl-issued-2-confirm-calendar'),
        dlExpiresOn2: $('#dl-expires-2-confirm-calendar'),
        dlDob: $('#dl-dob-confirm-calendar'),
        mecExpiresOn: $('#mec-expires-confirm-calendar'),
        mecIssuedOn: $('#mec-issued-confirm-calendar'),
    }

    if (legalDoc) {
        $upload.leg = $('#upload-leg-file')
        $modal.upload.leg = $('#upload-leg-modal')
        $button.upload.leg = {
            prev: $('#upload-leg-prev-button'),
            ignore: legalStatus[0] === 1 ? $('#skip-leg-submit') : null,
            skip: $('#upload-leg-skip-button'),
            next: $('#upload-leg-next-button'),
            submit: $('#upload-leg-submit'),
        }
        $step.upload.leg = $('#upload-leg-step')
        steps.upload.leg = [
            "Editor: Legal Document <small>(Front)</small>",
            "Editor: Legal Document <small>(Back) — <i>Optional</i></small>",
            'Data Registration and Confirmation',
        ]
        activeStep.leg = 0
        $section.upload.leg = {
            all: $('.leg-section'),
            cropperFront: $('#croparea-leg-front'),
            cropperBack: $('#croparea-leg-back'),
            confirmation: $('#confirmation-leg'),
        }
        $calendar.legExpiresOn = $('#leg-expires-confirm-calendar')
        $calendar.legIssuedOn = $('#leg-issued-confirm-calendar')
    }

    $('.file-form-confirm-check').on('change', function() {
        const $div = $(this).parent()
        $div.fadeOut(250)
        setTimeout(() => {
            $div.next().fadeIn(250)
            $div.parent().parent().addClass('positive')
        }, 250)
    })

    $('.file-form-confirm-dl-check').on('change', function() {
        const $checks = $('.file-form-confirm-dl-check')
        const allChecked = $checks.length === $checks.filter(':checked').length
        $button.upload.dl.submit.prop('disabled', !allChecked)
    })
    $('#file-form-confirm-dl-addr-check').on('change', function() {
        $('.dl-addr-verifying-txt').remove()
        $dropdown.dlChooseAddr[0].addClass('disabled')
    })

    $('.file-form-confirm-mec-check').on('change', function() {
        const $checks = $('.file-form-confirm-mec-check')
        const allChecked = $checks.length === $checks.filter(':checked').length
        $button.upload.mec.submit.prop('disabled', !allChecked)
    })

    $('.file-form-confirm-ssc-check').on('change', function() {
        const $checks = $('.file-form-confirm-ssc-check')
        const allChecked = $checks.length === $checks.filter(':checked').length
        $button.upload.ssc.submit.prop('disabled', !allChecked)
    })

    if (legalDoc)
        $('.file-form-confirm-leg-check').on('change', function() {
            const $checks = $('.file-form-confirm-leg-check')
            const allChecked = $checks.length === $checks.filter(':checked').length
            $button.upload.leg.submit.prop('disabled', !allChecked)
        })

    dropdownEvent($dropdown)

    $modal.delete.modal({
        closable: false,
        onHidden() {
            $('#delete-files-target').val(null)
            $('.delete-files-target').text(null)
        }
    })
    $a.delete.on('click', function(evt) {
        evt.preventDefault()

        const target = $(this).data('target')
        $('#delete-files-target').val(target)
        $('.delete-files-target').text({
            dl: "Driver's License",
            mec: 'Medical Certificate',
            leg: 'Legal Document',
            ssc: 'Social Security Card',
        }[target])

        $modal.delete.modal('show')
    })

    $(RS.dlCommercial[dl.commercial ? 'yes' : 'no']).prop('checked', true)
    if (cdlRole) $commercial.prop('disabled', true)
    $(TS.dlEndrs).prop('disabled', !dl.commercial)

    $commercial.on('change', function() {
        const value = $(this).val()
        $(TS.dlEndrs).prop('disabled', value === 'N')
    })

    driverLicenseEvent(TS.dlNumber, { value: dl.number })
    driverLicenseEvent(TS.dlNumber2)
    
    dlClassEvent(TS.dlClass, { value: dl.class })

    $calendar.dlIssuedOn
        .calendar({
            ...calSettings,
            maxDate: moment(finishedAt).toDate(),
        })
        .calendar('set date', new Date(moment(dl.issuedOn).toDate()))
    $calendar.dlIssuedOn2
        .calendar({
            ...calSettings,
            maxDate: moment(finishedAt).toDate(),
        })

    $calendar.dlExpiresOn
        .calendar({
            ...calSettings,
            minDate: moment(finishedAt).add(1, 'days').toDate(),
        })
        .calendar('set date', new Date(moment(dl.expiresOn).toDate()))
    $calendar.dlExpiresOn2
        .calendar({
            ...calSettings,
            minDate: moment(finishedAt).add(1, 'days').toDate(),
        })

    inputEvent(TS.dlEndrs, { strip: true, capitalize: 'first', value: dl.endorsement })
    inputEvent(TS.dlRestr, { strip: true, capitalize: 'first', value: dl.restriction })

    nameEvent(TS.dlFirstName, { value: application.firstName })
    nameEvent(TS.dlMiddleName, { value: application.middleName })
    nameEvent(TS.dlLastName, {
        sfxId: true,
        value: application.lastName,
        onChange(lastName, $lastName, suffix) {
            if (suffix)
                $dropdown.dlSuffix[0].dropdown('set selected', suffix)
        },
    })

    $calendar.dlDob
        .calendar({
            ...calSettings,
            maxDate: moment(finishedAt).subtract(18, 'years').toDate(),
        })
        .calendar('set date', new Date(moment(application.dob).toDate()))

    addr1Event(TS.dlAddress1, { addr2Id: TS.dlAddress2 })
    addr2Event(TS.dlAddress2)
    zipEvent(TS.dlAddrZip, {
        cityId: TS.dlAddrCity,
        onChange(zip, $zip, city, state) {
            if (state) $dropdown.dlAddrState[0].dropdown('set selected', state)
        },
    })
    cityEvent(TS.dlAddrCity)

    $calendar.mecExpiresOn
        .calendar({
            ...calSettings,
            minDate: moment(finishedAt).add(1, 'days').toDate(),
        })
    if (mec?.expiresOn)
        $calendar.mecExpiresOn.calendar('set date', new Date(moment(mec.expiresOn).toDate()))

    $calendar.mecIssuedOn
        .calendar({
            ...calSettings,
            maxDate: moment(finishedAt).add(1, 'days').toDate(),
        })
    if (mec?.issuedOn)
        $calendar.mecIssuedOn.calendar('set date', new Date(moment(mec.issuedOn).toDate()))

    inputEvent(TS.mecNumber, {
        value: mec?.nrcme,
        onInput(number, $number) {
            number = number.replace(/\D/, '')
            $number.val(number)
        },
    })

    ssnEvent(TS.ssn, { value: ssn })

    if (legalDoc) {

        $calendar.legExpiresOn
            .calendar({
                ...calSettings,
                minDate: moment(finishedAt).add(1, 'months').toDate(),
            })
        if (legalStatus[1])
            $calendar.legExpiresOn.calendar('set date', new Date(moment(legalStatus[1]).toDate()))

        $calendar.legIssuedOn
            .calendar({
                ...calSettings,
                maxDate: moment(finishedAt).toDate(),
            })
        if (legalStatus[2])
            $calendar.legIssuedOn.calendar('set date', new Date(moment(legalStatus[2]).toDate()))

        driverLicenseEvent(TS.statusDoc, { value: legalStatus[3] || null })
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

    $upload.dl2.click(function(evt) {
        evt.preventDefault()
        $modal.upload.dl2.modal({
            autofocus: false,
            closable: false,
            onVisible() {
                setTimeout(() => {
                    croppers?.['dl2-front']?.resize()
                    croppers?.['dl2-back']?.resize()
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

    $upload.ssc.click(function() {
        $modal.upload.ssc.modal({
            autofocus: false,
            closable: false,
            onVisible() {
                setTimeout(() => {
                    croppers?.['ssc']?.resize()
                    croppers?.['ssc']?.resize()
                }, 250)
            },
        }).modal('show')
    })

    if (legalDoc)
        $upload.leg.click(function() {
            $modal.upload.leg.modal({
                autofocus: false,
                closable: false,
                onVisible() {
                    setTimeout(() => {
                        croppers?.['leg-front']?.resize()
                        croppers?.['leg-back']?.resize()
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

    dropzoneEvents('dl2-front', {
        onImageLoad() {
            $button.upload.dl2.next.prop('disabled', false)
            $step.upload.dl2.html(steps.upload.dl2[0])
        },
    })
    dropzoneEvents('dl2-back', {
        onImageLoad() {
            $button.upload.dl2.next.prop('disabled', false)
        },
    })

    dropzoneEvents('mec', {
        onImageLoad() {
            $button.upload.mec.next.prop('disabled', false)
        },
    })

    dropzoneEvents('ssc', {
        onImageLoad() {
            $button.upload.ssc.next.prop('disabled', false)
        },
    })

    if (legalDoc) {
        dropzoneEvents('leg-front', {
            onImageLoad() {
                $button.upload.leg.next.prop('disabled', false)
                $step.upload.leg.html(steps.upload.leg[0])
            },
        })
        dropzoneEvents('leg-back', {
            onImageLoad() {
                $button.upload.leg.next.prop('disabled', false)
            },
        })
    }

    $button.upload.dl.next.click(function() {
        $section.upload.dl.all.hide()
        if (activeStep.dl === 0) {
            $button.upload.dl.prev.show()
            if (!croppers['dl-back']) $button.upload.dl.next.prop('disabled', true)
            $section.upload.dl.cropperBack.show()
            croppers['dl-back']?.resize()
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
            croppers['dl-front']?.resize()
            $button.upload.dl.next.prop('disabled', false)
        }
        if (activeStep.dl === 2) {
            $button.upload.dl.submit.hide()
            $button.upload.dl.next.show()
            $section.upload.dl.cropperBack.show()
            croppers['dl-back']?.resize()
        }
        $step.upload.dl.html(steps.upload.dl[--activeStep.dl])
    })

    $('#upload-dl-form').on('submit', function(evt) {
        evt.preventDefault()
        if (!$dropdown.dlAddrState[0].dropdown('get value')) return alert('Address State is not selected')

        const form = this

        Promise.all([
            getResizedBlob('dl-front'),
            getResizedBlob('dl-back'),
        ]).then(([ dlF, dlB ]) => {
            const formData = new FormData(form)
            formData.set('dlF', dlF, 'dlF.jpg')
            formData.set('dlB', dlB, 'dlB.jpg')

            const dateFields = [ 'dl[issuedOn]', 'dl[expiresOn]', 'person[dob]' ]
            for (const [ key, value ] of formData.entries())
                if (dateFields.includes(key)) formData.set(key, moment(value, 'MMM D, YYYY').format('YYYY-MM-DD'))

            fetch(`/upload/api/drivers/application/${formId}/initial-drivers-license`, { method: 'POST', body: formData })
                // .then(res => res.json())
                .then(data => {
                    location.reload()
                })
        })
    })

    $button.upload.dl2.next.click(function() {
        $section.upload.dl2.all.hide()
        if (activeStep.dl2 === 0) {
            $button.upload.dl2.prev.show()
            if (!croppers['dl2-back']) $button.upload.dl2.next.prop('disabled', true)
            $section.upload.dl2.cropperBack.show()
            croppers['dl2-back']?.resize()
            $button.upload.dl2.skip.show()
        }
        if (activeStep.dl2 === 1) {
            $button.upload.dl2.next.hide()
            $button.upload.dl2.submit.show()
            $button.upload.dl2.skip.hide()
            $section.upload.dl2.confirmation.show()
        }
        $step.upload.dl2.html(steps.upload.dl2[++activeStep.dl2])
    })

    $button.upload.dl2.prev.click(function() {
        $section.upload.dl2.all.hide()
        if (activeStep.dl2 === 1) {
            $button.upload.dl2.prev.hide()
            $section.upload.dl2.cropperFront.show()
            croppers['dl2-front']?.resize()
            $button.upload.dl2.next.prop('disabled', false)
            $button.upload.dl2.skip.hide()
        }
        if (activeStep.dl2 === 2) {
            $button.upload.dl2.submit.hide()
            $button.upload.dl2.next.show()
            $section.upload.dl2.cropperBack.show()
            croppers['dl2-back']?.resize()
            $button.upload.dl2.skip.show()
        }
        $step.upload.dl2.html(steps.upload.dl2[--activeStep.dl2])
    })

    $button.upload.dl2.skip.click(function() {
        $section.upload.dl2.all.hide()
        $button.upload.dl2.next.hide()
        $button.upload.dl2.submit.show()
        $section.upload.dl2.confirmation.show()
        $(this).hide()
        $step.upload.dl2.html(steps.upload.dl2[++activeStep.dl2])
    })

    $('#upload-add-dl-form').on('submit', function(evt) {
        evt.preventDefault()
        if (!$dropdown.dlState2[0].dropdown('get value')) return alert('State is not selected')

        const form = this

        const blobs = [ getResizedBlob('dl2-front') ]
        if (croppers['dl2-back']) blobs.push(getResizedBlob('dl2-back'))

        Promise.all(blobs).then(([ dlF, dlB ]) => {
            const formData = new FormData(form)
            formData.set('dlF', dlF, 'dlF.jpg')
            if (dlB) formData.set('dlB', dlB, 'dlB.jpg')
            else formData.delete('dlB')

            const dateFields = [ 'issuedOn', 'expiresOn' ]
            for (const [ key, value ] of formData.entries())
                if (dateFields.includes(key)) formData.set(key, moment(value, 'MMM D, YYYY').format('YYYY-MM-DD'))

            fetch(`/upload/api/drivers/application/${formId}/drivers-license?record=false`, { method: 'POST', body: formData })
                // .then(res => res.json())
                .then(data => {
                    location.reload()
                })
        })
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
            croppers['mec']?.resize()
        }
        $step.upload.mec.html(steps.upload.mec[--activeStep.mec])
    })

    $('#upload-mec-form').on('submit', function(evt) {
        evt.preventDefault()

        const form = this

        const blobs = [ getResizedBlob('mec') ]

        Promise.all(blobs).then(([ mec ]) => {
            const formData = new FormData(form)
            formData.set('mec', mec, 'mec.jpg')

            const dateFields = [ 'expiresOn', 'issuedOn' ]
            for (const [ key, value ] of formData.entries())
                if (dateFields.includes(key) && value) formData.set(key, moment(value, 'MMM D, YYYY').format('YYYY-MM-DD'))

            fetch(`/upload/api/drivers/application/${formId}/initial-medical-certificate`, { method: 'POST', body: formData })
                // .then(res => res.json())
                .then(data => {
                    location.reload()
                })
        })
    })

    $button.upload.ssc.next.click(function() {
        $section.upload.ssc.all.hide()
        if (activeStep.ssc === 0) {
            $button.upload.ssc.next.hide()
            $button.upload.ssc.ignore.hide()
            $button.upload.ssc.prev.show()
            $button.upload.ssc.submit.show()
            $section.upload.ssc.confirmation.show()
        }
        $step.upload.ssc.html(steps.upload.ssc[++activeStep.ssc])
    })

    $button.upload.ssc.prev.click(function() {
        $section.upload.ssc.all.hide()
        if (activeStep.ssc === 1) {
            $button.upload.ssc.prev.hide()
            $button.upload.ssc.submit.hide()
            $button.upload.ssc.next.show()
            $button.upload.ssc.ignore.show()
            $section.upload.ssc.cropper.show()
            croppers['ssc']?.resize()
        }
        $step.upload.ssc.html(steps.upload.ssc[--activeStep.ssc])
    })

    $('#upload-ssc-form').on('submit', function(evt) {
        evt.preventDefault()

        const form = this

        const blobs = [ getResizedBlob('ssc') ]

        Promise.all(blobs).then(([ mec ]) => {
            const formData = new FormData(form)
            formData.set('ssc', mec, 'ssc.jpg')
            formData.set('ssn', stripNum(formData.get('ssn')))
            formData.set('dhsReq', formData.has('dhsReq'))

            fetch(`/upload/api/drivers/application/${formId}/initial-social-security-card`, { method: 'POST', body: formData })
                // .then(res => res.json())
                .then(data => {
                    location.reload()
                })
        })
    })

    if (legalDoc) {

        $button.upload.leg.next.click(function() {
            $section.upload.leg.all.hide()
            if (activeStep.leg === 0) {
                $button.upload.leg.prev.show()
                if (!croppers['leg-back']) $button.upload.leg.next.prop('disabled', true)
                $section.upload.leg.cropperBack.show()
                croppers['leg-back']?.resize()
                $button.upload.leg.skip.show()
                if ($button.upload.leg.ignore) $button.upload.leg.ignore.hide()
            }
            if (activeStep.leg === 1) {
                $button.upload.leg.next.hide()
                $button.upload.leg.submit.show()
                $button.upload.leg.skip.hide()
                $section.upload.leg.confirmation.show()
            }
            $step.upload.leg.html(steps.upload.leg[++activeStep.leg])
        })

        $button.upload.leg.prev.click(function() {
            $section.upload.leg.all.hide()
            if (activeStep.leg === 1) {
                $button.upload.leg.prev.hide()
                $section.upload.leg.cropperFront.show()
                croppers['leg-front']?.resize()
                $button.upload.leg.next.prop('disabled', false)
                $button.upload.leg.skip.hide()
                if ($button.upload.leg.ignore) $button.upload.leg.ignore.show()
            }
            if (activeStep.leg === 2) {
                $button.upload.leg.submit.hide()
                $button.upload.leg.next.show()
                $section.upload.leg.cropperBack.show()
                croppers['leg-back']?.resize()
                $button.upload.leg.skip.show()
            }
            $step.upload.leg.html(steps.upload.leg[--activeStep.leg])
        })

        $button.upload.leg.skip.click(function() {
            $section.upload.leg.all.hide()
            $button.upload.leg.next.hide()
            $button.upload.leg.submit.show()
            $section.upload.leg.confirmation.show()
            $(this).hide()
            $step.upload.leg.html(steps.upload.leg[++activeStep.leg])
        })

        $('#upload-leg-form').on('submit', function(evt) {
            evt.preventDefault()

            const form = this

            const blobs = [ getResizedBlob('leg-front') ]
            if (croppers['leg-back']) blobs.push(getResizedBlob('leg-back'))

            Promise.all(blobs).then(([ legF, legB ]) => {
                const formData = new FormData(form)
                formData.set('legF', legF, 'legF.jpg')
                if (legB) formData.set('legB', legB, 'legB.jpg')
                else formData.delete('legB')

                const dateFields = [ 'expiresOn', 'issuedOn' ]
                for (const [ key, value ] of formData.entries())
                    if (value && dateFields.includes(key)) formData.set(key, moment(value, 'MMM D, YYYY').format('YYYY-MM-DD'))

                fetch(`/upload/api/drivers/application/${formId}/initial-legal-document`, { method: 'POST', body: formData })
                    // .then(res => res.json())
                    .then(data => {
                        location.reload()
                    })
            })
        })

    }


    function getResizedBlob(target, { quality = .85 } = {}) {
        return new Promise(resolve => {
            croppers[target]
                .getCroppedCanvas({ width: uploadMaxWidth })
                .toBlob(resolve, 'image/jpeg', quality)
        })
    }

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

            function resizeWorkZone() { //? SOME ISSUES PERSIST //* May be not
                //! $image.css()
                $preview.css({ width, height: '100%', overflow: 'hidden' })
                    .find('img').css({ width: 'inherit', height: 'inherit' })
            }
        }
    }
})()