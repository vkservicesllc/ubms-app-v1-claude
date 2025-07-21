import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import pdfParams, { pdfFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'


export default async (application, addresses, violations, accidents, employers) => {
    const pdfDoc = await PDFDocument.create()
    for (const f in pdfFonts)
        pdfFonts[f] = await pdfDoc.embedFont(StandardFonts[pdfFonts[f]])

    const { width, height, marginX, marginY } = pdfParams.letter
    let y = height - marginY, vLineX, vLineXOffsets
    const fieldHeight = 33, gap = 9, padding = 5.7
    const font = {
        label: pdfFonts.helvetica,
        value: pdfFonts.helvetica,
    }
    const size = {
        section: 10,
        label: 8.9,
        value: 11.2,
    }
    const color = {
        line: rgb(0.5, 0.5, 0.5)
    }
    const offset = {
        labelY: 12,
        valueY: 27,
    }





    /* PAGE 2*/
    const page2 = pdfDoc.addPage([width, height])

    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 2,
    })
    y -= 12
    page2.drawText('Section 1: General Information', {
        x: marginX + padding, y,
        font: pdfFonts.helveticaB, size: size.section,
    })


    y -= gap
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    const { firstName, middleName, lastName, suffix } = application
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('First Name', {
        x: marginX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(firstName, {
        x: marginX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / 3
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Middle Name', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(middleName || '', {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX += vLineX
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Last Name', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(lastName + (suffix ? `, ${suffix}` : ''), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
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
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Date of Birth', {
        x: marginX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(moment(dob).format('MM/DD/YYYY'), {
        x: marginX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / 3 * 2 / 4
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Gender', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(gender[1], {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX += vLineX - 18
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('SSN', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(formatSsn(ssn), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX += vLineX / 1.75
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Marital Status', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(Person.maritalList[marital], {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX += vLineX / 2.41
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Phone', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(formatTel(phone), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
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

    let { address1, address2, city, state, zip, since: addrSince } = application.address
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Street Address', {
        x: marginX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(address1, {
        x: marginX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[0]
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Apt/Unit #', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(address2 || '', {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[1]
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('City', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(city, {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[2]
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('State', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(state[0], {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[3]
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Zip', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(zip, {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / vLineXOffsets[4]
    // page2.drawLine({
    //     start: { x: vLineX + marginX, y },
    //     end: { x: vLineX + marginX, y: y - fieldHeight },
    //     color: color.line,
    // })
    page2.drawText('Living since', {
        x: marginX + vLineX + padding, y: y - offset.labelY,
        font: font.label, size: size.label,
    })
    page2.drawText(moment(addrSince).format('MM/DD/YYYY'), {
        x: marginX + vLineX + padding, y: y - offset.valueY,
        font: font.value, size: size.value,
    })
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


    y -= fieldHeight/2
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 2,
    })
    y -= 12
    page2.drawText('Section 2: Prior residence for the past three years', {
        x: marginX + padding, y,
        font: pdfFonts.helveticaB, size: size.section,
    })


    y -= gap
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


    console.log(addresses)



    return await pdfDoc.save()
}