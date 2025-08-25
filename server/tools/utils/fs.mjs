import fs from 'fs/promises'


export const getFiles = async (path, asc = true) => {
    try {
        const files = await fs.readdir(path)
        files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        if (!asc) files.reverse()

        return files
    } catch(err) {
        if (err.code === 'ENOENT') console.error('Directory does not exist:', path)
        else console.error('Error reading folder:', path, err)

        return []
    }
}