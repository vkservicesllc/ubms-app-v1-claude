export default numStr => numStr ? numStr.replace(/[\s+\(\)\-]/g, '') : null


export const tel = numStr => numStr ? `(${numStr.substr(0, 3)}) ${numStr.substr(3, 3)}-${numStr.substr(6, 4)}` : undefined

export const ssn = (numStr, mask = null) => {
    if (!numStr) return

    const chunks = [
        numStr.substring(0, 3),
        numStr.substring(3, 5),
        numStr.substring(5, 9),
    ]

    if (typeof mask == 'string') {
        chunks[0] = mask.repeat(3)
        chunks[1] = mask.repeat(2)
    }

    return chunks.join('-')
}

export const ein = numStr => numStr ? `${numStr.substring(0, 2)}-${numStr.substring(2, 9)}` : undefined

export const duns = numStr => numStr ? `${numStr.substring(0, 2)}-${numStr.substring(2, 4)}-${numStr.substring(4, 9)}` : undefined