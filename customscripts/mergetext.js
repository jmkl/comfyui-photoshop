/// <reference path="./global.d.ts"/>
let texts = await doc.activeLayers;
showDialog('Merge Text', 'is horizontal?').then(async (result) => {
  try {
    let sort_texts;
    let result_text;
    if (result) {
      sort_texts = texts.sort((a, b) => a.bounds.left - b.bounds.left);
    } else {
      sort_texts = texts.sort((a, b) => a.bounds.top - b.bounds.top);
    }
    result_text = sort_texts.map((e) => {
      const t = e.textItem;
      return t.contents;
    });
    await executeAsModal(
      async () => {
        let texts = await doc.activeLayers;
        if (texts.length <= 1) return;
        for await (const [idx, tt] of texts.entries()) {
          const t = tt.textItem;
          if (idx === 0) t.contents = result_text.join(' ');
          else await tt.delete();
        }
      },
      {
        commandName: 'align center',
      }
    ).catch((e) => console.log(e));
  } catch (e) {
    logme('error');
  }
});
