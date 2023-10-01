import React, { useEffect, useState } from 'react';
import DropDrownPicker, { DropdownEvent } from '../customcomponents/DropDownPicker';
import Spectrum, { ActionButton, Button, Checkbox } from '../components';

import { BOUNDS } from '../utils/props';
import { executeFaceRestore } from '../utils/BPUtils';
import { STORAGE_FACERESTORECONFIG } from '../utils/constant';
type Props = {
  facerestoremodel?: string[];
  upscalemodel?: string[];
  method?: string[];
  ioFolder?: any;
  bounds?: BOUNDS;
  uuid: string;
  setBound?: (bound: BOUNDS) => void;
};

export type FRCONFIG = {
  facerestore_model: string;
  method: string;
  upscale_model: string;
  upscale_only: boolean;
  restore_only: boolean;
  centerface_only: boolean;
};

export const defConfig = {
  facerestore_model: 'CodeFormer.pth',
  method: 'ScaleRestore',
  upscale_model: 'RealESRGAN_x2plus.pth',
  upscale_only: false,
  restore_only: false,
  centerface_only: false,
};

export default function FaceRestorePanel(props: Props) {
  const [FRConfig, setFRConfig] = useState<FRCONFIG>(JSON.parse(localStorage.getItem(STORAGE_FACERESTORECONFIG)) || defConfig);
  const [selection, setSelection] = useState(false);

  useEffect(() => {
    setSelection(props?.bounds?.left == 0 && props?.bounds?.right == 0);
  }, [props?.setBound]);
  function checkBoxChange(e: any) {
    const text = e.target.textContent;
    switch (true) {
      case text.includes('Restore'):
        setFRConfig((p) => ({ ...p, restore_only: e.target.checked }));

        break;
      case text.includes('Upscale'):
        setFRConfig((p) => ({ ...p, upscale_only: e.target.checked }));

        break;
      case text.includes('Center Face'):
        setFRConfig((p) => ({ ...p, centerface_only: e.target.checked }));

        break;
    }
  }
  function handleChange(e: DropdownEvent) {
    const cls = e.target.className;
    switch (true) {
      case cls.includes('facerestoremodel'):
        setFRConfig((p) => ({ ...p, facerestore_model: e.target.value }));

        break;
      case cls.includes('upscalemodel'):
        setFRConfig((p) => ({ ...p, upscale_model: e.target.value }));

        break;
      case cls.includes('method'):
        setFRConfig((p) => ({ ...p, method: e.target.value }));

        break;
    }
  }

  function handleButtonClick(e: any, type: string) {
    executeFaceRestore(type, props?.ioFolder, FRConfig, props.uuid);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_FACERESTORECONFIG, JSON.stringify(FRConfig));
  }, [FRConfig]);

  return (
    <>
      {FRConfig && (
        <div>
          <DropDrownPicker
            title="Facerestore Model"
            which="facerestoremodel"
            selectedIndex={props?.facerestoremodel?.findIndex((id) => id === FRConfig?.facerestore_model)}
            items={props?.facerestoremodel}
            onChange={handleChange}
          />
          <DropDrownPicker
            title="Upscale Model"
            which="upscalemodel"
            selectedIndex={props?.upscalemodel?.findIndex((id) => id === FRConfig?.upscale_model)}
            items={props?.upscalemodel}
            onChange={handleChange}
          />
          <DropDrownPicker
            title="Method"
            which="method"
            selectedIndex={props?.method?.findIndex((id) => id === FRConfig?.method)}
            items={props?.method}
            onChange={handleChange}
          />
          <div className="flex flex-row items-stretch justify-evenly my-2">
            <Checkbox disabled={FRConfig?.upscale_only ? true : false} checked={FRConfig?.restore_only} onChange={checkBoxChange}>
              Restore
            </Checkbox>
            <Checkbox disabled={FRConfig?.restore_only ? true : false} checked={FRConfig?.upscale_only} onChange={checkBoxChange}>
              Upscale
            </Checkbox>
            <Checkbox checked={FRConfig?.centerface_only} onChange={checkBoxChange}>
              Center Face
            </Checkbox>
          </div>
          <div className="flex flex-row justify-evenly">
            <Button
              variant="cta"
              onClick={(e) => {
                handleButtonClick(e, 'all');
              }}
              className="w-1/2 cursor-pointer mx-2 rounded-md"
            >
              Selected Layer
            </Button>
            <Button
              variant="cta"
              disabled={selection}
              onClick={(e) => {
                handleButtonClick(e, 'selected');
              }}
              className="w-1/2 cursor-pointer mx-2 rounded-md"
            >
              Selection Only
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
