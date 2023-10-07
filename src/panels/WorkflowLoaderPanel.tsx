import React, { useEffect, useRef, useState } from 'react';
import { STORAGE_WORKFLOWFOLDER } from '../utils/constant';
import DropDrownPicker from '../customcomponents/DropDownPicker';
import { Button, Label, Slider, Textfield } from '../components';
import { InterruptServer, fetchObjectInfo, sendWorkflowDataToServer } from '../utils/ServerUtils';
import { HeroIcons } from '../interfaces/HeroIcons';
import { BOUNDS } from '../utils/props';
import { PickImageDialog } from '../utils/Token';
import { copyImageToInputFolder } from '../utils/IOUtils';
import { saveSelectionToImage } from '../utils/BPUtils';
import MTextArea from '../customcomponents/MTextArea';
import { log } from '../utils/Log';
import { SeedWidget } from '../customcomponents/SeedWidget';

const fs = require('uxp').storage.localFileSystem;

type Props = {
  workflows?: any;
  bounds?: BOUNDS;
  isRunning?: boolean;
  showDialog?: (title: string, content: string) => Promise<any>;
  ioFolder?: any;
  uuid: string;
  progress: boolean;
};
enum STATE {
  enable,
  disable,
  interrupt,
}
type listItems = {
  id: number;
  sub_id: number;
  name: string;
  path?: string;
  item_index: number;
};
export namespace NODETYPE {
  //FLOAT,INT,STRING
  export type FLOAT = {
    default?: number;
    min?: number;
    max?: number;
    step?: number;
  };
  export type STRING = {
    default?: string;
    multiline?: boolean;
  };
  export type INT = {
    default?: number;
    min?: number;
    max?: number;
    step?: number;
  };
}
export default function WorkflowLoaderPanel(props: Props) {
  const [workflowFiles, setWorkflowFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [currentWFFile, setCurrentWFFile] = useState(null);
  const [WF, setWF] = useState<any>();
  const [cardInfo, setCardInfo] = useState({});
  const [showcard, setShowCard] = useState(-1);
  const [btnState, setBtnState] = useState<STATE>(STATE.disable);
  const [items, setItems] = useState<listItems[]>([]);
  const ImageLoaderNode = ['LoadImage', 'LoadResizeImageMask'];
  const SeedWidgetRef = useRef(null);

  async function loadWorkflowFiles(e: any) {
    console.log('loadWorkflow');
    if (!file) return;
    //!RESET ALL
    setShowCard(-1);
    setItems([]);
    setCardInfo(null);
    setWF(null);

    const folder = await fs.getEntryForPersistentToken(localStorage.getItem(STORAGE_WORKFLOWFOLDER));
    const f = await folder.getEntry(file);
    setCurrentWFFile(f);
    const content = await f.read();
    const _WF = JSON.parse(content);
    setWF(_WF);

    const promises = Object.keys(_WF).map(async (v, idx) => {
      const _class_type = _WF?.[v]?.class_type;
      const result = await fetchObjectInfo(_class_type);
      let contents = result[_class_type]['input']['required'];
      const optional = result[_class_type]['input']['optional'];
      if (optional !== undefined) {
        contents = { ...contents, ...optional };
      }
      return { key: _class_type, value: contents };
    });

    const infoArray = await Promise.all(promises);
    const infoObject = infoArray.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});

    setCardInfo(infoObject);
    setBtnState(STATE.enable);
  }

  useEffect(() => {
    props?.workflows?.getEntries().then((result) => {
      setWorkflowFiles(result.map((v: any) => v.name));
    });
  }, [props.workflows]);

  function findNode(node_key: string, object: object) {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const element = object[key];
        if (key === node_key) {
          return element;
        }
      }
    }
    return null;
  }

  const input_type = [
    'MODEL',
    'INT',
    'FLOAT',
    'CONDITIONING',
    'LATENT',
    'STRING',
    'CLIP',
    'VAE',
    'IMAGE',
    'MASK',
    'CLIP_VISION',
    'STYLE_MODEL',
    'CLIP_VISION_OUTPUT',
    'CONTROL_NET',
    'GLIGEN',
    'UPSCALE_MODEL',
    'BOOLEAN',
    'COLOR',
    '*',
  ];

  async function loadDefaultValue(index: number, child_index: number, card_item_content: string, _items: string[], isImage: boolean) {
    {
      let content = {};
      if (isImage) {
        const result = await props?.ioFolder?.input?.getEntry(card_item_content);
        const path = result?.nativePath?.substring(0, result?.nativePath?.lastIndexOf('\\'));
        content = {
          id: index,
          sub_id: child_index,
          path: path,
          name: card_item_content,
          item_index: _items.findIndex((o) => o == card_item_content),
        };
      } else {
        content = {
          id: index,
          sub_id: child_index,
          path: null,
          name: card_item_content,
          item_index: _items.findIndex((i) => i == card_item_content),
        };
      }

      if (items.findIndex((e) => e.id == index && e.sub_id == child_index) < 0) {
        setItems((p: any) => [...p, content]);
      }
    }
  }
  async function changeValueDropDown(index: number, child_index: number, file_name: string, _items: string[]) {
    const parentdir = items[items.findIndex((e) => e.id == index && e.sub_id == child_index)].path;
    let newData = [...items];
    newData[items.findIndex((i) => i.id == index && i.sub_id == child_index)] = {
      id: index,
      sub_id: child_index,
      path: parentdir,
      name: file_name,
      item_index: _items.findIndex((o) => o == file_name),
    };
    setItems(newData);
  }

  function isImageDropdown(card_title, card_item_object) {
    if (!card_item_object || card_item_object?.length < 2) return false;
    return ImageLoaderNode.includes(card_title) && card_item_object[1]?.image_upload != null;
  }

  const otherNode = (card_item_object: any, card_item_name: string, card_item_content: string, keyname: string, value: string) => {
    switch (card_item_object[0]) {
      case 'FLOAT':
        const dt_f: NODETYPE.FLOAT = card_item_object[1];
        return (
          <div className={`flex flex-row px-2 my-1  w-full}`}>
            <Slider
              className="w-full"
              min={dt_f.min}
              max={dt_f.max}
              step={dt_f.step}
              value={dt_f.default}
              onChange={(e) => {
                handleInputChange(keyname, value, e.target.value);
              }}
            >
              <Label slot="label">{card_item_name}</Label>
            </Slider>
          </div>
        );

      case 'STRING':
        const dt_str: NODETYPE.STRING = card_item_object[1];
        return (
          <div className={`flex flex-row px-2 my-1  w-full}`}>
            {dt_str?.multiline ? (
              <MTextArea
                type={card_item_name}
                className="w-full mb-2"
                value={card_item_content}
                onChange={(e) => {
                  handleInputChange(keyname, value, e);
                }}
              />
            ) : (
              <>
                <Label className="grow w-1/2">{card_item_name}</Label>
                <Textfield
                  quiet={true}
                  className="w-1/2"
                  value={card_item_content}
                  onChange={(e) => {
                    handleInputChange(keyname, value, e.target.value);
                  }}
                />
              </>
            )}
          </div>
        );

      case 'INT':
        const dt_i: NODETYPE.FLOAT = card_item_object[1];
        return (
          <div className={`flex flex-row px-2 my-1  w-full}`}>
            {card_item_name === 'seed' ? (
              <SeedWidget
                ref={SeedWidgetRef}
                title={card_item_name}
                value={card_item_content}
                onChange={(e) => {
                  console.log(e);
                  handleInputChange(keyname, value, e);
                }}
              />
            ) : (
              <Slider
                className="w-full"
                min={dt_i.min}
                max={dt_i.max}
                value={dt_i.default}
                onChange={(e) => {
                  handleInputChange(keyname, value, e.target.value);
                }}
                showValue={true}
              >
                <Label slot="label">{card_item_name}</Label>
              </Slider>
            )}
          </div>
        );

      default:
        return (
          <div className={`flex flex-row px-2 my-1  w-full}`}>
            <Label className="grow w-1/2">{card_item_name}</Label>
            <Textfield
              quiet={true}
              className="w-1/2"
              value={card_item_content}
              onChange={(e) => {
                handleInputChange(keyname, value, e.target.value);
              }}
            />
          </div>
        );
    }
  };
  const renderCard = () => {
    return Object.keys(WF).map((keyname, index) => {
      const card_title = WF[keyname].class_type;
      const title = WF[keyname].title;
      const card_element = findNode(card_title, cardInfo);
      const obb = Object.keys(WF[keyname].inputs).filter((_v, _i) => typeof WF[keyname].inputs[_v] !== 'object');
      if (obb.length <= 0) return null;
      return (
        <div className="w-full" key={index}>
          {
            <div className="content-card box-bg p-2 mb-2">
              {/* this is parent. do something */}
              <div className="w-full text-white acc-title text-sm cursor-pointer flex flex-row content-between">
                <div
                  className="grow"
                  onClick={(e) => {
                    setShowCard(showcard == index ? -1 : index);
                  }}
                >
                  {title ? title : card_title}
                </div>
              </div>

              {/* this is content */}
              <div className={`${showcard == index ? 'block' : 'hidden'}`}>
                {Object.keys(WF[keyname].inputs).map((value, child_index) => {
                  const card_item_name = value;
                  const card_item_content = WF[keyname].inputs[value];
                  const card_item_object = findNode(card_item_name, card_element);
                  const is_image_dropdown = isImageDropdown(card_title, card_item_object);

                  if (!card_item_object) return;
                  loadDefaultValue(index, child_index, card_item_content, card_item_object[0], is_image_dropdown);

                  if (typeof card_item_content !== 'object') {
                    return (
                      <div key={child_index}>
                        {Array.isArray(card_item_object[0]) ? (
                          <div className="flex flex-col">
                            {items[items?.findIndex((e) => e.id == index && e.sub_id == child_index)]?.path && (
                              <div className="flex flex-col imageview">
                                <div className="my-2 rounded-xl overflow-hidden w-40 h-40 align-middle self-center relative">
                                  <img
                                    className="object-contain w-full absolute"
                                    src={
                                      items &&
                                      `file:\\\\${items[items?.findIndex((e) => e.id == index && e.sub_id == child_index)]?.path}\\${
                                        items[items?.findIndex((e) => e.id == index && e.sub_id == child_index)]?.name
                                      }`
                                    }
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex flex-row justify-between flex-nowrap items-end">
                              <DropDrownPicker
                                horizontalmode={false}
                                selectedIndex={items[items.findIndex((e) => e.id == index && e.sub_id == child_index)]?.item_index || 0}
                                overrideClass="grow"
                                title={card_item_name}
                                items={card_item_object[0]}
                                onChange={(e) => {
                                  changeValueDropDown(index, child_index, e.target.value, card_item_object[0]);
                                  handleInputChange(keyname, value, e.target.value);
                                }}
                              />
                              {isImageDropdown(card_title, card_item_object) && (
                                <div className="flex">
                                  <HeroIcons
                                    className="mx-2"
                                    which="loadimage"
                                    onClick={(e) => {
                                      PickImageDialog().then((result) => {
                                        const path = items[items.findIndex((e) => e.id == index && e.sub_id == child_index)].path;
                                        copyImageToInputFolder(result.nativePath, path).then((result: string) => {
                                          card_item_object[0].push(result);
                                          changeValueDropDown(index, child_index, result, card_item_object[0]);
                                          handleInputChange(keyname, value, result);
                                        });
                                      });
                                    }}
                                  />
                                  <HeroIcons
                                    disable={props?.bounds?.left == 0 && props?.bounds?.right == 0 ? true : false}
                                    which="selection"
                                    onClick={(e) => {
                                      props?.showDialog('Crop this', 'Saving cropped selection as input image').then((ok) => {
                                        if (ok) {
                                          saveSelectionToImage(props?.bounds, props?.ioFolder).then((result) => {
                                            if (result) {
                                              card_item_object[0].push(result);
                                              changeValueDropDown(index, child_index, result, card_item_object[0]);
                                              handleInputChange(keyname, value, result);
                                            }
                                          });
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          otherNode(card_item_object, card_item_name, card_item_content, keyname, value)
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          }
        </div>
      );
    });
  };
  const handleInputChange = (keyname: string, subkey: string, newValue: string | number) => {
    if (WF) {
      setWF((prevWf: any) => ({
        ...prevWf,
        [keyname]: {
          ...prevWf[keyname],
          inputs: {
            ...prevWf[keyname].inputs,
            [subkey]: newValue,
          },
        },
      }));
    }
  };
  function handleGenerateClick(e: globalThis.Event) {
    if (props?.progress) {
      InterruptServer();
    }

    sendWorkflowDataToServer(WF, props.uuid);
    if (currentWFFile) {
      currentWFFile
        .write(JSON.stringify(WF, null, 2))
        .then((result) => console.log(result))
        .catch((e) => console.log(e));
    }
    SeedWidgetRef?.current?.updateSeed();
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-column">
        <DropDrownPicker
          overrideClass="w-full mr-2"
          items={workflowFiles || ['']}
          horizontalmode={false}
          selectedIndex={0}
          onChange={(e) => {
            setFile(e.target.value);
          }}
        />
        <Button variant="cta" className="rounded-md cursor-pointer" onClick={loadWorkflowFiles}>
          Load
        </Button>
      </div>
      <div className="content mt-2">{WF && cardInfo && renderCard()}</div>
      <Button
        variant={`${props?.progress ? 'warning' : 'cta'}`}
        disabled={btnState == STATE.disable}
        className="rounded-md"
        onClick={handleGenerateClick}
      >
        Generate
      </Button>
    </div>
  );
}
