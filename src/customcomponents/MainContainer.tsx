import React from 'react';
type Props = {
  children?: React.ReactNode;
  className?: string;
};
export default function MainContainer(props: Props) {
  return <div className={`flex flex-col w-full ${props?.className}`}>{props?.children}</div>;
}
