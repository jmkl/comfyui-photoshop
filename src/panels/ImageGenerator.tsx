import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Label, Textfield } from '../components';
import DropDrownPicker, { DropdownEvent } from '../customcomponents/DropDownPicker';
import { STORAGE_IMAGENCONFIG } from '../utils/constant';
import { InterruptServer, random_seed } from '../utils/ServerUtils';
import { IMAGENERATOR_CONFIG } from '../utils/props';
import { executeImageGenerator } from '../utils/BPUtils';
import MTextArea from '../customcomponents/MTextArea';

type Props = {
  ckpt_models?: string[];
  upscale_model?: string[];
  sampler?: string[];
  scedhuler?: string[];
  uuid: string;
  progress?: boolean;
};

export const ImageGenDefaultObject = {
  ckpt_name: 'ckpt name',
  upscale_model: 'upscale',
  ksampler: {
    seed: 8129381029371023,
    steps: 20,
    cfg: 8,
    denoise: 1,
    sampler_name: 'some data',
    scheduler: 'some data',
  },
  ksampler_upscale: {
    seed: 123182391237123,
    steps: 11,
    cfg: 8,
    denoise: 0.5,
    sampler_name: 'some data',
    scheduler: 'some data',
  },
  text_positive: 'some data',
  text_negative: 'some data',
  image_width: 512,
  image_height: 512,
};

