import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import pdfParams, { pdfFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'
import Address from '../../../../../client/global/modules/tools/core/address.us.mjs'
import Geography from '../../../../../client/global/modules/tools/core/geography.mjs'


export default async (application, addresses, violations, accidents, employers) => {
    const pdfDoc = await PDFDocument.create()

    const { width, height, marginX, marginY } = pdfParams.letter
    let y = height - marginY, vLineX, vLineXOffsets, text, textWidth
    const fieldHeight = 33, gap = 9, padding = 5.7, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
    }
    const size = {
        section: 9.5,
        label: 8.9,
        value: 11.2,
    }
    const color = {
        line: rgb(0.2, 0.2, 0.2),
        section: rgb(0.1, 0.1, 0.1),
        label: rgb(0.2, 0.2, 0.2),
        value: rgb(0, 0, 0),
    }
    const offset = {
        labelY: 12,
        valueY: 27,
    }

    const drawCheckBox = (page, x, y, checked) => {
        page.drawRectangle({
            x, y, width: 10, height: 10,
            color: rgb(1, 1, 1),
            borderWidth: 1, borderColor: color.line,
        })

        if (checked) {
            page.drawLine({
                start: { x: x + 2, y: y + 5 },
                end: { x: x + 4, y: y + 1.5 },
                color: color.value,
            })
            page.drawLine({
                start: { x: x + 4, y: y + 1.5 },
                end: { x: x + 8, y: y + 8.5 },
                color: color.value,
            })
        }
    }





    /* PAGE 2*/
    const page2 = pdfDoc.addPage([width, height])

    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 2, color: color.line,
    })
    y -= 12
    page2.drawText('Section 1: General Information', {
        x: marginX + padding, y,
        font: font.section, size: size.section, color: color.section,
    })


    y -= gap
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    const { firstName, middleName, lastName, suffix } = application
    if (outsideBorder)
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: marginX, y: y - fieldHeight },
            color: color.line,
        })
    page2.drawText('First Name', {
        x: marginX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(firstName, {
        x: marginX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / 3
    page2.drawText('Middle Name', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(middleName || '', {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX += vLineX
    page2.drawText('Last Name', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(lastName + (suffix ? `, ${suffix}` : ''), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    if (outsideBorder)
        page2.drawLine({
            start: { x: width - marginX, y },
            end: { x: width - marginX, y: y - fieldHeight },
            color: color.line,
        })
    y -= fieldHeight
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    const { dob, gender, ssn, marital, phone } = application
    if (outsideBorder)
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: marginX, y: y - fieldHeight },
            color: color.line,
        })
    page2.drawText('Date of Birth', {
        x: marginX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(moment(dob).format(dateFormat), {
        x: marginX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / 3 * 2 / 4
    page2.drawText('Gender', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(gender[1], {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX += vLineX - 18
    page2.drawText('SSN', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(formatSsn(ssn), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX += vLineX / 1.75
    page2.drawText('Marital Status', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(Person.maritalList[marital], {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX += vLineX / 2.41
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Phone', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(formatTel(phone), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    if (outsideBorder)
        page2.drawLine({
            start: { x: width - marginX, y },
            end: { x: width - marginX, y: y - fieldHeight },
            color: color.line,
        })
    y -= fieldHeight
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    vLineXOffsets = [3.22, 2.25, 1.46, 1.315, 1.177]

    let { address1, address2, city, state, zip, since: addrSince, country } = application.address
    if (outsideBorder)
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: marginX, y: y - fieldHeight },
            color: color.line,
        })
    page2.drawText('Street Address', {
        x: marginX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(address1, {
        x: marginX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[0]
    page2.drawText('Apt/Unit #', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(address2 || '', {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[1]
    page2.drawText('City', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(city, {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[2]
    page2.drawText('State', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(state[0], {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[3]
    page2.drawText('Zip', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(zip, {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[4]
    page2.drawText('Living since', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label, color: color.label,
    })
    page2.drawText(moment(addrSince).format(dateFormat), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value, color: color.value,
    })
    if (outsideBorder)
        page2.drawLine({
            start: { x: width - marginX, y },
            end: { x: width - marginX, y: y - fieldHeight },
            color: color.line,
        })
    y -= fieldHeight
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    y -= fieldHeight / 2
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 2, color: color.line,
    })
    y -= 12
    page2.drawText('Section 2: Prior residence for the past three years', {
        x: marginX + padding, y,
        font: font.section, size: size.section, color: color.section,
    })


    y -= gap
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    for (let i = 0; i < 3; i++) {
        const address = addresses[i]
        let address1, address2, city, state, zip, since
        if (address) ({ address1, address2, city, state, zip, since } = address)

        if (outsideBorder)
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: marginX, y: y - fieldHeight },
                color: color.line,
            })
        page2.drawText('Street Address', {
            x: marginX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(address1 || '', {
            x: marginX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / vLineXOffsets[0]
        page2.drawText('Apt/Unit #', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(address2 || '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / vLineXOffsets[1]
        page2.drawText('City', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(city || '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / vLineXOffsets[2]
        page2.drawText('State', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(state ? state : '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / vLineXOffsets[3]
        page2.drawText('Zip', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(zip || '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / vLineXOffsets[4]
        page2.drawText('Lived since', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(since ? moment(since).format(dateFormat) : '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        if (outsideBorder)
            page2.drawLine({
                start: { x: width - marginX, y },
                end: { x: width - marginX, y: y - fieldHeight },
                color: color.line,
            })

        y -= fieldHeight
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })
    }

    y -= fieldHeight / 1.7
    text = 'Previously lived outside the US'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    drawCheckBox(page2, marginX + padding, y, !!country)
    page2.drawText(text, {
        x: marginX + padding + 15, y: y + 1,
        font: font.label, size: size.label, color: color.label,
    })
    text = 'Country:'
    page2.drawText(text, {
        x: marginX + padding + 15 + textWidth + gap * 1.4, y: y + 1,
        font: font.label, size: size.label, color: color.label,
    })
    textWidth += font.label.widthOfTextAtSize(text, size.label)
    page2.drawText(country ? Geography.countryList[country] : '', {
        x: marginX + padding + 15 + textWidth + gap * 1.4 + padding, y: y + 2,
        font: font.value, size: size.value, color: color.value,
    })
    page2.drawLine({
        start: { x: marginX + padding + 15 + textWidth + 15 + padding / 2, y: y - 1 },
        end: { x: marginX + padding + 15 + textWidth + 15 + padding / 2 + 150, y: y - 1 },
        color: color.line,
    })


    y -= fieldHeight / 2
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 2, color: color.line,
    })
    y -= 12
    page2.drawText('Section 3: Eligibility and Qualification', {
        x: marginX + padding, y,
        font: font.section, size: size.section, color: color.section,
    })


    y -= gap
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    return await pdfDoc.save()
}