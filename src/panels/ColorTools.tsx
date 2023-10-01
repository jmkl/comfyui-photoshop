import React, { useEffect, useState } from 'react';
import { STORAGE_COLORS, STORAGE_TRICOLOR } from '../utils/constant';
import { Button, Textarea } from '../components';
import ColorSlider from '../customcomponents/ColorSlider';
type Props = {};
import ColorSort from '../utils/ColorSort';
import { ApplyColor } from '../utils/PhotoshopUtils';

export default function ColorTools(prop: Props) {
  const [colors, setColors] = useState<string[]>(JSON.parse(localStorage.getItem(STORAGE_COLORS)) || []);
  const [tempcolor, settempcolor] = useState('');
  const [importColor, setImportColor] = useState(false);
  const [TRIColor, setTRIColor] = useState(JSON.parse(localStorage.getItem(STORAGE_TRICOLOR)) || ['fff', 'fff', 'fff']);
  const [colRange, setColRange] = useState(null);
  const colpattern = /(?:[0-9a-fA-F]{3}){1,2}/gm;
  const color_sort = new ColorSort();
  useEffect(() => {
    if (TRIColor != null && colRange != null) ApplyColor(TRIColor, [colRange.l, colRange.r]);
  }, [TRIColor, colRange]);

  return (
    <div className="w-full flex flex-wrap flex-row">
      {importColor && <Textarea className="w-full" quiet={true} onInput={(e) => settempcolor(e.target.value)} />}
      <div
        className="acc-title !text-title text-yellow-300  w-full p-1 text-right cursor-pointer"
        onClick={(e) => {
          if (importColor) {
            setImportColor(false);
            let _tcols = colors;
            const allcolors: string[] = tempcolor.match(colpattern);
            if (!allcolors) return;
            _tcols.push(...allcolors);
            const trim_cols = Array.from(new Set(_tcols.map((e) => e.toLowerCase())));
            localStorage.setItem(STORAGE_COLORS, JSON.stringify(trim_cols));
            setColors(trim_cols);
          } else {
            setImportColor(true);
          }
        }}
      >
        {importColor ? 'Save' : 'Import'}
      </div>
      <ColorSlider
        className="mb-2"
        assignValue={(value) => {
          setColRange(value);
        }}
      />
      <div className="w-full flex flex-wrap flex-row items-start">
        <div className="w-2/3 flex flex-wrap flex-row">
          {color_sort.sort(colors)?.map((value, index) => {
            return (
              <div
                key={index}
                onContextMenu={(e) => {
                  const _col = [...colors];
                  const index = _col.findIndex((x) => x == value);
                  _col.splice(index, 1);
                  setColors(_col);
                  localStorage.setItem(STORAGE_COLORS, JSON.stringify(_col));
                }}
                onClick={(e) => {
                  let whichindex = 0;
                  if (e.shiftKey) whichindex = 1;
                  else {
                    if (e.altKey) whichindex = 2;
                    else whichindex = 0;
                  }
                  const _col = [...TRIColor];
                  _col[whichindex] = value;
                  setTRIColor(_col);
                  localStorage.setItem(STORAGE_TRICOLOR, JSON.stringify(_col));
                }}
                style={{ backgroundColor: `#${value}` }}
                className={'w-5 h-5 cursor-pointer hover:border-4 hover:border-white'}
              />
            );
          })}
        </div>
        <div className="w-1/3 flex flex-col flex-wrap">
          {['top', 'mid', 'bot'].map((value, index) => {
            return <div key={index} style={{ backgroundColor: `#${TRIColor[index]}` }} className={`w-full h-5`}></div>;
          })}
        </div>
      </div>
    </div>
  );
}
