import React from 'react';
import { Body, Heading, Button } from '../components';
type Props = {
  title?: string;
  content?: string;
  dialogref?: any;
};
export default function ModalDialog(props: Props) {
  function handleClick(e: any) {
    const result = e.target.className.includes('ok');
    props?.dialogref?.current?.close(result ? true : false);
  }
  return (
    <dialog className="wi" ref={props?.dialogref}>
      <div className="flex flex-col w-100 p-2">
        <Heading size="S" className="m-2">
          {props?.title}
        </Heading>
        <Body size="S" className="m-2">
          {props?.content}
        </Body>
        <footer>
          <Button className="mx-2 ok rounded-md" onClick={handleClick}>
            Ok
          </Button>
          <Button className="mx-2 rounded-md" variant="warning" onClick={handleClick}>
            Cancel
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
