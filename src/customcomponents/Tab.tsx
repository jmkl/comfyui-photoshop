import React, { useState } from 'react';

type Props = {
  content: { title: string; content: React.ReactNode }[];
  isComfy?: (e: boolean) => void;
};
export const Tab: React.FC<Props> = ({ content, isComfy }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  function handleClick(index: number) {
    setActiveIndex(index);
    isComfy(content[index].title.toLowerCase().includes('comfyui'));
  }
  return (
    <div className="w-full p-0 m-0">
      <div className="flex flex-row justify-start tab-main sticky bg-box-main-bg w-full">
        {content.map((value, index) => {
          return (
            <p
              key={index}
              className={`px-2 py-1 cursor-pointer text-white hover:text-yellow-300 hover:bg-box-child ${
                activeIndex === index ? 'bg-box-root' : ''
              }`}
              onClick={() => handleClick(index)}
            >
              {value.title}
            </p>
          );
        })}
      </div>

      {content.map((value, index) => {
        return (
          <div key={index} className={`w-full mt-6  text-white ${activeIndex === index ? '' : 'hidden'}`}>
            {value.content}
          </div>
        );
      })}
    </div>
  );
};
