const { DIR__PATH: dir } = Bun.env;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import { PDFDocument } from 'pdf-lib';

const fillPdf = async (
    file,
    data = {},
    options = {
        title: null,
        dateFormat: 'MM/DD/YYYY',
        saveTo: null,
    },
) => {
    const { title, dateFormat, saveTo } = options;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatePath = path.join(__dirname, '../../templates/');

    const fileBytes = fs.readFileSync(templatePath + file + '.pdf');
    const pdfDoc = await PDFDocument.load(fileBytes);
    if (title) pdfDoc.setTitle(title);
    const form = pdfDoc.getForm();

    for (const prop in data) {
        let value = data[prop];

        if (Array.isArray(value)) {
            const [raw, instr] = value;

            switch (instr) {
                case 'date':
                    value = moment(raw).format(dateFormat);
                    break;
                default:
                    value = raw;
            }
        }

        value = value == null ? '' : String(value);

        try {
            form.getTextField(prop).setText(value);
        } catch (err) {
            console.warn(`Skipping field (not text or missing): ${prop}`);
        }
    }

    form.flatten();

    const pdfBytes = await pdfDoc.save();

    if (saveTo) fs.writeFileSync(dir + saveTo + '.pdf', pdfBytes);
    return pdfBytes;
};

export default fillPdf;
