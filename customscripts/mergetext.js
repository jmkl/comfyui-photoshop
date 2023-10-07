/// <reference path="./global.d.ts"/>

let texts = await doc.activeLayers;
texts = texts.sort((a, b) => a.bounds.top - b.bounds.top);
for (const t of texts) {
  const text = t.textItem;
  logme(text.contents);
}
showDialog('something', 'something');
