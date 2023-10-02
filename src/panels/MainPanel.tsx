import React, { useEffect, useState, useRef } from 'react';
import '../index.css';
import FaceRestorePanel from './FaceRestorePanel';
import { executed, executing, fetchObjectInfo, output_images, progress, status } from '../utils/ServerUtils';
import { BOUNDS, CUSTOMSCRIPT, InlineDialogContent, facerestoreProps } from '../utils/props';
import ModalDialog from '../customcomponents/Dialog';
import { GetTokenFor, COMFYFOLDER, PickFolderFor, WORKFLOWFOLER, TEXTTOOLFOLDER } from '../utils/Token';
import { action, app, core, imaging } from 'photoshop';
import { ActionDescriptor } from 'photoshop/dom/CoreModules';
import useWebSocket from 'react-use-websocket';
import { placeImageOnCanvas } from '../utils/BPUtils';
import InpaintingPanel, { ksamplerProps } from './InpaintingPanel';
import ImageGenerator from './ImageGenerator';
import { _arrayBufferToBase64 } from '../utils/ImageUtils';
import MainContainer from '../customcomponents/MainContainer';
import WorkflowLoaderPanel from './WorkflowLoaderPanel';
import { server_type } from '../utils/ServerUtils';
import { copyImageToInputFolder } from '../utils/IOUtils';
import { v4 as uuidv4 } from 'uuid';
import PSUtilityPanel from './PSUtilityPanel';
import { IsApplied, executeCustomScripts } from '../utils/PhotoshopUtils';
import Accordion from '../customcomponents/Accordion';
import WhatsAppPanel from './WhatsAppPanel';
import ImagePanel from './ImagePanel';
import { HeroIcons } from '../interfaces/HeroIcons';
import { Button } from '../components';
const nodefs = require('fs');
const WS = (url: string, callback) => {
  return useWebSocket(url, {
    onOpen: () => callback(true),
    onClose: () => callback(false),
    shouldReconnect: (closeEvent) => {
      return true;
    },
  });
};

