import { imaging } from 'photoshop';

export async function _arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function imagingFromBuffer(buffer: ArrayBuffer) {
  const arrayBuffer = new Uint8Array(buffer);
  var len = arrayBuffer.byteLength;
  for (var i = 0; i < len; i + 4) {
    arrayBuffer[i] = 255; // red
    arrayBuffer[i + 1] = 0; // green
    arrayBuffer[i + 2] = 0; // blue
    arrayBuffer[i + 3] = 127; // alpha
  }
  const options = {
    width: 512,
    height: 512,
    components: 4,
    colorProfile: 'sRGB IEC61966-2.1',
    colorSpace: 'RGB',
  };
  const imageData = await imaging.createImageDataFromBuffer(arrayBuffer, options);
  const jpegdata = await imaging.encodeImageData({ imageData: imageData, base64: true });
  return jpegdata;
}
