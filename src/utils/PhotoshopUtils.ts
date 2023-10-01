import { core, app, action, constants, imaging } from 'photoshop';
const fs = require('uxp').storage.localFileSystem;
import { log } from './Log';
import { TAGnVERTICALALIGN, TextMode, rf_data } from './props';
import { ALIGN, align_btn } from './constant';

const filter_fx = (idx: number, which_filter: any) => {
  return {
    '_obj': 'set',
    '_target': [
      {
        '_ref': 'filterFX',
        '_index': idx + 1,
      },
      {
        '_ref': 'layer',
        '_enum': 'ordinal',
        '_value': 'targetEnum',
      },
    ],
    'filterFX': {
      '_obj': 'filterFX',
      'filter': which_filter,
    },
  };
};
export const RawFilterProcessing = (rd: rf_data) => {
  const raw_filter = {
    '_obj': 'Adobe Camera Raw Filter',
    '$CrVe': '15.5',
    '$PrVN': 6,
    '$PrVe': 251920384,
    '$WBal': {
      '_enum': '$WBal',
      '_value': 'customEnum',
    },
    '$Temp': rd.temp,
    '$Tint': rd.tint,
    '$CrTx': rd.texture, //texture
    '$Cl12': rd.clarity, //clarity
    '$Vibr': rd.vibrance, //vibrance
    'saturation': rd.saturation, //saturation
    'sharpen': rd.sharpen, //sharpen
    '$ShpR': 1, //radius
    '$ShpD': 25, // detail
    '$ShpM': 0, //masking
    '$LNR': rd.noise_reduction, //noise reduct
    '$LNRD': 50,
    '$LNRC': 0,
    '$CNR': rd.colornoise_reduction, //color noise reduct
    '$CNRD': 50,
    '$CNRS': 50,
    '$TMMs': 0,
    '$PGTM': 0,
    RGBSetupClass: 0,
  };

  core
    .executeAsModal(
      async () => {
        const applied = await IsApplied(app.activeDocument.activeLayers[0].id);
        let idx = applied[1]?.findIndex((e) => e.filter._obj === 'Adobe Camera Raw Filter');

        if (applied[0] && idx > -1) {
          await convertToSmartObject();

          const result = await app.batchPlay([filter_fx(idx, raw_filter)], {}).catch((e) => log(e));
        } else {
          await convertToSmartObject();

          const result = await app.batchPlay([raw_filter], {}).catch((e) => log(e));
        }
      },
      { commandName: 'Raw Filter Processing' }
    )
    .catch((e) => log(e));
};

export type cb_data = {
  r: [number, number, number];
  g: [number, number, number];
  b: [number, number, number];
};

async function convertToSmartObject() {
  const layer = app.activeDocument.activeLayers[0];
  if (layer.kind !== 'smartObject') {
    await app.batchPlay(
      [
        {
          '_obj': 'newPlacedLayer',
        },
      ],
      {}
    );
  }
}
export const ColorBalanceProcessing = (cbdata: cb_data) => {
  const colorbalance = {
    '_obj': 'colorBalance',
    'shadowLevels': [cbdata.r[0], cbdata.g[0], cbdata.b[0]],
    'midtoneLevels': [cbdata.r[1], cbdata.g[1], cbdata.b[1]],
    'highlightLevels': [cbdata.r[2], cbdata.g[2], cbdata.b[2]],
    'preserveLuminosity': true,
  };

  core
    .executeAsModal(
      async () => {
        const applied = await IsApplied(app.activeDocument.activeLayers[0].id);
        let idx = applied[1]?.findIndex((e) => e.name === 'Color Balance...');
        if (applied[0] && idx > -1) {
          await convertToSmartObject();
          const result = await app.batchPlay([filter_fx(idx, colorbalance)], {}).catch((e) => log(e));
        } else {
          await convertToSmartObject();

          const result = await app.batchPlay([colorbalance], {}).catch((e) => log(e));
        }
      },
      { commandName: 'Color Balance Processing' }
    )
    .catch((e) => log(e));
};

export function IsApplied(id: number) {
  return new Promise(async (resolve, reject) => {
    const result = await app
      .batchPlay(
        [
          {
            '_obj': 'get',
            '_target': [
              {
                '_ref': 'layer',
                '_id': id,
              },
              { _ref: 'document', _id: app.activeDocument.id },
            ],
          },
        ],
        {}
      )
      .catch((e) => reject(false));
    const so = result[0].smartObject;
    resolve(so ? [so?.filterFX?.length > 0, so.filterFX] : [false, null]);
  });
}

