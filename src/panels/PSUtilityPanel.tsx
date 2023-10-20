import React, {useCallback, useEffect, useState} from 'react';
import {Button, Checkbox, Label, Slider, Textarea, Textfield} from '../components';
import {
  ColorBalanceProcessing,
  IsApplied,
  RawFilterProcessing,
  alignLayers,
  applyAdjustmentLayer,
  applyTemplate,
  cb_data,
  createNewDoc,
  doSaveDocument,
  getTagLayers,
  insertLinkedImage,
  multiGet,
  processHotkey,
  showShadow,
  showThumbnailTag,
} from '../utils/PhotoshopUtils';
import DropDrownPicker from '../customcomponents/DropDownPicker';
import {Accordion} from '../customcomponents/Accordion';
import {calculateNested, findChannel, getMaxNumberofName} from '../utils/StringUtils';
import {MSpan} from '../customcomponents/MSpan';
import {GetFolder, TEMPLATEINDEX} from '../utils/Token';
import {HeroIcons} from '../interfaces/HeroIcons';
import {AIOServerData, TAGnVERTICALALIGN, TextMode, rf_data} from '../utils/props';
import {app, core} from 'photoshop';
import {ADJLAYER, ALIGN, STORAGE_WITH_TAG, align_btn, default_color_balance, default_raw_filter} from '../utils/constant';
import ColorTools from './ColorTools';
import DropDownPicker from '../customcomponents/DropDownPicker';
import {Layer} from 'photoshop/dom/Layer';
import useWebSocket from 'react-use-websocket';
const nodefs = require('fs');
type Props = {
  selectedLayer?: any;
  rootToken?: any;
  receiveText?: string;
  doScript?: (scriptname: string) => void;
  activatePanel?: (tabIndex: number, parentAccordion: number, childAccordion: number) => void;
};

