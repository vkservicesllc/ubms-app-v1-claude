moment.tz.add('America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0')

const momentUTC2ET = (dateStr, pattern) => moment.utc(dateStr).tz('America/New_York').format(pattern)