async function placeLinked(template) {
  await core.executeAsModal(
    async (executionContext, descriptor) => {
      await app.batchPlay(
        [
          {
            _obj: 'placeEvent',
            null: {
              _path: await fs.createSessionToken(template),
              _kind: 'local',
            },
            linked: true,
          },
          {
            _obj: 'placedLayerConvertToLayers',
          },
        ],
        {}
      );
    },
    { commandName: 'place linked' }
  );
}

export async function multiGet() {
  return await app.batchPlay(
    [
      {
        _obj: 'multiGet',
        _target: {
          _ref: 'document',
          _id: app.activeDocument.id,
        },
        extendedReference: [
          ['name', 'layerID'],
          {
            _obj: 'layer',
            index: 1,
            count: -1,
          },
        ],
      },
    ],
    {}
  );
}

function findLayer(layers, key) {
  for (const l of layers) {
    if (l.kind === 'group') {
      const result = findLayer(l.layers, key); // Recursive call
      if (result) {
        return result; // Return the result if found in the nested group
      }
    } else {
      if (l.name === key) {
        return l; // Return the layer if the name matches
      }
    }
  }
}
async function changeTexts(dcsms_layer: any, texts: TextMode[], gap: number, margin_top: number, margin_left: number) {
  if (dcsms_layer) {
    await core
      .executeAsModal(
        async (e, d) => {
          if (dcsms_layer.name === 'dcsmstext_alt') dcsms_layer.visible = true;
          let top = margin_top;

          for await (const [index, t] of texts.entries()) {
            const lyr = await dcsms_layer.duplicate();
            lyr.name = 'dcsmstext_tamper';
            const txtitem = lyr.textItem;
            txtitem.contents = t.text;
            //const lyr = app.activeDocument.activeLayers[0];
            let h = dcsms_layer.boundsNoEffects.bottom - dcsms_layer.boundsNoEffects.top;
            h = h + gap;
            const _hindex = h * index;
            const bmargin = lyr.boundsNoEffects.top - margin_top;
            top = index == 0 ? -(lyr.boundsNoEffects.top - margin_top) : -(bmargin - _hindex);
            await lyr.translate(-(lyr.boundsNoEffects.left - margin_left), top);
            //await moveLayer(top, -lyr.boundsNoEffects.left);
          }
          await dcsms_layer.delete();
        },
        { commandName: 'change text' }
      )
      .catch((e) => console.log(e));
  }
}

export async function applyTemplate(template: any, texts: TextMode[], with_tag: boolean) {
  const gap = 10;
  const margin_top = 30;
  const margin_left = with_tag ? 104 : margin_top;
  await placeLinked(template).then(async () => {
    const dcsms_layer = findLayer(app.activeDocument.layers, 'dcsmstext');
    const dcsms_layer_alt = findLayer(app.activeDocument.layers, 'dcsmstext_alt');
    await changeTexts(
      dcsms_layer,
      texts.filter((e) => e.mode === 0),
      gap,
      margin_top,
      margin_left
    );
    if (dcsms_layer_alt) {
      await changeTexts(
        dcsms_layer_alt,
        texts.filter((e) => e.mode === 2),
        gap,
        margin_top,
        margin_left
      );
    }
  });
}

export async function applyAdjustmentLayer(whichlayer) {
  await core
    .executeAsModal(
      async () => {
        await app
          .batchPlay(
            [
              {
                '_obj': 'make',
                '_target': [
                  {
                    '_ref': 'adjustmentLayer',
                  },
                ],
                'using': {
                  '_obj': 'adjustmentLayer',
                  'type': whichlayer,
                },
              },
              {
                '_obj': 'groupEvent',
                '_target': [
                  {
                    '_ref': 'layer',
                    '_enum': 'ordinal',
                    '_value': 'targetEnum',
                  },
                ],
              },
            ],
            {}
          )
          .catch((e) => console.log('applyAdjustmentLayer', e));
      },
      { commandName: 'adjustment layer' }
    )
    .catch((e) => console.log('applyAdjustmentLayer', e));
}
async function geser(x: number, y: number) {
  await core.executeAsModal(
    async () => {
      await app.batchPlay(
        [
          {
            '_obj': 'move',
            '_target': [
              {
                '_ref': 'layer',
                '_enum': 'ordinal',
                '_value': 'targetEnum',
              },
            ],
            'to': {
              '_obj': 'offset',
              'horizontal': {
                '_unit': 'pixelsUnit',
                '_value': x,
              },
              'vertical': {
                '_unit': 'pixelsUnit',
                '_value': y,
              },
            },
          },
        ],
        {}
      );
    },
    { commandName: 'geser dong' }
  );
}

