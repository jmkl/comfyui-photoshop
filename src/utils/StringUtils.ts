export function calculateNested(array: string[]) {
  let count = 0;
  array.forEach((e) => {
    count = count + Math.round(e.length / 38);
  });
  return count;
}
export function MapRange(val: number, in_min: number, in_max: number, out_min: number, out_max: number) {
  return ((val - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

export function findChannel(array_of_layers) {
  const channels = ['refly', 'naufal', 'ogie', 'zoom', 'inang'];
  const all_Layers = array_of_layers[0].list.map((e) => e.name);
  let which_channels = null;
  for (const channel of channels) {
    if (all_Layers.filter((e) => e.toLowerCase().includes(channel)).length > 0) {
      which_channels = channel;
      break;
    }
  }
  return which_channels;
}
export function getMaxNumberofName(ntries) {
  const files = ntries.filter((e) => e.name.indexOf('psd') > 0);
  const names = [];
  files.forEach((child) => {
    const name = parseInt(child.name.replace('.psd', ''));
    if (!isNaN(name)) names.push(name);
  });
  return Math.max(...names);
}
