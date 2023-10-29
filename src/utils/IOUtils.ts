import {log} from './Log';

const fs = require('uxp').storage.localFileSystem;
const nodefs = require('fs');

export function generateRandomName(filetype?: string) {
  if (filetype) return (Math.random() + 1).toString(36).substring(7) + filetype.replace('image/', '.');
  else return (Math.random() + 1).toString(36).substring(7) + '.png';
}
export const isValidUrl = (urlString) => {
  var res = urlString.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return res !== null;
};
export function copyImageToInputFolder(filepath: string, input_folder: string, default_name?: string, node_name?: string) {
  let rand_name = generateRandomName();
  if (node_name) rand_name = node_name + '_' + rand_name;
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
    const {bytesRead} = await fs.read(fd, buffer, bytesReadInTotal, 128, -1);
    if (!bytesRead) {
      break;
    }
    bytesReadInTotal += bytesRead;
  }
};

export function getMilis() {
  return new Date().getMilliseconds();
}
