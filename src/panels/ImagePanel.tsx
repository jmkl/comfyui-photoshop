import React, { useEffect, useState } from 'react';
import { Button, Textfield } from '../components';
import DropDrownPicker from '../customcomponents/DropDownPicker';
import ReactPaginate from 'react-paginate';
import Paginator from '../customcomponents/Paginator';
import { getMilis } from '../utils/IOUtils';
import { IMAGEITEMS, InlineDialogContent } from '../utils/props';
import OnlinePage from '../customcomponents/OnlinePage';
import { HeroIcons } from '../interfaces/HeroIcons';
import { SaveCurrentLayerAsSmartObject, getSmartObjectNativePath } from '../utils/PhotoshopUtils';

type Props = {
  rootToken?: any;
  className?: string;
  aioServer?: any;
  UIDialog?: (e: InlineDialogContent) => void;
  // sendJsonMessage: (message: string) => void;
  // lastJsonMessage: any;
};

export default function ImagePanel(props: Props) {
  //token
  const [tokenSmartObject, setTokenSmartOject] = useState();
  const [tokenTextures, setTokenTextures] = useState(null);
  const [tokenOnline, setTokenOnline] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);

  const [allSmartObject, setAllSmartObject] = useState(null);

  const [provider, setProvider] = useState(null);
  const [filteredImages, setFilteredImages] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [slctIndex, setSlctIndex] = useState(0);
  const image_provider = ['Smart Object', 'Online', 'Textures'];

  const [savePanel, showSavePanel] = useState(false);
  const [saveName, setSaveName] = useState('');

  const texture_url = 'http://localhost:3000/texture';
  const [textureCategories, setTextureCategories] = useState(null);
  const [textureCategory, setTextureCategory] = useState(null);

  //entry token
  const [currentEntry, setCurrentEntry] = useState(null);
  const [entryTextureCategory, setEntryTextureCategory] = useState<IMAGEITEMS>(null);
  const [smartObjects, setSmartObjects] = useState<IMAGEITEMS>(null);

  const [isOnline, setIsOnline] = useState(false);
  const [searchImage, setSearchImage] = useState(null);

  function fetchCategory(category) {
    if (!tokenTextures) return;
    fetch(`${texture_url}/cat/${category}`)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then(async (data) => {
        setEntryTextureCategory({
          mode: 'texture',
          entry: tokenTextures,
          category: category,
          content: data?.map((p) => {
            return {
              name: p?.name,
              category: p?.category,
              favorite: p?.favorite,
              thumb: `file:\\\\${tokenTextures?.nativePath}\\\.thumbnail\\${
                category == 'Vector' ? p?.name?.replace('eps', 'jpg') : p?.name
              }`,
            };
          }),
        });
      })
      .catch((e) => console.log('fetchCategory', e));
  }

  useEffect(() => {
    setCurrentEntry(entryTextureCategory);
  }, [entryTextureCategory]);
  useEffect(() => {
    if (isOnline) return;
    if (filterValue === '') {
      setFilteredImages(() => currentEntry);
    } else {
      setFilteredImages({
        ...currentEntry,
        content: currentEntry?.content?.filter((e) => e?.name?.toLowerCase().includes(filterValue.toLowerCase())),
      });
    }
  }, [filterValue, currentEntry]);

  useEffect(() => {}, [searchImage]);

  useEffect(() => {
    switch (true) {
      case provider === image_provider[0]:
        setIsOnline(false);
        console.log('update data', smartObjects?.content?.length);
        setCurrentEntry(() => smartObjects);
        break;
      case provider === image_provider[2]:
        setIsOnline(false);
        setCurrentEntry(null);
        fetchCategory('Favorites');
        break;
      default:
        setIsOnline(true);
        setCurrentEntry(null);
        break;
    }
  }, [provider, forceUpdate]);

  useEffect(() => {
    setTimeout(() => {
      setProvider((e) => image_provider[0]);
    }, 300);
  }, [smartObjects]);

  function loadSmartObjectFile() {
    props?.rootToken?.getEntry('smartobject').then(async (folder) => {
      setTokenSmartOject(folder);
      setAllSmartObject(await folder.getEntries());
      const entry = await folder.getEntry('thumbnail.json');
      const content = JSON.parse(await entry.read());
      setSmartObjects((e) => {
        return {
          mode: 'smartobject',
          entry: folder,
          category: null,
          content: content.map((p) => {
            return {
              name: p.name,
              thumb: `file:\\\\${folder.nativePath}\\thumbnails\\${p.name}.png`,
            };
          }),
        };
      });
      setForceUpdate((e) => !e);
    });
  }
  useEffect(() => {
    if (!props?.aioServer?.lastJsonMessage) return;

    switch (props?.aioServer?.lastJsonMessage?.type) {
      case 'createthumb':
        loadSmartObjectFile();
        break;
      case 'deletethumb':
        loadSmartObjectFile();
        break;
    }
  }, [props?.aioServer?.lastJsonMessage]);
  useEffect(() => {
    if (!props?.rootToken) return;
    props?.rootToken?.getEntry('texture').then(async (folder) => {
      setTokenTextures(folder);
    });
    if (!props?.rootToken) return;
    props?.rootToken?.getEntry('download').then(async (folder) => {
      setTokenOnline(folder);
    });
    loadSmartObjectFile();
  }, [props?.rootToken]);
  useEffect(() => {
    fetch('http://localhost:3000/texture/all')
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        setTextureCategories(data);
      });
  }, []);

  return (
    <div className={'w-full flex flex-col mt-1 ' + `${props?.className}`}>
      <div className="w-full flex flex-row">
        {provider != image_provider[2] ? (
          <Textfield
            type="search"
            className="grow"
            value={filterValue || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchImage(filterValue);
              }
            }}
            onChange={(e) => e.preventDefault()}
            onInput={(e) => {
              setFilterValue(e.target.value);
            }}
          />
        ) : (
          <DropDrownPicker
            selectedIndex={slctIndex}
            overrideClass="grow"
            items={textureCategories || []}
            onChange={(e) => {
              fetchCategory(e.target.value);
            }}
          />
        )}

        <DropDrownPicker
          selectedIndex={slctIndex}
          overrideClass="w-1/3"
          items={image_provider}
          onChange={(e) => {
            setFilterValue('');
            setProvider(image_provider[e.target.selectedIndex]);
          }}
        />
        {provider === image_provider[0] && (
          <HeroIcons
            which="save"
            parentClassName="p-1"
            onClick={() => {
              if (!savePanel) {
                setSaveName('');
              } else {
                console.log('saving');
                if (saveName === '') {
                } else {
                  SaveCurrentLayerAsSmartObject(tokenSmartObject, allSmartObject, saveName).then((result: string) => {
                    if (result) {
                      props?.aioServer?.sendJsonMessage({
                        type: 'createthumb',
                        fromserver: false,
                        data: result,
                      });
                    }
                  });
                }
              }
              showSavePanel(!savePanel);
            }}
          />
        )}
      </div>
      {provider === image_provider[0] && savePanel && (
        <div className="w-full flex flex-row my-1">
          <Textfield
            value={saveName}
            className="grow"
            onChange={(e) => {
              setSaveName(e.target.value);
            }}
          />
        </div>
      )}
      <div className="w-full flex flex-row flex-wrap">
        {isOnline ? (
          <OnlinePage keyword={searchImage} onlineToken={tokenOnline} UIDialog={props?.UIDialog} />
        ) : (
          <Paginator
            itemsPerPage={32}
            imageitem={filteredImages}
            addFavorite={(item) => {
              props?.UIDialog({
                show: true,
                title: 'Add to Favorite',
                message: `are u sure you wanna add \"${item.name}\" to your favorite??`,
                onOk: (result) => {
                  const _url = `${texture_url}/fav/${item.name}/${item.favorite}`;
                  console.log(_url);
                  fetch(_url)
                    .then((response) => {
                      if (response.ok) {
                        return response.json();
                      }
                    })
                    .then((data) => {
                      const entrytexture_cat = { ...entryTextureCategory };
                      entrytexture_cat.content[entrytexture_cat.content.findIndex((e) => e.name === item.name)].favorite = !item.favorite;
                      setEntryTextureCategory(entrytexture_cat);
                    });
                },
                onCancel: (result) => {
                  console.log(result);
                },
              });
            }}
            removeItem={(itemname) => {
              getSmartObjectNativePath(tokenSmartObject, itemname.name).then((result) => {
                props?.UIDialog({
                  show: true,
                  title: 'Add to Favorite',
                  message: `are u sure you wanna delete \"${itemname.name}\" from your current library??`,
                  onOk: (eps) => {
                    props?.aioServer?.sendJsonMessage({
                      type: 'deletethumb',
                      fromserver: false,
                      data: result,
                    });
                  },
                  onCancel: (e) => {
                    console.log(result);
                  },
                });
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
