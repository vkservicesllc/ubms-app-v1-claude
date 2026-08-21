import fs from 'fs/promises';
import path from 'path';

export const getFiles = async (dir, asc = true) => {
  try {
    const files = await fs.readdir(dir);
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!asc) files.reverse();

    return files;
  } catch (err) {
    if (err.code === 'ENOENT') console.error('Directory does not exist:', dir);
    else console.error('Error reading folder:', dir, err);

    return [];
  }
};

export const renameFile = async (dir, oldName, newName) => {
  try {
    const oldPath = path.join(dir, oldName);
    const newPath = path.join(dir, newName);

    await fs.rename(oldPath, newPath);

    return { success: true };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { success: false, renamed: false };
    }

    return { success: false, error: err.code || err.message };
  }
};

export const deleteFiles = async (dir, recr = false) => {
  try {
    await fs.rm(dir, { recursive: true });
    if (recr === true) await fs.mkdir(dir);

    return { success: true };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { success: false, deleted: false };
    }

    return { success: false, error: err.code || err.message };
  }
};
