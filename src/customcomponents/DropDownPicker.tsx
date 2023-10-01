import React, { useEffect, useState } from 'react';
import { Dropdown, Label } from '../components';
import Menu from '../components/Menu';
import MenuItem from '../components/MenuItem';
export interface DropdownEvent extends globalThis.Event {
  readonly target: (EventTarget & { selectedIndex: number; value: string; className: string }) | null;
}
type Props = {
  onChange?: (e: DropdownEvent) => void;
  items?: string[];
  title?: string;
  selectedIndex: number;
  DDWidth?: string;
  overrideClass?: string;
  which?: 'facerestoremodel' | 'upscalemodel' | 'method';
  horizontalmode?: boolean;
};

export default function DropDrownPicker(props: Props) {
  const [hastitle, sethastitle] = useState(false);
  useEffect(() => {
    if (props.title != null) sethastitle(true);
  }, [props.title]);
  return (
    <div className={`${props?.overrideClass ? props?.overrideClass : 'w-full'} flex ${props?.horizontalmode ? 'flex-row' : 'flex-col'}`}>
      {hastitle && (
        <Label slot="label" className={`${props?.overrideClass ? '' : 'grow'}`}>
          {props?.title}
        </Label>
      )}
      <Dropdown
        placeholder={props?.items[props?.selectedIndex]}
        size="S"
        selectedIndex={props?.selectedIndex}
        className={`${props?.which} ${props?.horizontalmode ? (props?.DDWidth ? props?.DDWidth : 'w-3/4') : 'w-full'}`}
        onChange={props?.onChange}
      >
        <Menu size="S" slot="options">
          {props?.items.length > 0 &&
            props?.items.map((value, index) => {
              return (
                <MenuItem size="S" key={index} selected={props.selectedIndex == index}>
                  {value}
                </MenuItem>
              );
            })}
        </Menu>
      </Dropdown>
    </div>
  );
}
