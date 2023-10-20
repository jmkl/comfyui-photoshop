export interface facerestoreProps {
  facerestore_model: string[][];
  face_detection: string[][];
  method: string[][];
  upscale_model: string[][];
}
export interface BOUNDS {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
export interface INPAINTINGCONFIG {
  seed: number;
  steps: number;
  cfg: number;
  sampler_name: string;
  scheduler: string;
  denoise: number;
  ckpt_name: string;
  text_positive: string;
  text_negative: string;
  image_method: string;
  image_value: number;
  grow_mask_by: number;
}

interface KSAMPLER {
  seed: number;
  steps: number;
  cfg: number;
  denoise: number;
  sampler_name: string;
  scheduler: string;
}
export interface IMAGENERATOR_CONFIG {
  ckpt_name: string;
  upscale_model: string;
  ksampler: KSAMPLER;
  ksampler_upscale: KSAMPLER;
  text_positive: string;
  text_negative: string;
  image_width: number;
  image_height: number;
}
export type TextMode = {
  mode: number;
  text: string;
};

export type AIOServerData = {
  channel: string;
  data: string;
  fromserver: boolean;
  image64: string;
  textdata: string;
  type: string;
  timestamp?: number;
};
export type rf_data = {
  texture: number;
  clarity: number;
  sharpen: number;
  noise_reduction: number;
  colornoise_reduction: number;
  vibrance: number;
  saturation: number;
  temp: number;
  tint: number;
};

export type TAGnVERTICALALIGN = {
  tag: boolean;
  vertical_align: boolean;
};

export type CUSTOMSCRIPT = {
  name: string;
  desc?: string;
  icon_path: string;
  executable?: boolean;
  script?: string;
  func: any;
};

export type IMAGEONLINE = {
  mainurl: string;
  total: number;
  page: 1;
  content: [
    {
      name: string;
      thumb: string;
      url: string;
    }
  ];
};

export type content = {
  name: string;
  thumb: string;
  favorite: boolean;
  category?: string;
};
export type IMAGEITEMS = {
  mode: string;
  entry: any;
  category: string;
  content: content[];
};

export type InlineDialogContent = {
  isloading?: boolean;
  show: boolean;
  title: string;
  message: string;
  onOk?: (e: string) => void;
  onCancel?: (e: string) => void;
};
