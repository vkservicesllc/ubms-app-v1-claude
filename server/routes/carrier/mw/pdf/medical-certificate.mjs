let { DIR__PATH: dir } = Bun.env;
dir += '/uploads/driver/';

import fs from 'fs';
import moment from 'moment';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParams from '../../../../settings/pdf-lib.mjs';
import User from '../../../../tools/core/user.mjs';
import { getFiles } from '../../../../tools/utils/fs.mjs';

export default async (application, session) => {
    if (!application) return;

    const { driverId, id } = application;
    const title = `${application.fullName} - Medical Certificate`;
    const path = `${dir}/${driverId}/medical-certificate/${id}`;

    const files = await getFiles(path, false);
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    pdfDoc.setTitle(title);

    const { marginX, marginY } = pdfParams.letter;
    let { width, height } = pdfParams.letter;
    {
        [height, width] = [width, height];
    }
    const font = {
        title: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        subtitle: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        info: await pdfDoc.embedFont(StandardFonts.Helvetica),
        comment: await pdfDoc.embedFont(StandardFonts.Helvetica),
    };
    const size = {
        title: 15,
        subtitle: 13.2,
        info: 12,
        comment: 9,
    };

    const list = {};
    for (const file of files) {
        const [end, start, number, uploadedBy, init] = file.split('.')[0].split('_');

        const prop = `${end}_${start}`;
        if (!list[prop]) list[prop] = {};
        list[prop].init = init === 'init';
        list[prop].number = number !== '-' ? number : null;
        list[prop].expiresOn = moment(end).format('ll');
        list[prop].issuedOn = start !== '-' ? moment(start).format('ll') : null;
        list[prop].uploadedBy = (await User.fetch(session, { id: +uploadedBy })).fullName();
        list[prop].path = `${path}/${file}`;
    }

    const contentWidth = width - marginX * 2;

    for (const key in list) {
        const item = list[key];
        const page = pdfDoc.addPage([width, height]);
        let y = height - marginY * 1.5;

        let text = `${application.fullName} – ${application.formId}`;
        if (application._carrierId) text += `; ${application.carrier.name}`;
        let textWidth = font.title.widthOfTextAtSize(text, size.title);
        page.drawText(text, {
            x: (width - textWidth) / 2,
            y,
            font: font.title,
            size: size.title,
        });

        y -= 20;
        text = `MEDICAL CERTIFICATE${item.init ? ' *' : ''}`;
        textWidth = font.info.widthOfTextAtSize(text, size.info);
        page.drawText(text, {
            x: (width - textWidth) / 2,
            y,
            font: font.info,
            size: size.info,
        });
        y -= 15;
        text = `Expires on: ${item.expiresOn}; Exam Date: ${item.issuedOn || 'n/a'}; NRCME: ${item.number || 'n/a'}`;
        textWidth = font.info.widthOfTextAtSize(text, size.info);
        page.drawText(text, {
            x: (width - textWidth) / 2,
            y,
            font: font.info,
            size: size.info,
        });

        y -= marginY / 2;

        const imgBytes = fs.readFileSync(item.path);
        const img = await pdfDoc.embedJpg(imgBytes);

        const maxHeight = y - marginY;
        const widthRatio = (contentWidth * 0.9) / img.width;
        const heightRatio = maxHeight / img.height;
        const scale = Math.min(widthRatio, heightRatio, 1);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;

        y -= drawHeight;
        page.drawImage(img, {
            x: (width - drawWidth) / 2,
            y,
            width: drawWidth,
            height: drawHeight,
        });

        // const slots = item.back ? 2 : 1
        // const sectionGap = item.back ? 50 : 0
        // const maxHeight = (y - marginY - sectionGap) / slots

        // y = await drawSide(page, item.front, y, maxHeight)

        // if (item.back) {
        //     y -= marginY / 1.75
        //     y = await drawSide(page, item.back, y, maxHeight)
        // }

        y -= marginY / 2;
        text = `Uploaded by: ${item.uploadedBy}`;
        textWidth = font.comment.widthOfTextAtSize(text, size.comment);
        page.drawText(text, {
            x: (width - textWidth) / 2,
            y,
            font: font.comment,
            size: size.comment,
        });
    }

    return await pdfDoc.save();
};
