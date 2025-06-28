const _id = $('#id').val()
let application

const response = $.ajax(`/api/drivers/application/${_id}`, { method: 'POST', async: false }).responseJSON
const { data, error } = response

if (error) alert(error)
application = data

export default application