export default function ImageGenerator(props: Props) {
  const [imaGenConfig, setImaGenConfig] = useState<IMAGENERATOR_CONFIG>(
    JSON.parse(localStorage.getItem(STORAGE_IMAGENCONFIG)) || ImageGenDefaultObject
  );
  const [showSampler, setShowsampler] = useState(-1);
  const [upscale, setUpscale] = useState(false);
  const [upscalemult, setUpscalemul] = useState(1);
  const [seed, setSeed] = useState({ ksmaplerseed: 0, ksamplerupscaleseed: 0 });

  function handleChange(parent_key, key, value) {
    if (parent_key === '') setImaGenConfig((pref: any) => ({ ...pref, [key]: value }));
    else setImaGenConfig((pref: any) => ({ ...pref, [parent_key]: { ...pref[parent_key], [key]: value } }));
  }
  function handleScaleChange(e: DropdownEvent) {
    setUpscalemul(parseInt(e.target.value));
  }

  useEffect(() => {
    if (!seed) return;
    handleChange('ksampler', 'seed', seed.ksmaplerseed);
    handleChange('ksampler_upscale', 'seed', seed.ksamplerupscaleseed);
  }, [seed]);

  useEffect(() => {}, [props.progress]);
  function generateSeed() {
    setSeed((p) => ({ ...p, ksmaplerseed: random_seed() }));
    setSeed((p) => ({ ...p, ksamplerupscaleseed: random_seed() }));
  }
  useEffect(() => {
    generateSeed();
  }, []);

  function handleGenerateButtonClick() {
    if (props?.progress) {
      InterruptServer();
      return;
    }
    localStorage.setItem(STORAGE_IMAGENCONFIG, JSON.stringify(imaGenConfig));
    executeImageGenerator(upscale, upscalemult, imaGenConfig, props.uuid);
    setTimeout(() => {
      generateSeed();
    }, 1000);
  }

  const renderObject = (obj: any, parent_key: string) => {
    return Object.entries(obj).map(([key, value], index) => {
      if (typeof value === 'string' || typeof value === 'number') {
        switch (key) {
          case 'ckpt_name':
            return (
              <DropDrownPicker
                key={index + '' + key}
                onChange={(e) => handleChange(parent_key, key, e.target.value)}
                horizontalmode={true}
                title="ckpt"
                items={props?.ckpt_models}
                selectedIndex={props?.ckpt_models.findIndex((e) => e === imaGenConfig?.ckpt_name)}
              />
            );
            break;
          case 'upscale_model':
            return (
              <DropDrownPicker
                key={index + '' + key}
                onChange={(e) => handleChange(parent_key, key, e.target.value)}
                horizontalmode={true}
                title="upscale"
                items={props?.upscale_model}
                selectedIndex={props?.upscale_model.findIndex((e) => e === imaGenConfig?.upscale_model)}
              />
            );
            break;
          case 'sampler_name':
            return (
              <DropDrownPicker
                key={index + '' + key}
                onChange={(e) => handleChange(parent_key, key, e.target.value)}
                horizontalmode={true}
                title="sampler"
                items={props?.sampler}
                selectedIndex={props?.sampler.findIndex((e) => {
                  if (parent_key === 'ksampler') return e === imaGenConfig?.ksampler?.sampler_name;
                  else return e === imaGenConfig?.ksampler_upscale?.sampler_name;
                })}
              />
            );
            break;
          case 'scheduler':
            return (
              <DropDrownPicker
                key={index + '' + key}
                onChange={(e) => handleChange(parent_key, key, e.target.value)}
                horizontalmode={true}
                title="scheduler"
                items={props?.scedhuler}
                selectedIndex={props?.scedhuler.findIndex((e) => {
                  if (parent_key === 'ksampler') return e === imaGenConfig?.ksampler?.scheduler;
                  else return e === imaGenConfig?.ksampler_upscale?.scheduler;
                })}
              />
            );
            break;
          case 'text_positive':
            return (
              <MTextArea
                type="positive prompt"
                key={index + '' + key}
                onChange={(e) => handleChange(parent_key, key, e)}
                className="w-full mt-2"
                placeholder="Positive prompt..."
                value={imaGenConfig?.text_positive}
              />
            );
            break;
          case 'text_negative':
            return (
              <MTextArea
                type="negative prompt"
                key={index + '' + key}
                onChange={(e) => handleChange(parent_key, key, e)}
                className="w-full mt-2"
                placeholder="Negative prompt..."
                value={imaGenConfig?.text_negative}
              />
            );
            break;
          case 'seed':
            return (
              <Button
                variant="cta"
                {...{ size: 's' }}
                key={index + '' + key}
                className="text-white w-1/2 my-2 text-center items-center justify-center hover:bg-slate-700 border-none rounded-md"
                onClick={(e) => {
                  if (parent_key == 'ksampler') {
                    setSeed((p) => ({ ...p, ksmaplerseed: random_seed() }));
                  } else if (parent_key == 'ksampler_upscale') {
                    setSeed((p) => ({ ...p, ksamplerupscaleseed: random_seed() }));
                  }
                }}
              >
                {parent_key == 'ksampler' ? seed.ksmaplerseed : seed.ksamplerupscaleseed}
              </Button>
            );
            break;
          default:
            return (
              <div key={index + '' + key} className={`flex flex-row px-2 my-1 ${parent_key != '' ? 'w-1/2' : 'w-full'}`}>
                <Label className="grow w-1/2">{key}</Label>
                <Textfield
                  quiet={true}
                  className="w-1/2"
                  value={parent_key === '' ? imaGenConfig?.[key] : imaGenConfig?.[parent_key]?.[key]}
                  onChange={(e) => handleChange(parent_key, key, parseFloat(e.target.value))}
                />
              </div>
            );
            break;
        }
      } else {
        return (
          <div key={index + '' + key} className="box-bg px-2 py-1 my-1 rounded-sm ">
            <div
              className="w-full cursor-pointer text-white font-bold"
              onClick={() => {
                setShowsampler(showSampler == index ? -1 : index);
              }}
            >
              {key}
            </div>
            <div className={`${showSampler == index ? 'flex flex-row flex-wrap w-full' : 'hidden'}`}> {renderObject(value, key)}</div>
          </div>
        );
      }
    });
  };
  return (
    <div className="h-auto">
      <div className="w-full flex flex-row mb-2">
        <Checkbox className="w-1/4" onChange={(e) => setUpscale(e.target.checked)}>
          Upscale
        </Checkbox>
        <DropDrownPicker
          overrideClass={`${upscale ? 'flex' : 'hidden'} w-1/3`}
          DDWidth="w-1/2"
          horizontalmode={true}
          title="by"
          selectedIndex={0}
          items={['2', '3', '4', '5', '6']}
          onChange={handleScaleChange}
        />
        <Button
          {...{ size: 's' }}
          variant={`${props?.progress ? 'warning' : 'cta'}`}
          className="w-auto grow rounded-md cursor-pointer"
          onClick={handleGenerateButtonClick}
        >
          {props?.progress ? 'Cancel' : 'Generate'}
        </Button>
      </div>
      {props?.ckpt_models && props?.upscale_model && props?.sampler && props?.scedhuler && renderObject(ImageGenDefaultObject, '')}
    </div>
  );
}