export async function alignLayers(alignto: string, toCanvas: boolean) {
  await core
    .executeAsModal(
      async () => {
        await app.batchPlay(
          [
            {
              '_obj': 'align',
              '_target': [
                {
                  '_ref': 'layer',
                  '_enum': 'ordinal',
                  '_value': 'targetEnum',
                },
              ],
              'using': {
                '_enum': 'alignDistributeSelector',
                '_value': alignto,
              },
              'alignToCanvas': toCanvas,
            },
          ],
          {}
        );
      },
      { commandName: 'align layers' }
    )
    .catch((e) => console.log(e));
}

export async function createNewDoc() {
  console.log('creating new doc');
  await core
    .executeAsModal(
      async () => {
        await app.batchPlay(
          [
            {
              _obj: 'make',
              new: {
                _obj: 'document',
                artboard: false,
                autoPromoteBackgroundLayer: false,
                preset: 'Thumbnail',
              },
            },
          ],
          {}
        );
      },
      { commandName: 'create new document' }
    )
    .catch((e) => console.log(e));
}

export async function processHotkey(tagvertalign: TAGnVERTICALALIGN, e) {
  let val;
  try {
    val = e.target.textContent;
  } catch (error) {
    val = e;
  }
  const docWidth = 1280;
  const docHeight = 720;

  const _all = app.activeDocument.activeLayers;

  const ver = _all.sort(function (a, b) {
    return a.boundsNoEffects.top - b.boundsNoEffects.top;
  });
  const verbot = _all.sort(function (a, b) {
    return b.boundsNoEffects.bottom - a.boundsNoEffects.bottom;
  });
  const _left = _all.sort(function (a, b) {
    return a.boundsNoEffects.left - b.boundsNoEffects.left;
  });
  const _right = _all.sort(function (a, b) {
    return b.boundsNoEffects.right - a.boundsNoEffects.right;
  });

  const top = ver[0].boundsNoEffects.top;
  const bottom = verbot[0].boundsNoEffects.bottom;
  const left = _left[0].boundsNoEffects.left;
  const right = _right[0].boundsNoEffects.right;

  const width = right - left;
  const height = bottom - top;

  const margin = 30; //!GAP
  const leftGut = tagvertalign.tag ? 104 : 0;
  const isMid = tagvertalign.vertical_align;

  const x = docWidth / 2 - (width / 2 + left);
  let y = 0;
  if (isMid) {
    y = docHeight / 2 - (height / 2 + top);
  }

  switch (val) {
    case align_btn.tl:
      await geser(-left + (leftGut + margin), margin + -top);
      break;
    case align_btn.tr:
      await geser(docWidth - right - margin, margin + -top);
      break;
    case align_btn.bl:
      await geser(-left + (leftGut + margin), docHeight - bottom - margin);
      break;
    case align_btn.br:
      await geser(docWidth - right - margin, docHeight - bottom - margin);

      break;
    case align_btn.ml:
      await geser(-left + (leftGut + margin), 0);

      break;
    case align_btn.mr:
      await geser(docWidth - right - margin, 0);

      break;
    case align_btn.tt:
      await geser(0, -top + margin);
      break;

    case align_btn.bm:
      await geser(0, docHeight - bottom - margin);

      break;
    case align_btn.mm:
      await geser(x + leftGut / 2, y);

      break;

    case 'SCALE':
      await core.executeAsModal(
        async () => {
          const scale = ((docWidth - leftGut - margin * 2) / width) * 100;
          await app.activeDocument.activeLayers[0].scale(scale, scale);
        },
        { commandName: 'some tag' }
      );
      break;
    case 'TAGSCALE':
      await core.executeAsModal(
        async () => {
          const curlayer = app.activeDocument.activeLayers[0];
          const curhi = curlayer.boundsNoEffects.height;
          const scale = (100 / curhi) * 100;
          await curlayer.scale(scale, scale);
        },
        { commandName: 'some tag' }
      );
      break;
  }
}

