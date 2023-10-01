import React, { useState, useEffect } from 'react';
import { Slider } from '../components';
import { MapRange } from '../utils/StringUtils';

type Props = {
  assignValue: (value: { l: number; r: number }) => void;
  className?: string;
};
export default function ColorSlider(props: Props) {
  const [lValue, setLValue] = useState(0);
  const [rValue, setRValue] = useState(0);
  const [first, setFirst] = useState(true);

  useEffect(() => {
    if (first) {
      setFirst(false);
      return;
    }
    props?.assignValue({
      l: Math.floor(MapRange(lValue, 0, 100, 0, 4096)),
      r: Math.floor(MapRange(rValue, 0, 100, 0, 4096)),
    });
  }, [lValue, rValue]);
  return (
    <div className={`w-full flex flex-col ${props?.className}`}>
      <Slider
        onChange={(e) => {
          setLValue(e.target.value);
        }}
        min={0}
        max={100}
        value={50}
      />
      <Slider
        onChange={(e) => {
          setRValue(e.target.value);
        }}
        min={0}
        max={100}
        value={50}
      />
    </div>
  );
}
