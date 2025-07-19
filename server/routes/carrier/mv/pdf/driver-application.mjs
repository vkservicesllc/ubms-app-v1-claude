import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import pdfParams, { pdfFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel } from '../../../../../client/global/modules/tools/utils/formatter.mjs'


export default async application => {
    const pdfDoc = await PDFDocument.create()
    for (const f in pdfFonts)
        pdfFonts[f] = await pdfDoc.embedFont(StandardFonts[pdfFonts[f]])

    const { width, height, marginX, marginY } = pdfParams.letter
    let y = height - marginY, vLineX, text = ''
    const fieldHeight = 33
    const font = {
        label: pdfFonts.helvetica,
        value: pdfFonts.helvetica,
    }
    const size = {
        label: 9,
        value: 11,
    }
    const color = {
        line: rgb(0.5, 0.5, 0.5)
    }





    /* PAGE 2*/
    const page2 = pdfDoc.addPage([width, height])

    page2.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 2,
    })
    y -= 12
    page2.drawText('Section 1: Applicant Information and Verification', {
        x: marginX + 5, y,
        font: pdfFonts.helveticaB, size: 10,
    })


    y -= 12
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
        x: marginX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(firstName, {
        x: marginX + 5, y: y - 27,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / 3
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Middle Name', {
        x: marginX + vLineX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(middleName || '', {
        x: marginX + vLineX + 5, y: y - 27,
        font: font.value, size: size.value,
    })
    vLineX += vLineX
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Last Name', {
        x: marginX + vLineX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(lastName + (suffix ? `, ${suffix}` : ''), {
        x: marginX + vLineX + 5, y: y - 27,
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


    const { dob, gender, ssn, phone } = application
    page2.drawLine({
        start: { x: marginX, y },
        end: { x: marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Date of Birth', {
        x: marginX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(moment(dob).format('MM/DD/YYYY'), {
        x: marginX + 5, y: y - 27,
        font: font.value, size: size.value,
    })
    vLineX = (width - marginX * 2) / 3 * 2 / 3
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Gender', {
        x: marginX + vLineX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(gender[1], {
        x: marginX + vLineX + 5, y: y - 27,
        font: font.value, size: size.value,
    })
    vLineX += vLineX
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('SSN', {
        x: marginX + vLineX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(formatSsn(ssn), {
        x: marginX + vLineX + 5, y: y - 27,
        font: font.value, size: size.value,
    })
    vLineX += vLineX / 2
    page2.drawLine({
        start: { x: vLineX + marginX, y },
        end: { x: vLineX + marginX, y: y - fieldHeight },
        color: color.line,
    })
    page2.drawText('Phone', {
        x: marginX + vLineX + 5, y: y - 12,
        font: font.label, size: size.label,
    })
    page2.drawText(formatTel(phone), {
        x: marginX + vLineX + 5, y: y - 27,
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


    return await pdfDoc.save()
}