export default function PSUtilityPanel(props: Props) {
  const rawfilter_config_file = 'plugin-data:/rawfilter_config.json';
  const [RAWFilter, setRAWFilter] = useState(null);
  const [colorBalance, setColorBalance] = useState(null);
  const [cbMode, setCbMode] = useState(1);
  const [savePanel, showSavePanel] = useState(false);
  const [confName, setConfName] = useState('');
  const [upRF, setUpRF] = useState({'rf': false, 'cb': false});
  const [configContent, setConfigContent] = useState(null);
  const [currentRFConfig, setCurrentRFConfig] = useState(null);
  const accRef = React.useRef(null);
  const socketUrl = 'ws://localhost:7898/Server';
  const {sendJsonMessage, lastJsonMessage} = useWebSocket(socketUrl, {
    share: true,
    shouldReconnect: (closeEvent) => {
      return true;
    },
  });
  //#region ONCLICK AND SLIDER

  const upRFCallback = useCallback(
    (key: string, is_up: boolean) => {
      const ur = upRF;
      ur[key] = is_up;
      setUpRF(ur);
    },
    [upRF]
  );

  function handleSliderChange(name: string, value: number) {
    upRFCallback('rf', true);
    const updateRF = [...RAWFilter];
    const rfIndex = updateRF.findIndex((item) => item.name == name);
    if (rfIndex != -1) {
      updateRF[rfIndex].value = value;
      setRAWFilter(() => updateRF);
    }
  }
  function handleColorBalance(e) {
    upRFCallback('cb', true);
    const updateCB = [...colorBalance];
    const cbIndex = updateCB.findIndex((item) => item.name === e.target.dataset.name);
    if (cbIndex != -1) {
      updateCB[cbIndex].value[cbMode] = e.target.value;
      setColorBalance(updateCB);
    }
  }

  function writeDefault() {
    nodefs.writeFileSync(
      rawfilter_config_file,
      JSON.stringify([
        {
          name: 'Sample',
          data: RAWFilter,
        },
      ]),
      {encoding: 'utf-8'}
    );
  }
  //#endregion

  type ConfigData = {
    name: string;
    data: object;
  };

  function updateConfigFile(conf_name: string, is_delete: boolean) {
    const data: ConfigData[] = configContent;
    let newData: ConfigData[];
    const exist = data.findIndex((e: ConfigData) => e.name == conf_name);
    if (is_delete) {
      const d: ConfigData[] = data.filter((c: any) => c.name !== conf_name);
      newData = d;
    } else {
      if (exist > -1) conf_name = conf_name + `(${exist + 1})`;
      newData = [...data, {name: conf_name, data: RAWFilter}];
    }

    nodefs.writeFileSync(rawfilter_config_file, JSON.stringify(newData), {encoding: 'utf-8'});
    setConfigContent(newData);
  }
  useEffect(() => {
    let config_content: any;
    try {
      config_content = nodefs.readFileSync(rawfilter_config_file, {encoding: 'utf-8'});
    } catch (error) {
      writeDefault();
      config_content = nodefs.readFileSync(rawfilter_config_file, {encoding: 'utf-8'});
    }
    setConfigContent(JSON.parse(config_content));
    setRAWFilter(default_raw_filter);
    setColorBalance(default_color_balance);
  }, []);

  useEffect(() => {}, [configContent]);

  useEffect(() => {
    if (!upRF['rf']) return;
    const result = RAWFilter.reduce((accumulator, item) => {
      accumulator[item.name] = item.value;
      return accumulator;
    }, {});
    RawFilterProcessing(result as rf_data);
  }, [RAWFilter]);
  useEffect(() => {
    if (!upRF['cb']) return;
    const result = colorBalance.reduce((accumulator, item) => {
      accumulator[item.name] = item.value;
      return accumulator;
    }, {});
    ColorBalanceProcessing(result as cb_data);
  }, [colorBalance]);
  function updateColorBalance(data: cb_data) {
    const updateCB = [...colorBalance];
    Object.keys(data).forEach((e) => {
      const found = updateCB.find((obj) => obj.name === e);
      if (found) found.value = data[e];
    });
    setColorBalance(updateCB);
  }
  function updateValueByName(data: rf_data) {
    const updateRF = [...RAWFilter];
    Object.keys(data).forEach((e) => {
      const found = updateRF.find((obj) => obj.name === e);
      if (found) found.value = data[e];
    });

    setRAWFilter(updateRF);
  }
  useEffect(() => {
    try {
      if (!props?.selectedLayer) return;
      if (props?.selectedLayer?._target[0]?._ref === 'document') {
        checkTagLayers();
      }
      IsApplied(props?.selectedLayer?.layerID[0]).then((result) => {
        if (result[0]) {
          for (const fltrFX of result[1]) {
            const s = fltrFX.filter;
            switch (s._obj) {
              case 'colorBalance':
                const sh = s.shadowLevels;
                const mid = s.midtoneLevels;
                const hl = s.highlightLevels;
                const color_balance_data: cb_data = {
                  r: [sh[0], mid[0], hl[0]],
                  g: [sh[1], mid[1], hl[1]],
                  b: [sh[2], mid[2], hl[2]],
                };
                updateColorBalance(color_balance_data);
                break;
              case 'Adobe Camera Raw Filter':
                const camera_raw_filter: rf_data = {
                  temp: s['$Temp'],
                  tint: s['$Tint'],
                  texture: s['$CrTx'], //texture
                  clarity: s['$Cl12'], //clarity
                  vibrance: s['$Vibr'], //vibrance
                  saturation: s['saturation'], //saturation
                  sharpen: s['sharpen'], //sharpen
                  noise_reduction: s['$LNR'], //noise reduct
                  colornoise_reduction: s['$CNR'], //color noise reduct
                };
                updateValueByName(camera_raw_filter);
                break;
            }
          }
        } else {
          upRFCallback('rf', false);
          upRFCallback('cb', false);

          updateValueByName({
            texture: 0,
            clarity: 0,
            sharpen: 0,
            noise_reduction: 0,
            colornoise_reduction: 0,
            vibrance: 0,
            saturation: 0,
            temp: 0,
            tint: 0,
          });
          updateColorBalance({
            r: [0, 0, 0],
            g: [0, 0, 0],
            b: [0, 0, 0],
          });
        }
      });
    } catch (error) {}
  }, [props?.selectedLayer]);

  const [lineCount, setLineCount] = useState(3);
  const [currentText, setCurrentText] = useState<TextMode[]>([]);
  const [showSpan, setShowSpan] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [batchPlays, setBatchPlays] = useState(null);
  const [templateIndex, setTemplateIndex] = useState(parseInt(localStorage.getItem(TEMPLATEINDEX)) || -1);
  const [templateName, setTemplateName] = useState(null);
  const [withTag, setWithTag] = useState(JSON.parse(localStorage.getItem(STORAGE_WITH_TAG)));
  const [vertAlign, setVertAlign] = useState(false);
  const [messageHistory, setMessageHistory] = useState(null);
  function handleOnInput(e) {
    let textLen = e.target.value.split('\r');
    const add = calculateNested(textLen);
    let linecount = textLen.length + add;
    if (linecount < 3) linecount = 3;
    else if (linecount > 10) linecount = 10;
    setLineCount(linecount);

    const data = [];
    for (const text of e.target.value.trim().split('\r')) {
      data.push({mode: 0, text: text});
    }
    setCurrentText(data);
  }
  useEffect(() => {
    localStorage.setItem(STORAGE_WITH_TAG, JSON.stringify(withTag));
  }, [withTag]);
  useEffect(() => {
    setTemplateName(templates?.filter((e) => e.isFile).map((e) => e.name)[templateIndex]);
  }, [templates]);
  async function loadTemplates() {
    const template_folder = await props.rootToken.getEntry('template');
    const templates = await template_folder.getEntries();
    setTemplates(templates);
    //batchplay
    const batchplay_folder = await props.rootToken.getEntry('batchplay');
    const batchplays = await batchplay_folder.getEntries();
    setBatchPlays(batchplays);
  }
  useEffect(() => {
    if (props.rootToken) loadTemplates();
  }, [props.rootToken]);

  async function handleHotkeys(params: string) {
    const tagvert: TAGnVERTICALALIGN = {tag: withTag, vertical_align: vertAlign};
    switch (params) {
      case 'rawfilter':
        props?.activatePanel(0, 0, 1);
        accRef?.current?.showIndex(1);
        break;
      case 'save':
        await handleSavingFile();
        break;
      case 'newdoc':
        await createNewDoc();
        break;
      case 'topleft':
        await processHotkey(tagvert, align_btn.tl);
        break;
      case 'toptop':
        await processHotkey(tagvert, align_btn.tt);
        break;
      case 'topright':
        await processHotkey(tagvert, align_btn.tr);
        break;
      case 'midleft':
        await processHotkey(tagvert, align_btn.ml);
        break;
      case 'midmid':
        await processHotkey(tagvert, align_btn.mm);
        break;
      case 'midright':
        await processHotkey(tagvert, align_btn.mr);
        break;
      case 'botleft':
        await processHotkey(tagvert, align_btn.bl);
        break;
      case 'botbot':
        await processHotkey(tagvert, align_btn.bm);
        break;
      case 'botright':
        await processHotkey(tagvert, align_btn.br);
        break;
      case 'LEFT':
        await alignLayers(ALIGN.LEFT, false);
        break;
      case 'MID':
        await alignLayers(ALIGN.CENTERHORIZONTAL, false);
        break;
      case 'RIGHT':
        await alignLayers(ALIGN.RIGHT, false);
        break;
      case 'adj_curves':
        await applyAdjustmentLayer(ADJLAYER.CURVES);
        break;
      case 'adj_huesaturation':
        await applyAdjustmentLayer(ADJLAYER.HUESATURATION);
        break;
      case 'adj_exposure':
        await applyAdjustmentLayer(ADJLAYER.EXPOSURE);
        break;
      case 'adj_colorbalance':
        await applyAdjustmentLayer(ADJLAYER.COLORBALANCE);
        break;
      case 'adj_gradientmap':
        await applyAdjustmentLayer(ADJLAYER.GRADIENTMAP);
        break;
      case 'adj_lut':
        await applyAdjustmentLayer(ADJLAYER.LUT);
        break;
      case 'scalelayer':
        await processHotkey(tagvert, 'SCALE');
        break;
      case 'deleteandfill':
        await require('photoshop').core.performMenuCommand({commandID: 5280});
        break;
      case 'SCALE':
        await processHotkey(tagvert, 'SCALE');
        break;
      case 'TAGSCALE':
        await processHotkey(tagvert, 'TAGSCALE');
        break;

      case 'deleteandfill':
        await core.executeAsModal(
          async () => {
            await app.batchPlay(
              [
                {
                  '_obj': 'invokeCommand',
                  'commandID': 5280,
                },
              ],
              {}
            );
          },
          {commandName: 'delete n fill'}
        );
    }
  }
  const [tagLayers, setTagLayers] = useState<Layer[]>(null);
  function checkTagLayers() {
    const tags = getTagLayers();
    if (tags && tags.length > 0) setTagLayers([{name: 'None', id: -1}, ...tags]);
    else setTagLayers(null);
  }
  async function handleSavingFile() {
    const all_layers = await multiGet();
    const channel = findChannel(all_layers);
    if (channel) {
      const channel_token = await props.rootToken.getEntry(channel);
      let message;

      if (app.activeDocument.title.includes('Untitled')) {
        let num = 0;
        const files = await channel_token.getEntries();
        let max_num = getMaxNumberofName(files);
        if (max_num == -Infinity) max_num = 0;
        num = max_num + 1;
        message = await doSaveDocument(channel_token, num, channel);
      } else if (app.activeDocument.title.includes('.psd')) {
        message = await doSaveDocument(channel_token, app.activeDocument.title.replace('.psd', ''), channel);
      } else {
        message = null;
      }

      if (message) {
        sendJsonMessage({
          type: 'filepath',
          channel: channel,
          fromserver: false,
          data: message,
          textdata: '', //!video id for inang
        });
      }
    }
  }
  useEffect(() => {
    if (messageHistory) {
      return;
      const message = messageHistory;
    }
  }, [messageHistory]);

  /**
   * ?HOTKEYS
   */
  useEffect(() => {
    if (lastJsonMessage === null) return;

    let message = lastJsonMessage as AIOServerData;
    if (message?.fromserver) {
      switch (message?.type) {
        case 'save':
          break;
        case 'newdoc':
          break;
        case 'sendtextclipboard':
          break;
        case 'upscaledfile':
          props.rootToken.getEntry('gigapixel').then(async (ggp) => {
            setTimeout(async () => {
              const namafile = message?.data?.split('\\').pop();
              const _fileentry = await ggp.getEntry(namafile);
              await insertLinkedImage(_fileentry, namafile);
            }, 500);
          });

          break;
        case 'bp':
          props?.doScript(message.data);
          break;
        case 'hotkey':
          handleHotkeys(message.data);
          break;
      }
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    if (props?.receiveText) {
      const data = [];
      for (const text of props?.receiveText.trim().split('\r')) {
        data.push({mode: 0, text: text});
      }
      setCurrentText(data);
    }
  }, [props.receiveText]);
  const sections = [
    {
      title: 'Text Tools & Color',
      content: (
        <div className={`flex flex-wrap w-full`}>
          <div className="w-full flex flex-col">
            <DropDrownPicker
              onChange={(e) => {
                localStorage.setItem(TEMPLATEINDEX, e.target.selectedIndex.toString());
                setTemplateIndex(e.target.selectedIndex);
                setTemplateName(e.target.value);
              }}
              overrideClass="grow"
              items={templates?.filter((e) => e.isFile).map((e) => e.name) || []}
              selectedIndex={templateIndex}
            />
            <div className="w-full flex flex-row my-1">
              {tagLayers && (
                <DropDownPicker
                  overrideClass="grow"
                  selectedIndex={-1}
                  items={tagLayers?.map((e) => e && e?.name)}
                  onChange={(e) => {
                    try {
                      showThumbnailTag(tagLayers, e.target.value);
                    } catch (e) {}
                  }}
                />
              )}
              {!tagLayers && (
                <Button className="rounded-sm grow" variant="secondary" onClick={checkTagLayers}>
                  Show Tag
                </Button>
              )}
            </div>
            {templates == null && (
              <Button quiet={true} variant="cta" className="shrink rounded-sm ml-2">
                Load
              </Button>
            )}
          </div>
          <div className={'flex w-full flex-wrap ml-3 ' + `${showSpan ? 'my-2' : ''}`}>
            {showSpan &&
              currentText.map((value, index) => {
                return (
                  <MSpan
                    key={index}
                    text={value.text}
                    curMode={value.mode}
                    setMode={(mode) => {
                      const val = [...currentText];
                      currentText[index].mode = mode;
                      setCurrentText(val);
                    }}
                  />
                );
              })}
          </div>
          {!showSpan && (
            <Textarea
              onBlur={(e) => {
                setShowSpan(true);
              }}
              onChange={() => {}}
              style={{height: `${lineCount * 16 + 6}px`, minHeight: '48px'}}
              className="w-full mb-2"
              value={currentText.map((e) => e.text).join('\r') || ''}
              onInput={handleOnInput}
              quiet={true}
            />
          )}

          <div className="w-full flex flex-row justify-end">
            <Button quiet={true} variant="warning" className="rounded-sm mr-2" onClick={handleSavingFile}>
              Save
            </Button>
            <Button quiet={true} variant="cta" className="rounded-sm mr-2" onClick={() => setShowSpan(false)}>
              Edit
            </Button>
            <Button
              variant="cta"
              className="rounded-sm"
              onClick={async () => {
                const result = templates?.find((e) => e.name === templateName);
                await applyTemplate(result, currentText, withTag);
                const emblems = currentText.filter((e) => e.mode === 1);
                for (const emblem of emblems) {
                  sendJsonMessage({
                    type: 'createemblem',
                    fromserver: false,
                    data: 'http://make.me',
                    textdata: emblem.text,
                  });
                }
                checkTagLayers();
              }}
            >
              Create
            </Button>
          </div>
          <div className="w-full flex flex-row">
            <div className="flex flex-wrap w-1/4 justify-start">
              {Object.keys(align_btn).map((key, index) => {
                return (
                  <HeroIcons
                    key={index}
                    which={align_btn[key]}
                    onClick={async (e) => {
                      const tagvert: TAGnVERTICALALIGN = {tag: withTag, vertical_align: vertAlign};
                      await processHotkey(tagvert, align_btn[key]);
                    }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap w-3/4 flex-col">
              {['with tag', 'vertical align', 'show style'].map((value, index) => {
                return (
                  <Checkbox
                    key={index}
                    checked={index == 0 ? withTag : false}
                    className="px-2 cursor-pointer"
                    onChange={(e) => {
                      switch (index) {
                        case 0:
                          setWithTag(e.target.checked);
                          break;
                        case 1:
                          setVertAlign(e.target.checked);
                          break;
                        case 2:
                          showShadow(e.target.checked);
                          break;
                      }
                    }}
                  >
                    {value}
                  </Checkbox>
                );
              })}
              {/* {batchPlays &&
                batchPlays
                  ?.filter((e) => e.isFile)
                  .map((e) => e.name)
                  .map((value, index) => {
                    return (
                      <div key={index} className="text-white p-1 mx-1 bg-black uppercase hover:bg-slate-900">
                        {value.replace('.js', '')}
                      </div>
                    );
                  })} */}
            </div>
          </div>
          <ColorTools />
        </div>
      ),
    },

    {
      title: 'Raw Filter & Color Balance',
      content: (
        <>
          <div className={`flex flex-wrap w-full`}>
            <div className="w-full flex flex-row">
              <DropDrownPicker
                selectedIndex={-1}
                items={configContent?.map((e: any) => e.name) || ['']}
                overrideClass="grow w-1/2 mx-1"
                onChange={(e) => {
                  const data = configContent[e.target.selectedIndex]?.data;
                  setConfName(configContent[e.target.selectedIndex]?.name);
                  setCurrentRFConfig(data);
                }}
              />
              <Button
                variant="cta"
                className="rounded-sm"
                onClick={() => {
                  showSavePanel(false);
                  if (currentRFConfig != null) {
                    upRFCallback('rf', true);
                    const result = currentRFConfig.reduce((accumulator, item) => {
                      accumulator[item.name] = item.value;
                      return accumulator;
                    }, {});

                    updateValueByName(result as rf_data);
                  }
                }}
              >
                Apply
              </Button>
              <Button variant="cta" className={`${savePanel ? 'hidden' : ''} ml-1 rounded-sm`} onClick={() => showSavePanel(true)}>
                Save
              </Button>
            </div>
            <div className={'w-full flex-row my-1 ' + `${savePanel ? 'flex' : 'hidden'}`}>
              <Textfield quiet={true} value={confName} onChange={(e) => setConfName(e.target.value)} className="grow mr-1" />
              <Button
                variant="warning"
                className="rounded-sm mr-1"
                onClick={() => {
                  updateConfigFile(confName, true);
                  showSavePanel(false);
                }}
              >
                Delete
              </Button>
              <Button
                variant="cta"
                className="rounded-sm"
                onClick={() => {
                  if (confName === '') return;

                  updateConfigFile(confName, false);
                  showSavePanel(false);
                }}
              >
                Save
              </Button>
            </div>
            {RAWFilter &&
              RAWFilter.map((rawfilt, index) => {
                return (
                  <Slider
                    className={`w-1/2 ${index % 2 == 0 ? 'pr-1' : 'pl-1'}`}
                    key={index}
                    min={rawfilt.min}
                    name={rawfilt.name}
                    max={rawfilt.max}
                    step={rawfilt.step}
                    value={rawfilt.value}
                    onChange={(e) => handleSliderChange(e.target.dataset.name, e.target.value)}
                  >
                    <Label slot="label">{rawfilt.name}</Label>
                  </Slider>
                );
              })}
          </div>
          <div className={`flex flex-wrap w-full`}>
            <div className="w-full flex">
              <DropDrownPicker
                items={['Shadow', 'Midtone', 'HightLight']}
                selectedIndex={1}
                horizontalmode={true}
                title="Tone:"
                onChange={(e) => {
                  setCbMode(e.target.selectedIndex);
                }}
              />
            </div>
            {colorBalance &&
              colorBalance.map((colbal, index) => {
                return (
                  <Slider
                    className={`w-full`}
                    key={index}
                    min={colbal.min}
                    name={colbal.name}
                    mode={colbal.mode}
                    max={colbal.max}
                    step={colbal.step}
                    value={colbal.value[cbMode]}
                    onChange={handleColorBalance}
                  />
                );
              })}
          </div>
        </>
      ),
    },
  ];
  return (
    <div className="flex flex-col w-full">
      <Accordion ref={accRef} sections={sections} />
    </div>
  );
}
