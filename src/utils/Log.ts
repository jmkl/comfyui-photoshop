export function log(...data: any[]) {
  console.log(`%c %s`, 'color:yellow; background-color:black', ...data);
}
