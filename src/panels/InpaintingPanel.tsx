import React, { useState, useEffect, useCallback } from 'react';
import { ActionButton, Button, Checkbox, Dropdown, Label, Textarea, Textfield } from '../components';
import DropDrownPicker from '../customcomponents/DropDownPicker';
import { InterruptServer, random_seed } from '../utils/ServerUtils';
import { BOUNDS, INPAINTINGCONFIG } from '../utils/props';
import { STORAGE_FACERESTORECONFIG, STORAGE_INPAINTINGCONFIG } from '../utils/constant';
import { executeInpainting } from '../utils/BPUtils';
import { FRCONFIG, defConfig } from './FaceRestorePanel';
import MTextArea from '../customcomponents/MTextArea';
export interface ksamplerProps {
  sampler_name: string[][];
  scheduler: string[][];
}
const default_inpainting: INPAINTINGCONFIG = {
  seed: 169346039273420,
  steps: 20,
  cfg: 8,
  sampler_name: '',
  scheduler: '',
  denoise: 1.0,
  ckpt_name: '',
  text_positive: '',
  text_negative: '',
  image_method: 'height',
  image_value: 512,
  grow_mask_by: 6,
};
namespace Jul {
  export interface ButtonEvent extends globalThis.Event {
    readonly target: (EventTarget & unknown) | null;
  }
}

type Props = {
  disabled?: boolean;
  onClick?: (e: Jul.ButtonEvent) => void;
  ksamplerProps?: ksamplerProps;
  ckpt_name?: string[];
  ioFolder?: string;
  bounds?: BOUNDS;
  progress?: boolean;
  uuid: string;
};

export default function Inpainting(props: Props) {
  // const [ksamplerProps, setKsamplerProps] = useState<KSampler_Props>(null);
  // const [ckpt_name, setCkpt_name] = useState<string[]>();

  const [samplerIndex, setSamplerIndex] = useState(parseInt(localStorage.getItem('sampler_index')));
  const [schedulerIndex, setSchedulerIndex] = useState(parseInt(localStorage.getItem('scheduler_index')));
  const [iPConfig, setIPConfig] = useState<INPAINTINGCONFIG>(
    JSON.parse(localStorage.getItem(STORAGE_INPAINTINGCONFIG)) || default_inpainting
  );
  useEffect(() => {
    console.log(props?.ksamplerProps);
  }, []);
  const default_ksampler = {
    steps: 20,
    cfg: 8,
    denoise: 1,
    ckpt_name: [''],
    image_method: 'height',
    image_value: 512,
    grow_mask_by: 0,
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_INPAINTINGCONFIG, JSON.stringify(iPConfig));
  }, [iPConfig]);
  function handleOnClick(e) {
    if (props?.progress) {
      InterruptServer();
      return;
    }

    setIPConfig((p) => ({ ...p, seed: random_seed() }));
    props?.onClick(e);
    const FRCONFIG = JSON.parse(localStorage.getItem(STORAGE_FACERESTORECONFIG)) || defConfig;
    executeInpainting(props?.ioFolder, FRCONFIG, iPConfig, props?.bounds, props.uuid);
  }

  function renderUI() {
    if (props?.ksamplerProps && props?.ckpt_name)
      return (
        <div className="h-full overflow-hidden">
          <div className="flex flex-wrap flex-row cursor-pointer">
            <DropDrownPicker
              horizontalmode={true}
              items={props?.ksamplerProps?.sampler_name[0]}
              selectedIndex={props?.ksamplerProps?.sampler_name[0].findIndex((id) => id === iPConfig.sampler_name)}
              title="sampler"
              onChange={(e) => {
                setIPConfig((p) => ({ ...p, sampler_name: e.target.value }));
              }}
            />
            <DropDrownPicker
              horizontalmode={true}
              items={props?.ksamplerProps?.scheduler[0]}
              selectedIndex={props?.ksamplerProps?.scheduler[0].findIndex((id) => id === iPConfig.scheduler)}
              title="scheduler"
              onChange={(e) => {
                setIPConfig((p) => ({ ...p, scheduler: e.target.value }));
              }}
            />
            {default_ksampler &&
              Object.entries(default_ksampler).map(([key, val]) => {
                return (
                  <div className="w-full flex justify-between rembg  items-center" key={key}>
                    {key === 'image_method' ? (
                      <DropDrownPicker
                        horizontalmode={true}
                        title="method"
                        items={['height', 'width']}
                        selectedIndex={['height', 'width'].findIndex((id) => id === iPConfig.image_method)}
                        onChange={(e) => {
                          setIPConfig((p) => ({ ...p, [key]: e.target.value }));
                        }}
                      />
                    ) : key === 'ckpt_name' ? (
                      <DropDrownPicker
                        horizontalmode={true}
                        items={props?.ckpt_name}
                        title="ckpt"
                        selectedIndex={props?.ckpt_name?.findIndex((id) => id === iPConfig.ckpt_name)}
                        onChange={(e) => {
                          setIPConfig((p) => ({ ...p, [key]: e.target.value }));
                        }}
                      />
                    ) : (
                      <>
                        <Label {...{ size: 's' }} slot="label">
                          {key.replace(/\_/g, ' ').toLowerCase()}
                        </Label>
                        <Textfield
                          quiet={true}
                          className="w-3/4"
                          type="number"
                          value={iPConfig[key]}
                          onChange={(e) => {
                            setIPConfig((p) => ({ ...p, [key]: e.target.value }));
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
          </div>
          <MTextArea
            type="positive prompt"
            className="w-full mt-2"
            placeholder="Positive prompt..."
            value={iPConfig.text_positive}
            onChange={(e) => {
              setIPConfig((p) => ({ ...p, text_positive: e }));
            }}
          />
          <MTextArea
            type="negative prompt"
            className="w-full mb-2 mt-2"
            placeholder="Negative prompt..."
            value={iPConfig.text_negative}
            onChange={(e) => {
              setIPConfig((p) => ({ ...p, text_negative: e }));
            }}
          />
          <Button
            variant={`${props?.progress ? 'warning' : 'cta'}`}
            className="w-full rounded-md cursor-pointer exe-inpainting"
            disabled={props?.disabled}
            onClick={handleOnClick}
          >
            {props?.progress ? 'Cancel' : 'Generate'}
          </Button>
        </div>
      );
  }
  return <>{renderUI()}</>;
}
