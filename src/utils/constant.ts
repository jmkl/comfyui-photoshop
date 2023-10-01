export const STORAGE_FACERESTORECONFIG = 'FACERESTORCONFIG_VALUE';
export const STORAGE_INPAINTINGCONFIG = 'INPAINTINGCONFIG_VALUE';
export const STORAGE_IMAGENCONFIG = 'IMAGENCONFIG_VALUE';
export const STORAGE_WORKFLOWFOLDER = 'WORKFLOWFOLDER';
export const STORAGE_REMBG = 'REMBG_VALUE';
export const STORAGE_COLORS = 'COLORS_STORE';
export const STORAGE_TRICOLOR = 'STORAGE_TRICOLOR';
export const STORAGE_WITH_TAG = 'STORAGE_WITH_TAG';

export const ALIGN = {
  LEFT: 'ADSLefts',
  RIGHT: 'ADSRights',
  CENTERHORIZONTAL: 'ADSCentersH',
  TOP: 'ADSTops',
  BOTTOM: 'ADSBottoms',
  CENTERVERTICAL: 'ADSCentersV',
};
export const ADJLAYER = {
  CURVES: {
    '_obj': 'curves',
    'presetKind': {
      '_enum': 'presetKindType',
      '_value': 'presetKindDefault',
    },
  },
  EXPOSURE: {
    '_obj': 'exposure',
    'presetKind': {
      '_enum': 'presetKindType',
      '_value': 'presetKindDefault',
    },
    'exposure': 0,
    'offset': 0,
    'gammaCorrection': 1,
  },
  HUESATURATION: {
    '_obj': 'hueSaturation',
    'presetKind': {
      '_enum': 'presetKindType',
      '_value': 'presetKindDefault',
    },
    'colorize': false,
  },
  COLORBALANCE: {
    '_obj': 'colorBalance',
    'shadowLevels': [0, 0, 0],
    'midtoneLevels': [0, 0, 0],
    'highlightLevels': [0, 0, 0],
    'preserveLuminosity': true,
  },
  GRADIENTMAP: {
    _obj: 'gradientMapClass',
    gradientsInterpolationMethod: {
      _enum: 'gradientInterpolationMethodType',
      _value: 'perceptual',
    },
    gradient: {
      _obj: 'gradientClassEvent',
      name: 'Foreground to Background',
      gradientForm: {
        _enum: 'gradientForm',
        _value: 'customStops',
      },
      interfaceIconFrameDimmed: 4096,
      colors: [
        {
          _obj: 'colorStop',
          color: {
            _obj: 'RGBColor',
            red: 0,
            grain: 0,
            blue: 0,
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
            red: 255,
            grain: 255,
            blue: 255,
          },
          type: {
            _enum: 'colorStopType',
            _value: 'userStop',
          },
          location: 4096,
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
          location: 4096,
          midpoint: 50,
        },
      ],
    },
  },
  LUT: {
    '_class': 'colorLookup',
  },
};
export const default_color_balance = Object.freeze([
  { name: 'r', min: -100, max: 100, value: [0, 0, 0], step: 1, mode: 'r' },
  { name: 'g', min: -100, max: 100, value: [0, 0, 0], step: 1, mode: 'g' },
  { name: 'b', min: -100, max: 100, value: [0, 0, 0], step: 1, mode: 'b' },
]);

export const default_raw_filter = Object.freeze([
  { name: 'texture', min: 0, max: 100, value: 0, step: 1 },
  { name: 'clarity', min: 0, max: 100, value: 0, step: 1 },
  { name: 'sharpen', min: 0, max: 150, value: 0, step: 1 },
  { name: 'noise_reduction', min: 0, max: 100, value: 0, step: 1 },
  { name: 'colornoise_reduction', min: 0, max: 100, value: 0, step: 1 },
  { name: 'vibrance', min: -100, max: 100, value: 0, step: 1 },
  { name: 'saturation', min: -100, max: 100, value: 0, step: 1 },
  { name: 'temp', min: -100, max: 100, value: 0, step: 1 },
  { name: 'tint', min: -100, max: 100, value: 0, step: 1 },
]);
export const align_btn = {
  tl: 'arrow-up-left',
  tt: 'arrow-up',
  tr: 'arrow-up-right',
  ml: 'arrow-left',
  mm: 'center-center',
  mr: 'arrow-right',
  bl: 'arrow-down-left',
  bm: 'arrow-down',
  br: 'arrow-down-right',
  al: 'align-left',
  am: 'align-center',
  ar: 'align-right',
};

export type COLORAPI = {
  name: string;
  theme: string;
  group: string;
  hex: string;
  rgb: string;
};
