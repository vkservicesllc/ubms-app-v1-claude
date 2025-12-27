import { selectEvent } from '/modules/events/form.mjs'
import { dateMask } from '/modules/events/imask.mjs'
import { addr1Event, addr2Event, zipEvent, cityEvent } from '/modules/events/address.mjs'
import { check, onInput, onChange, onSubmit, addressPredictions } from './support.mjs'
import selector from '/modules/registry/selectors/driver-application.mjs'

const TS = selector.id.text, SS = selector.id.select, TR = selector.id.radio
const addr1Id = TS.address1
const addr2Id = TS.address2
const zipId = TS.addrZip
const cityId = TS.addrCity
const stateId = SS.addrState
const addrEnoughId = selector.id.hidden.addrEnough
const addrSinceId = TS.addrSince
const livedAbroadId = TR.livedAbroad1
const countryId = SS.country

const $card = $('#apl-card')
const $help = {
    addrSince: $('#addr-since-help'),
    form: $('#address-form-help'),
}
const $submit = $('#address-submit')
const $form = $('#address-form')


let timer

addr1Event(addr1Id, {
    addr2Id,
    onInput(addr1, $addr1) {'onInput', console.log({ addr1 })
        clearTimeout(timer)
        timer = setTimeout(() => addressPredictions($addr1, addr1), 500)
        onInput(addr1, $addr1)
    },
    onChange(addr1, $addr1, addr2, $addr2) {
        onChange(addr1, $addr1)
        onChange(addr2, $addr2)
    },
})

addr2Event(addr2Id, { onInput, onChange })

zipEvent(zipId, {
    cityId,
    stateId,
    onInput,
    onChange(zip, $zip, city, state, $city, $state) {
        onChange(zip, $zip)
        onChange(city, $city)
        onChange(state, $state)
    },
})

cityEvent(cityId, { onInput, onChange })

selectEvent(stateId, { onChange })

dateMask(addrSinceId, {
    pattern: 'us',
    onAccept(mask, $since) {
        $help.addrSince.text(null)
        $since.removeClass('is-valid is-invalid')
    },
    onComplete(mask, $since) {
        let since = mask.value

        if (since) {
            since = moment(since, 'MM/DD/YYYY', true)

            if (!since.isValid()) {
                $since.addClass('is-invalid')
                $help.addrSince.text('* Invalid date')
            } else {
                const today = moment()

                if (since.isAfter(today)) {
                    $since.addClass('is-invalid')
                    $help.addrSince.text('* Future date forbidden')
                } else {
                    const limit = moment($(selector.id.hidden.appliedOn).val()).clone().subtract(3, 'years')
                    const $prior = $('#prior-residence')
                    const $enough = $(addrEnoughId)

                    if (since.isBefore(limit)) {
                        $enough.val('1')
                        $prior.hide().find('input, select').prop('disabled', true)
                        $since.addClass('is-valid')
                    } else {
                        $enough.val('0')
                        const livedAbroad = {}, props = ['yes', 'no']
                        let minDate

                        props.forEach(prop => livedAbroad[prop] = $(livedAbroadId[prop]).prop('checked'))
                        $(selector.class.radio.livedAbroad).prop('disabled', false)

                        $prior.show()

                        if (livedAbroad.yes) $(countryId).prop('disabled', false)
                        if (livedAbroad.no) {
                            $('#address-list').find('.address-form').each(function(i) {
                                $(this).find('input:not([type="radio"]), select').prop('disabled', false)
                                const $livedAbroad = {
                                    yes: $(this).find(TR.livedAbroad2.yes + `-${i}`),
                                }
                                const $container = $livedAbroad.yes.parent().parent().parent()
                                const visible = $container.is(':visible')

                                if (visible) {
                                    $livedAbroad.no = $(this).find(TR.livedAbroad2.no + `-${i}`)
                                    props.forEach(prop => $livedAbroad[prop].prop('disabled', false))

                                    if ($livedAbroad.yes.prop('checked'))
                                        $(countryId).prop('disabled', false)
                                }

                                if (!i) minDate = $(this).find(selector.class.text.prevAddrSince).val()
                            })
                        }

                        if (minDate) {
                            minDate = moment(minDate, 'MM/DD/YYYY', true)

                            if (since.isSameOrBefore(minDate)) {
                                let msg = '* Date overlap'
                                msg += `<br/>Date expected<br/>after ${moment(minDate).format('ll')}`

                                $since.addClass('is-invalid')
                                $help.addrSince.html(msg)
                            } else $since.addClass('is-valid')
                        } else $since.addClass('is-valid')
                    }
                }
            }
        }

        if (check($form)) $help.form.hide().html(null)
    },
})


onSubmit($form, $help, $submit, $card)