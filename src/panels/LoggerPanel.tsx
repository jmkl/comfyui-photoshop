import React, { useEffect, useState } from 'react';
import { HeroIcons } from '../interfaces/HeroIcons';

type LogProps = {
  log_message?: string[];
  logger?: any;
};

type LogContent = {
  copied: boolean;
  content: string;
};

export default function LoggerPanel(props: LogProps) {
  const [logContent, setLogContent] = useState(null);
  useEffect(() => {
    if (!props?.log_message) return;
    const result: LogContent[] = props?.log_message.map((value, index) => {
      return {
        copied: false,
        content: value,
      };
    });
    setLogContent(result);
  }, [props?.log_message]);

  function handleClick(index: number) {
    const updatedLogContent = [...logContent];
    updatedLogContent[index].copied = updatedLogContent[index]?.copied ? false : true;
    setLogContent(updatedLogContent);
  }
  return (
    <>
      {props?.log_message && (
        <div className="w-full">
          <div className="flex flex-row right-5 sticky">
            <HeroIcons
              parentClassName="w-auto"
              which="save"
              onClick={() => {
                const result = logContent
                  .filter((e) => e.copied)
                  .map((e) => e.content)
                  .join('\n');
                //@ts-ignore
                navigator?.clipboard?.setContent({ 'text/plain': result });
              }}
            />
            <HeroIcons
              parentClassName="w-auto"
              which="x"
              onClick={() => {
                props?.logger('', true);
              }}
            />
          </div>
          <div className="w-full cursor-pointer">
            {logContent &&
              logContent.map((value: LogContent, index: number) => {
                return (
                  <div
                    onClick={(ee) => {
                      handleClick(index);
                    }}
                    className={`text-sm border-b border-box-root w-full ${value.copied ? 'text-yellow-400' : 'text-white'}`}
                    key={index}
                  >
                    {value.content}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}