export const MainPanel: React.FC = () => {
  const config = 'plugin-data:/plugin_config.json';
  const [comfyUIOnly, setComfyUIOnly] = useState(true);
  const [loadingContent, setLoadingContent] = useState<InlineDialogContent>({
    show: false,
    title: 'some title',
    message: 'this is the default message that will show when you make the loading screen appears. cheers!!!',
  });
  const [showUILoader, setShowUILoader] = useState(false);
  const [faceRestoreProps, setFaceRestoreProps] = useState<facerestoreProps>(null);
  const [ksamplerProps, setKsamplerProps] = useState<ksamplerProps>(null);
  const [ckptProps, setCkptProps] = useState<[]>();
  const [dialogContent, setDialogContent] = useState({ title: 'Title', content: 'Content...' });
  const modalDialog = useRef<any>();
  const [IOFolder, setIOFolder] = useState(null);
  const [workflows, setWorkflows] = useState(null);
  const [bounds, setBounds] = useState<BOUNDS>({ left: 0, top: 0, right: 0, bottom: 0 });
  const [sOpen, setSOpen] = useState(false);
  const [logs, setLogs] = useState('');
  const [status, setStatus] = useState(false);
  const [selectLayer, setSelectLayer] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState(['./icons/preview.png']);
  const [queue, setQueue] = useState(0);
  const [process, setProcess] = useState(0);
  const [uuid, setUuid] = useState(uuidv4());
  const [counter, setCounter] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [WAText, setWAText] = useState(null);
  const [customScripts, setCustomScripts] = useState<CUSTOMSCRIPT[]>(null);
  const [AIOServerStatus, setAIOServerStatus] = useState();
  const aio_server = WS('ws://localhost:7898/Server', (result) => {
    console.log('aio_server', result);
  });
  const comfyui_server = WS('ws://127.0.0.1:8188/ws?clientId=' + uuid, (result) => {
    setSOpen(result);
  });
  // const socketUrl = 'ws://127.0.0.1:8188/ws?clientId=' + uuid;
  // const { sendMessage, sendJsonMessage, lastMessage, lastJsonMessage, readyState, getWebSocket } = useWebSocket(socketUrl, {
  //   onOpen: () => setSOpen(true),
  //   onClose: () => setSOpen(false),
  //   shouldReconnect: (closeEvent) => {
  //     return true;
  //   },
  // });

  function writeDefault() {
    nodefs.writeFileSync(config, JSON.stringify({ comfyui_only: true }), { encoding: 'utf-8' });
    location.reload();
  }
  function loadConfig() {
    try {
      const stat = nodefs.lstatSync(config);
      if (!stat.isFile()) writeDefault();
      const conf = JSON.parse(nodefs.readFileSync(config, { encoding: 'utf-8' }));
      setComfyUIOnly(conf.comfyui_only);
    } catch (error) {
      writeDefault();
    }
  }
  function fetchModels() {
    fetchObjectInfo('FaceRestore').then((result) => setFaceRestoreProps(result?.FaceRestore?.input?.required));
    fetchObjectInfo('KSampler').then((result) => {
      setKsamplerProps(result?.KSampler?.input?.required);
    });
    fetchObjectInfo('CheckpointLoaderSimple').then((result) => setCkptProps(result?.CheckpointLoaderSimple?.input?.required?.ckpt_name[0]));
  }

  async function showDialog(title: string, content: string) {
    return new Promise(async (resolve, reject) => {
      HandleUIDialog({
        show: true,
        title: title,
        message: content,
        onOk: async () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
    // return new Promise(async (resolve, reject) => {
    //   setDialogContent({ title: title, content: content });
    //   const result = await modalDialog?.current?.uxpShowModal({ title: 'ComfyPSD', size: { width: 360, height: 300 } });
    //   resolve(result);
    // });
  }

  //!UNUSED
  function getAllKeys(obj: any): any {
    const keys: any = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key) && key === 'to') {
        const data = obj[key];
        if (data.hasOwnProperty('left'))
          keys.push({
            left: data.left._value,
            bottom: data.bottom._value,
            right: data.right._value,
            top: data.top._value,
          });

        if (typeof obj[key] === 'object') {
          keys.push(...getAllKeys(obj[key]));
        }
      }
    }

    return keys;
  }
  useEffect(() => {}, [selectLayer]);
  async function selectionCheck(event: string, descriptor: ActionDescriptor) {
    if (event == 'select') {
      setSelectLayer(descriptor);
      // IsApplied(descriptor.layerID[0]).then((result: any[]) => {});
      await core
        .executeAsModal(
          async () => {
            const _img = await imaging.getSelection({ documentID: app.activeDocument.id });
            setBounds(_img.sourceBounds);
          },
          { commandName: 'selection ' }
        )
        .catch((e) => console.log(e));
    }
    if (event == 'set') {
      console.log(descriptor?.to?._obj);

      // IsApplied(descriptor.layerID[0]).then((result: any[]) => {});

      if (descriptor?.to?._obj) {
        const o = descriptor?.to;
        const b: BOUNDS = { top: o.top, left: o.left, right: o.right, bottom: o.bottom };
        setBounds(b);
      } else {
        setBounds({ top: 0, left: 0, right: 0, bottom: 0 });
      }
    }
  }
  function photoshopActionListener(event: string, descriptor: ActionDescriptor) {
    if (event == 'set' || event == 'select') {
      setCounter((e) => e + 1);
      selectionCheck(event, descriptor);
    }
  }

  const [thumbRoot, setThumbRoot] = useState(null);

  async function fetchFolderToken() {
    try {
      const _comfy: any = await GetTokenFor(COMFYFOLDER);
      const input = await _comfy?.getEntry('input');
      const output = await _comfy?.getEntry('output');
      setIOFolder({ input: input, output: output });
      await copyImageToInputFolder('plugin:/icons/default.png', input.nativePath, 'default.png');
    } catch (error) {
      const _comfyfolder = await showDialog('ComfyUI Folder', 'Pick comfyui Folder');
      if (_comfyfolder) await PickFolderFor(COMFYFOLDER);
    }

    try {
      const _workflow = await GetTokenFor(WORKFLOWFOLER);
      setWorkflows(_workflow);
    } catch (error) {
      const _workflowfolder = await showDialog('Workflow Folder', 'Now Pick where u store the workflow.json files');
      if (_workflowfolder) await PickFolderFor(WORKFLOWFOLER);
    }
    try {
      const _root: any = await GetTokenFor(TEXTTOOLFOLDER);
      setThumbRoot(_root);
    } catch (error) {
      const _comfyfolder = await showDialog('Root Folder', 'Pick for root folder. thumbnail template, emblem, textures, etc.');
      if (_comfyfolder) await PickFolderFor(TEXTTOOLFOLDER);
      location.reload();
    }
  }

  //fetching models, comfyui folder tokens, photoshop action listener
  useEffect(() => {
    loadConfig();
    action.addNotificationListener(['set', 'select'], photoshopActionListener);
    fetchModels();
    fetchFolderToken();
    return () => {
      action.removeNotificationListener(['set', 'select'], photoshopActionListener);
    };
  }, []);
  useEffect(() => {}, [uuid]);

  //processing websocket messages
  useEffect(() => {
    const _bounds =
      bounds.left == 0 && bounds.right == 0
        ? { left: 0, top: 0, right: app?.activeDocument?.width, bottom: app?.activeDocument?.height }
        : bounds;

    if (!comfyui_server.lastJsonMessage) return;
    const obj: any = comfyui_server.lastJsonMessage;
    if (Object.keys(obj).length <= 0) return;
    const type = obj['type'];
    const data = obj['data'];

    setStatus(type === 'progress' || obj['data']?.status?.exec_info?.queue_remaining > 0 ? true : false);

    switch (true) {
      case type === server_type.status:
        const _status: status = obj;
        const queue = _status.data.status.exec_info.queue_remaining;
        setQueue(queue != null ? queue : 0);
        break;
      case type === server_type.progress:
        setStatus(true);
        const _obj: progress = obj;
        const progression = (_obj?.data?.value / _obj?.data?.max) * 100;
        setProcess(progression);
        break;
      case type === server_type.execution_start:
        setStatus(true);
        setLogs(type);
        break;
      case type === server_type.execution_cached:
        break;
      case type === server_type.executing:
        const _exeing: executing = obj;
        if (_exeing.data.node != null) {
          setLogs(type);
          setStatus(true);
        } else {
          setStatus(false);
        }

        break;
      case type === server_type.executed:
        setLogs('Done!');
        setStatus(false);
        setProcess(0);
        if (previewImage.length > 1) {
          setPreviewImage(previewImage.slice(-1));
        }
        const _done: executed = obj;
        const all_files: output_images[] = _done?.data?.output?.images;
        for (const files of all_files) {
          placeImageOnCanvas(files?.filename, IOFolder, _bounds, false);
        }

        break;
    }
  }, [comfyui_server.lastJsonMessage]);

  //processing preview image
  useEffect(() => {
    if (!comfyui_server.lastMessage) return;
    if (typeof comfyui_server.lastMessage.data === 'object') {
      _arrayBufferToBase64(comfyui_server.lastMessage.data.slice(8)).then((base64String) => {
        const to_src = `data:image/jpeg;base64, ${base64String}`;
        setPreviewImage((p) => [...p, to_src]);
      });
    }
  }, [comfyui_server.lastMessage]);

  const updateBounds = (newBounds: BOUNDS) => {
    setBounds(newBounds);
  };

  const photoshopUtilsData = [
    {
      title: 'Photoshop Utility',
      content: <PSUtilityPanel aioServer={aio_server} selectedLayer={selectLayer} receiveText={WAText} rootToken={thumbRoot} />,
    },
  ];

  //Accordion Lists ComfyUI
  const accordionData = [
    {
      title: 'Workflow Loader',
      content: (
        <WorkflowLoaderPanel
          uuid={uuid}
          progress={status}
          setDialogContent={setDialogContent}
          modalDialog={modalDialog}
          isRunning={status}
          bounds={bounds}
          ioFolder={IOFolder}
          workflows={workflows}
        />
      ),
    },
    {
      title: 'Face Restore',
      content: (
        <FaceRestorePanel
          uuid={uuid}
          ioFolder={IOFolder}
          bounds={bounds}
          setBound={updateBounds}
          facerestoremodel={faceRestoreProps?.facerestore_model[0] || ['']}
          upscalemodel={faceRestoreProps?.upscale_model[0] || ['']}
          method={faceRestoreProps?.method[0] || ['']}
        />
      ),
    },

    {
      title: 'Inpainting',
      content: (
        <InpaintingPanel
          progress={status}
          uuid={uuid}
          bounds={bounds}
          ioFolder={IOFolder}
          ksamplerProps={ksamplerProps}
          ckpt_name={ckptProps}
          disabled={bounds.left == 0 && bounds.right == 0}
          onClick={(e) => {}}
        />
      ),
    },
    {
      title: 'Image Generator',
      content: (
        <ImageGenerator
          uuid={uuid}
          progress={status}
          ckpt_models={ckptProps}
          upscale_model={faceRestoreProps?.upscale_model[0]}
          sampler={ksamplerProps?.sampler_name[0]}
          scedhuler={ksamplerProps?.scheduler[0]}
        />
      ),
    },
  ];
  async function loadCustomScripts(script_parent, script_names) {
    let all_scripts = [];
    for await (const script of script_names) {
      const file = await script_parent.getEntry(script);
      all_scripts.push(JSON.parse(await file.read()));
    }
    return all_scripts;
  }

  useEffect(() => {
    thumbRoot?.getEntry('customscripts').then(async (script_folder) => {
      const scripts = await script_folder?.getEntries();
      console.log(scripts);
      if (!scripts) return;
      const scrpts = await loadCustomScripts(
        script_folder,
        scripts.map((e) => e.name)
      );
      setCustomScripts(scrpts);
      console.log(scrpts);
    });
  }, [thumbRoot]);

  async function HandleUIDialog(content: InlineDialogContent, doThis?: () => Promise<any>) {
    setShowUILoader(true);
    setLoadingContent(() => content);
    if (doThis) {
      doThis().then(() => {
        setShowUILoader(false);
      });
    }
  }
  return (
    <>
      <div className={`${showUILoader ? '' : 'hidden'}`}>
        <div className="w-full flex flex-col p-4">
          <div className="acc-title text-white text-lg uppercase mb-2 mt-8">{loadingContent.title}</div>
          <div className="text-white">{loadingContent.message}</div>
        </div>
        {loadingContent.isloading === false ||
          (loadingContent.isloading === undefined && (
            <div className="flex flex-row justify-end">
              <Button
                variant="secondary"
                className="rounded-sm mr-2"
                onClick={() => {
                  loadingContent.onOk('do ok');
                  setShowUILoader(false);
                }}
              >
                Ok
              </Button>
              <Button
                variant="warning"
                className="rounded-sm"
                onClick={() => {
                  loadingContent.onCancel('do cancel');
                  setShowUILoader(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ))}
      </div>
      <MainContainer className={`${showUILoader ? 'hidden' : ''}`}>
        <ModalDialog title={dialogContent.title} content={dialogContent.content} dialogref={modalDialog} />
        <div className="flex flex-row w-full sticky top-0 bg-box-main-bg">
          {['TOOLS', 'COMFYUI', 'IMAGE', 'WHATSAPP'].map((value, index) => {
            return (
              <div
                key={index}
                className={
                  'text-white tab-main cursor-pointer hover:text-yellow-300  border-b-orange-50 px-2 py-1 ' +
                  `${activeTab === index ? `${index === 1 ? 'bg-red-600' : 'bg-box-root'}` : ''}`
                }
                onClick={(e) => setActiveTab(index)}
              >
                {value}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col w-full mt-4">
          <Accordion className={`${activeTab == 0 ? '' : 'hidden'}`} sections={photoshopUtilsData} root={true} />

          <div className={`${activeTab === 1 ? '' : 'hidden'}`}>
            <div className="text-white flex flex-row content-between w-full items-center z-10">
              <div style={{ width: `${process}%` }} className="loading bg-black h-full bg-opacity-50 absolute top-0 w-full"></div>

              <div className="w-full acc-title text-base bg-red-600 flex flex-row content-between p-2 align-middle pr-10 h-auto">
                <div className="text-white grow">{logs}</div>
                <div className="">on queue : {queue}</div>
              </div>
            </div>
            <Accordion sections={accordionData} />
          </div>

          <ImagePanel
            UIDialog={HandleUIDialog}
            className={`${activeTab == 2 ? '' : 'hidden'}`}
            rootToken={thumbRoot}
            aioServer={aio_server}
          />

          <WhatsAppPanel
            className={`${activeTab == 3 ? '' : 'hidden'}`}
            onSendWhatsAppMessage={(text) => {
              setWAText(text);
            }}
          />

          {/* imagepreview */}

          <div className={`my-2 rounded-xl overflow-hidden w-60 h-60 align-middle self-center relative ${activeTab == 1 ? '' : 'hidden'}`}>
            {previewImage.map((value, idx) => {
              return <img key={idx} src={value} alt="" className="object-contain w-full absolute" />;
            })}
          </div>
        </div>
        <div className="w-full flex flex-row absolute bottom-0 bg-box-main-bg">
          {customScripts &&
            customScripts.map((value, index) => {
              return (
                <HeroIcons
                  parentClassName="px-1 py-2"
                  key={index}
                  label={value.name}
                  which="custom"
                  customPath={value.icon_path}
                  onClick={async (e) => {
                    await executeCustomScripts(value.func);
                  }}
                />
              );
            })}
        </div>
      </MainContainer>
    </>
  );
};
