const fs = require('uxp').storage.localFileSystem;

export const COMFYFOLDER = 'COMFYFOLDER';
export const WORKFLOWFOLER = 'WORKFLOWFOLDER';
export const TEXTTOOLFOLDER = 'TEXTOOLFOLDER';
export const TEMPLATEINDEX = 'TEMPLATEINDEX';
export const CUSTOMSCRIPT = 'CUSTOMSCRIPT';
export const root_folder_content = [
  'batchplay',
  'download',
  'gigapixel',
  'inang',
  'midasresult',
  'midastemp',
  'naufal',
  'ogie',
  'refly',
  'smartobject',
  'template',
  'texture',
];
export async function GetFolder(key: string) {
  const savedToken = localStorage.getItem(COMFYFOLDER);
  const newtoken = await fs.getEntryForPersistentToken(savedToken);
  const result = await newtoken.getEntry(key);
  return result;
}

export async function GetImageInsideInputFolder(file_name: string, ioFolder: any) {
  return await ioFolder?.input.getEntry(file_name);
}

export async function PickImageDialog() {
  const file = await fs.getFileForOpening({ initialLocation: 'userDocuments' });
  return file;
}

export function GetTokenFor(key: string) {
  const savedToken = localStorage.getItem(key);
  return new Promise(async (resolve, reject) => {
    if (!savedToken) {
      reject('Not Exist');
      return null;
    }
    const newToken = await fs.getEntryForPersistentToken(savedToken);
    newToken.isFolder ? resolve(newToken) : reject('cant do that');
  });
}

export async function PickFolderFor(key: string) {
  return new Promise(async (resolve, reject) => {
    const fo_result = await fs.getFolder();
    const _token = await fs.createPersistentToken(fo_result);
    localStorage.setItem(key, _token);

    resolve(fo_result);
  });
}
