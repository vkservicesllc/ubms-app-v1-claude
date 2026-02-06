import moment from 'moment-timezone'

const timezone = 'America/New_York'


export const utcTimeStamp = () => {
    const now = new Date

    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}


export const utc2tz = (utcTS, toDate = false) => utcTS ? moment.utc(utcTS).tz(timezone).format('YYYY-MM-DD' + (!toDate ? ' HH:mm:ss' : '')) : utcTS


export const dateAfter = (firstDate, num, units, lastDate) => {
    firstDate = moment(firstDate)
    lastDate = (lastDate ? moment(lastDate) : moment()).startOf('day')
    const difference = lastDate.clone().subtract(num, units).startOf('day')

    return firstDate.isAfter(difference)
}