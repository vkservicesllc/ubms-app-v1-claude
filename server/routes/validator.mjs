const validate = (Form, rule, target, options = {}) => {
    const validator = []
    const fields = rule(target, options)

    fields.map(prop => validator.push(Form[prop].validate()))

    return validator
}