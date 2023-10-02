import React, { useEffect, useState } from 'react';
import { Md5 } from 'ts-md5';
import { insertLinkedImage } from '../utils/PhotoshopUtils';
import { InlineDialogContent } from '../utils/props';
type Props = {
  keyword?: string;
  onlineToken?: any;
  UIDialog?: (e: InlineDialogContent, doThis: () => Promise<any>) => void;
};
export default function OnlinePage(props: Props) {
  const [itemOffset, setItemOffset] = useState(0);
  const [images, setImages] = useState(null);
  const [currentKeyword, setCurrentKeyword] = useState('');

  const stockurl = (keyword: string) =>
    encodeURI(`https://app.stocksolo.com/search?search=${keyword}&skipVendors[0]=adobe&skipVendors[1]=pixabay&page=`);

  function processOnlineImages(keyword: string) {
    const _url = stockurl(keyword + itemOffset);
    console.log(_url);
    fetch(_url)
      .then((r) => {
        if (r.ok) return r.json();
      })
      .then((d) => {
        let content = d?.items?.map((d) => {
          return { name: d?.source, thumb: d?.preview?.url, url: d?.fullResolution?.url };
        });
        setImages(content);
      });
  }
  async function downloadImage(url: string, filename: string) {
    const downloadFile = await props?.onlineToken?.getEntry(filename);

    if (!downloadFile) {
      props?.UIDialog(
        {
          isloading: true,
          title: 'Downloading...',
          message: 'please wait.....',
          show: true,
        },
        async () => {
          return new Promise(async (resolve, reject) => {
            fetch(url)
              .then((result) => {
                if (result.ok) return result.arrayBuffer();
              })
              .then(async (buffer) => {
                const new_jpeg = await props?.onlineToken?.createFile(filename, { overwrite: true });
                await new_jpeg.write(buffer, { format: require('uxp').storage.formats.binary }).then(async () => {
                  await insertLinkedImage(new_jpeg, filename);
                  resolve(new_jpeg);
                });
              });
          });
        }
      );
    } else {
      await insertLinkedImage(downloadFile, filename);
    }
  }
  useEffect(() => {
    if (props.keyword && props?.keyword != '') setCurrentKeyword(props?.keyword);
  }, [props?.keyword]);

  useEffect(() => {
    if (!currentKeyword && currentKeyword === '') return;
    processOnlineImages(currentKeyword);
  }, [itemOffset, currentKeyword]);

  useEffect(() => {
    if (!props?.onlineToken) return;
  }, [props?.onlineToken]);
  return (
    <>
      <div className=" bg-black w-full flex-row justify-end">
        <div
          className="acc-title text-white text-right cursor-pointer px-2 py-1 hover:text-yellow-400 active:text-red-500"
          onClick={(e) => {
            setItemOffset(itemOffset + 1);
          }}
        >{`page: ${itemOffset}    >`}</div>
      </div>
      <div className="w-full !overflow-y-auto flex flex-wrap flex-row justify-between mt-2 h80vh">
        {images &&
          images?.map((item, index) => (
            <img
              className="w-1/2 h-36 object-cover cursor-pointer border-4 hover:border-white border-transparent"
              key={index}
              src={item.thumb}
              onClick={() => {
                const url = item.url;
                const name = `${Md5.hashStr(url)}.jpg`;
                console.log(name, url);
                downloadImage(url, name);
              }}
              data-name={item.name}
            />
          ))}
      </div>
    </>
  );
}
