import React, { useState } from 'react';

const TEXTMODE = ['text-white', 'text-yellow-400', 'text-green-400', 'text-gray-600'];

type Props = {
  text?: string;
  curMode?: number;
  setMode?: (e: number) => void;
};

export function MSpan(props: Props) {
  const [TMode, setTMode] = useState(props?.curMode | 0);
  function handleClick(e) {
    let mode = TMode;
    if (TMode >= TEXTMODE.length - 1) mode = 0;
    else mode = TMode + 1;

    setTMode(mode);
    props?.setMode(mode);
  }
  return (
    <span
      className={`border-b border-gray-500 text-sm w-full cursor-pointer ${TEXTMODE[TMode]}`}
      onContextMenu={() => {
        setTMode(0);
        props?.setMode(0);
      }}
      onClick={handleClick}
    >
      {props?.text}
    </span>
  );
}
