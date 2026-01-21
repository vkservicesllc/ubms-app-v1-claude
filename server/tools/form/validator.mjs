import { validationResult } from 'express-validator'


export default (req, res, next) => {
    const validationFails = validationResult(req)
    let { errors } = validationFails

    if (!validationFails.isEmpty()) {
        const referer = req.headers.referer || req.headers.referrer

        let errorList = '<pre>Validation Errors:<ol>'
        errors.forEach(error => {
            errorList += `<li>{ ${error.path}: "${error.value}" } ${error.msg}</li>`
        })
        errorList += '</ol></pre>'

        // errorList += '<pre><ul>'
        // for (const field in req.body) {
        //     const value = req.body[field]

        //     errorList += `<li>${field}: ${value}</li>`
        // }
        // errorList += '</ul></pre>'

        errorList += `<p><a href="${referer}">Return to Application</a></p>`

        return res.status(400).send(errorList)
    }

    next()
}


export const validate = (Form, rule, target, options = {}) => {
    const validator = []
    const fields = rule(target, options)

    fields.map(prop => validator.push(Form[prop].validate()))

    return validator
}