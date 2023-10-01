import React, { useState, useEffect } from 'react';
import { Button, Checkbox } from '../components';
import { HeroIcons } from '../interfaces/HeroIcons';

type Props = {
  onSendWhatsAppMessage?: (e: string) => void;
  className?: string;
};

export default function WhatsAppPanel(props: Props) {
  const url = 'http://localhost:3000';
  let [chat, setChat] = useState([]);

  function setCheck(id, check) {
    fetch(`${url}/check/${id}/${check}`)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((result) => {
        setChat(result);
      });
  }
  function deleteMessage(id) {
    fetch(`${url}/done/${id}`)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((result) => {
        setChat(result);
      });
  }
  function deleteSelected() {
    let d = [];
    for (const c of chat) {
      if (c.checked) {
        d.push(c._id);
      }
    }
    fetch(url + `/deleteselected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(d),
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((result) => {
        setChat(result);
      });
  }
  function reloadWhatsApp() {
    fetch(`${url}/todolist`)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((result) => {
        setChat(result);
      });
  }
  useEffect(() => {
    fetch(`${url}/todolist`)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((result) => {
        setChat(result);
      });
  }, []);
  return (
    <div className={'w-full flex flex-col ' + props?.className}>
      <div className="w-full flex flex-row justify-end mb-2">
        <HeroIcons which="reload" className="px-2" onClick={reloadWhatsApp} />
        <HeroIcons which="delete" className="px-2" onClick={deleteSelected} />
      </div>
      {chat &&
        chat.map((value, index) => {
          return (
            <div
              key={index}
              onContextMenu={(e) => {
                setCheck(value._id, !value.checked);
              }}
              onClick={() => props?.onSendWhatsAppMessage(value.text)}
              className={
                'w-full flex flex-row active:bg-green-900 p-2  hover:bg-box-child cursor-pointer ' +
                `${value.checked ? 'bg-green-900 hover:bg-green-800' : 'bg-box-root'} ${index > 0 ? 'mt-2' : ''}`
              }
            >
              <div className="text-white text-xs">{value.text}</div>
              <HeroIcons
                which="x"
                onClick={(e) => {
                  deleteMessage(value._id);
                }}
              />
            </div>
          );
        })}
    </div>
  );
}