//#region COLOR
function hex2rgb(hex) {
  hex = hex.replace(/^#/, '');

  // Check if it's a 3-digit or 6-digit hex code
  if (hex.length === 3) {
    // Expand 3-digit hex to 6-digit hex
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}
function GetTripleColorFillCommand(top, mid, bot, pos_a, pos_b) {
  return {
    _obj: 'set',
    _target: [
      {
        _ref: 'contentLayer',
        _enum: 'ordinal',
        _value: 'targetEnum',
      },
    ],
    to: {
      _obj: 'gradientLayer',
      gradientsInterpolationMethod: {
        _enum: 'gradientInterpolationMethodType',
        _value: 'perceptual',
      },
      angle: {
        _unit: 'angleUnit',
        _value: -90,
      },
      type: {
        _enum: 'gradientType',
        _value: 'linear',
      },
      scale: {
        _unit: 'percentUnit',
        _value: 100,
      },
      gradient: {
        _obj: 'gradientClassEvent',
        name: 'Custom',
        gradientForm: {
          _enum: 'gradientForm',
          _value: 'customStops',
        },
        interfaceIconFrameDimmed: 0,
        colors: [
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: top[0], // 1
              grain: top[1],
              blue: top[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: top[0], // 1
              grain: top[1],
              blue: top[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: pos_a - 1,
            midpoint: 50,
          },
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: mid[0], // 1
              grain: mid[1],
              blue: mid[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: pos_a,
            midpoint: 50,
          },
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: mid[0], // 1
              grain: mid[1],
              blue: mid[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: pos_b,
            midpoint: 50,
          },
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: bot[0], // 1
              grain: bot[1],
              blue: bot[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: pos_b + 1,
            midpoint: 50,
          },
        ],
        transparency: [
          {
            _obj: 'transferSpec',
            opacity: {
              _unit: 'percentUnit',
              _value: 100,
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: 'transferSpec',
            opacity: {
              _unit: 'percentUnit',
              _value: 100,
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: 'transferSpec',
            opacity: {
              _unit: 'percentUnit',
              _value: 100,
            },
            location: 4096,
            midpoint: 50,
          },
        ],
      },
    },
  };
}
function GetColorFillCommand(top, mid, bottom, position) {
  return {
    _obj: 'set',
    _target: [
      {
        _ref: 'contentLayer',
        _enum: 'ordinal',
        _value: 'targetEnum',
      },
    ],
    to: {
      _obj: 'gradientLayer',
      gradientsInterpolationMethod: {
        _enum: 'gradientInterpolationMethodType',
        _value: 'perceptual',
      },
      angle: {
        _unit: 'angleUnit',
        _value: -90,
      },
      type: {
        _enum: 'gradientType',
        _value: 'linear',
      },
      scale: {
        _unit: 'percentUnit',
        _value: 1,
      },
      offset: {
        _obj: 'paint',
        horizontal: {
          _unit: 'percentUnit',
          _value: 0,
        },
        vertical: {
          _unit: 'percentUnit',
          _value: position,
        },
      },
      gradient: {
        _obj: 'gradientClassEvent',
        name: 'Custom',
        gradientForm: {
          _enum: 'gradientForm',
          _value: 'customStops',
        },
        interfaceIconFrameDimmed: 0,
        colors: [
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: top[0],
              grain: top[1],
              blue: top[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: 2048,
            midpoint: 50,
          },
          {
            _obj: 'colorStop',
            color: {
              _obj: 'RGBColor',
              red: bottom[0],
              grain: bottom[1],
              blue: bottom[2],
            },
            type: {
              _enum: 'colorStopType',
              _value: 'userStop',
            },
            location: 2048,
            midpoint: 50,
          },
        ],
        transparency: [
          {
            _obj: 'transferSpec',
            opacity: {
              _unit: 'percentUnit',
              _value: 100,
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: 'transferSpec',
            opacity: {
              _unit: 'percentUnit',
              _value: 100,
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: 'transferSpec',
            opacity: {
              _unit: 'percentUnit',
              _value: 100,
            },
            location: 4096,
            midpoint: 50,
          },
        ],
      },
    },
    _isCommand: true,
  };
}
//#endregion

export async function ApplyColor(TRICOL, LR) {
  const _id = await findLayer(app.activeDocument.layers, 'colorfill').id;

  try {
    const top = hex2rgb(TRICOL[0]);
    const mid = hex2rgb(TRICOL[1]);
    const bottom = hex2rgb(TRICOL[2]);
    const position = LR[0];
    await core.executeAsModal(
      async () => {
        await app.batchPlay(
          [
            {
              _obj: 'select',
              _target: { _ref: 'layer', _id: _id },
            },
            {
              _obj: 'applyLocking',
              _target: [
                {
                  _ref: 'layer',
                  _enum: 'ordinal',
                  _value: 'targetEnum',
                },
              ],
              layerLocking: {
                _obj: 'layerLocking',
                protectAll: false,
              },
            },
          ],
          {}
        );

        const cmd = GetColorFillCommand(top, null, bottom, position);
        const cmd_triple = GetTripleColorFillCommand(top, mid, bottom, LR[0], LR[1]);
        await app.batchPlay([cmd_triple], {});
        await app.batchPlay(
          [
            {
              _obj: 'applyLocking',
              _target: [
                {
                  _ref: 'layer',
                  _enum: 'ordinal',
                  _value: 'targetEnum',
                },
              ],
              layerLocking: {
                _obj: 'layerLocking',
                protectAll: true,
              },
            },
          ],
          {}
        );
      },
      { commandName: 'color' }
    );
  } catch (error) {
    console.log(error);
  }
}

export async function showShadow(show: boolean) {
  await core.executeAsModal(
    async () => {
      for await (const shadow of ['shadow', 'shadow2', 'shadow3']) {
        await app.batchPlay(
          [
            {
              '_obj': 'select',
              '_target': [
                {
                  '_ref': 'layer',
                  '_name': shadow,
                },
              ],
              'makeVisible': false,
            },
            {
              '_obj': show ? 'show' : 'hide',
              'null': [
                {
                  '_ref': [
                    {
                      '_ref': 'layerEffects',
                    },
                    {
                      '_ref': 'layer',
                      '_name': shadow,
                    },
                  ],
                },
              ],
            },
          ],
          {}
        );
      }
    },
    { commandName: 'show shadow' }
  );
}
export function getTagLayers() {
  let datas = [];
  function recurse(data, istag) {
    data.forEach((d) => {
      if (d?.kind == 'group') {
        if (d?.name == 'TAG') {
          recurse(d?.layers, true);
        } else {
          recurse(d?.layers, false);
        }
      } else {
        if (istag) {
          datas?.push(d);
        }
      }
    });
  }
  recurse(require('photoshop')?.app?.activeDocument?.layers, false);
  return datas;
}
export function getLayerByName(layername: string) {
  let layer = null;
  function recurse(data, istag) {
    data.forEach((d) => {
      if (d.kind == 'group') {
        recurse(d.layers, layername);
      } else {
        if (d.name === layername) {
          layer = d;
        }
      }
    });
  }
  recurse(require('photoshop').app.activeDocument.layers, layername);
  return layer;
}

export async function doSaveDocument(savepathtoken, namafile, channel) {
  return new Promise(async (resolve, reject) => {
    const newJPG = await savepathtoken.createFile(namafile + '.jpeg', { overwrite: true });
    const newPSD = await savepathtoken.createFile(namafile + '.psd', { overwrite: true });
    const saveJPEG = await fs.createSessionToken(newJPG);
    const savePSD = await fs.createSessionToken(newPSD);
    await core.executeAsModal(
      async () => {
        const result = await app.batchPlay(
          [
            {
              '_obj': 'save',
              'as': {
                '_obj': 'photoshop35Format',
                'maximizeCompatibility': true,
              },
              'in': {
                '_path': savePSD,
                '_kind': 'local',
              },
              'documentID': app.activeDocument.id,
              'lowerCase': true,
              'saveStage': {
                '_enum': 'saveStageType',
                '_value': 'saveBegin',
              },
            },
            {
              '_obj': 'save',
              'as': {
                '_obj': 'JPEG',
                'extendedQuality': 10,
                'matteColor': {
                  '_enum': 'matteColor',
                  '_value': 'none',
                },
              },
              'in': {
                '_path': saveJPEG,
                '_kind': 'local',
              },
              'documentID': app.activeDocument.id,
              'copy': true,
              'lowerCase': true,
              'saveStage': {
                '_enum': 'saveStageType',
                '_value': 'saveBegin',
              },
            },
          ],
          {}
        );

        resolve(result[1].in._path);
      },
      { commandName: 'saving files' }
    );
  });
}

export async function showThumbnailTag(all_tags, which_tag) {
  await core.executeAsModal(
    async () => {
      all_tags?.forEach((tag: any) => {
        try {
          tag.visible = tag?.name == which_tag ? true : false;
        } catch (error) {
          console.log(error);
        }
      });
    },
    { commandName: 'show thumbnail tag' }
  );
}

export async function insertSmartObject(entryobject) {
  await core
    .executeAsModal(
      async () => {
        await app
          .batchPlay(
            [
              {
                _obj: 'placeEvent',
                null: {
                  _path: await fs.createSessionToken(entryobject),
                  _kind: 'local',
                },
                linked: true,
              },
            ],
            {}
          )
          .catch((e) => console.log(e));
      },
      { commandName: 'insert smart object' }
    )
    .catch((e) => console.log(e));
}
async function dorasterize() {
  await core.executeAsModal(
    async () => {
      await app
        .batchPlay(
          [
            {
              '_obj': 'rasterizeLayer',
              '_target': [
                {
                  '_ref': 'layer',
                  '_enum': 'ordinal',
                  '_value': 'targetEnum',
                },
              ],
            },
            {
              '_obj': 'newPlacedLayer',
            },
          ],
          {}
        )
        .catch((e) => console.log(e));
      const _paste_layer = app.activeDocument.activeLayers[0];
      _paste_layer.move(app.activeDocument.layers[0], constants.ElementPlacement.PLACEBEFORE);
    },
    { commandName: 'rasterize' }
  );
}
export async function insertLinkedImage(entryobject, filename) {
  await core
    .executeAsModal(
      async () => {
        await app
          .batchPlay(
            [
              {
                _obj: 'placeEvent',
                null: {
                  _path: await fs.createSessionToken(entryobject),
                  _kind: 'local',
                },
                linked: true,
              },
            ],
            {}
          )
          .catch((e) => console.log(e));
        setTimeout(async () => {
          if (filename.includes('0001')) {
            await dorasterize();
          }
        }, 100);
      },
      { commandName: 'insert smart object' }
    )
    .catch((e) => console.log(e));
}

export async function executeCustomScripts(script) {
  await core
    .executeAsModal(
      async (context, desc) => {
        await app.batchPlay(script, {}).catch((e) => console.log(e));
      },
      { commandName: 'custom script' }
    )
    .catch((e) => console.log(e));
}
async function findSmartObjectName(all_smartobject: any, layername: string) {
  return new Promise(async (resolve, reject) => {
    const numb_name = all_smartobject
      ?.map((so: any) => so.name)
      ?.map((psbfile: string) => {
        const filename = psbfile.replace('.psb', '').split('_');
        return parseInt(filename[filename.length - 1]);
      })
      .filter((n) => !isNaN(n));

    const num = Math.max(...numb_name);
    resolve(num == -Infinity ? `${layername}_0.psb` : `${layername}_${num + 1}.psb`);
  });
}
export async function quickExecuteModal(callback: any, name: string) {
  return await core.executeAsModal(callback, { commandName: name });
}

export function findNestedObject(entireObj, keyToFind) {
  let foundObj: any;
  JSON.stringify(entireObj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj = nestedValue;
    }
    return nestedValue;
  });
  return foundObj;
}
export async function SaveCurrentLayerAsSmartObject(so_token: any, all_smartobject: object, file_name: string) {
  const layer = app.activeDocument.activeLayers[0];
  if (!layer) return;
  const outfile_path = await quickExecuteModal(async () => {
    const new_name = (await findSmartObjectName(all_smartobject, file_name)) as string;
    layer.name = new_name;
    const new_so = await so_token.createFile(new_name, { overwrite: false });
    const new_session = fs.createSessionToken(new_so);
    const result = await app.batchPlay(
      [
        {
          _obj: 'newPlacedLayer',
        },
        {
          _obj: 'placedLayerConvertToLinked',
          _target: [
            {
              _ref: 'layer',
              _enum: 'ordinal',
              _value: 'targetEnum',
            },
          ],
          using: {
            _path: new_session,
            _kind: 'local',
          },
        },
      ],
      {}
    );
    console.log(result);
    const filepath = findNestedObject(result, '_path');
    return filepath?._path;
  }, 'layer name');
  return outfile_path;
}

export async function getSmartObjectNativePath(so_token: any, filename: string) {
  const result = await so_token.getEntry(filename + '.psb');
  return result.nativePath;
}
