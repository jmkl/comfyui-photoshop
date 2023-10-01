import { log } from './Log';

const fs = require('uxp').storage.localFileSystem;
const nodefs = require('fs');

export function generateRandomName() {
  return (Math.random() + 1).toString(36).substring(7) + '.png';
}

export function copyImageToInputFolder(filepath: string, input_folder: string, default_name?: string) {
  let rand_name = generateRandomName();
  if (default_name != null) rand_name = default_name;
  return new Promise(async (resolve, reject) => {
    try {
      const result = await nodefs.copyFile(filepath, `${input_folder}\\${rand_name}`);
      resolve(rand_name);
    } catch (error) {
      reject(error);
    }
  });
}

export const copy = async () => {
  const fileSize = 1024;
  const buffer = new ArrayBuffer(fileSize);
  const fd = await fs.open('plugin-data:/fileToRead.txt', 'r');
  let bytesReadInTotal = 0;
  while (bytesReadInTotal < fileSize) {
    const { bytesRead } = await fs.read(fd, buffer, bytesReadInTotal, 128, -1);
    if (!bytesRead) {
      break;
    }
    bytesReadInTotal += bytesRead;
  }
};

export function getMilis() {
  return new Date().getMilliseconds();
}
