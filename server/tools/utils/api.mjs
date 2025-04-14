export default (req) => {
    const api = req.originalUrl.substring(0, 5) == '/api/'
    const errKey = api ? 'api' : 'data'

    return { api, errKey }
}