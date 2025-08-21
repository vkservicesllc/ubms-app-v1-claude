import fs from 'fs/promises'


export const getFiles = async path => {
    try {
        const files = await fs.readdir(path)

        return files
    } catch(err) {
        if (err.code === 'ENOENT') console.error('Directory does not exist:', path)
        else console.error('Error reading folder:', path, err)

        return []
    }
}