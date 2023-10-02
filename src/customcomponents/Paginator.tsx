import React, { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
import { insertSmartObject } from '../utils/PhotoshopUtils';
import { IMAGEITEMS, content } from '../utils/props';
type Props = {
  itemsPerPage: number;
  imageitem?: IMAGEITEMS;
  removeItem?: (image: content) => void;
  addFavorite?: (image: content) => void;
};
export default function Paginator(props: Props) {
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 32;
  const endOffset = itemOffset + itemsPerPage;
  let currentItems = props?.imageitem?.content?.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(props?.imageitem?.content?.length / itemsPerPage);
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % props?.imageitem?.content?.length;
    setItemOffset(newOffset);
  };
  function handleOnImageClick(e, item) {
    if (props?.imageitem?.mode == 'smartobject') {
      props?.imageitem?.entry?.getEntry(item.name + '.psb').then((obj) => insertSmartObject(obj));
    } else if (props?.imageitem?.mode == 'texture') {
      props?.imageitem?.entry?.getEntry(`${item.category}/${item.name}`).then((file) => {
        insertSmartObject(file);
      });
    }
  }
  function handleRightClick(e, item) {
    if (props?.imageitem?.mode == 'smartobject') {
      props?.removeItem(item.name);
    } else if (props?.imageitem?.mode == 'texture') {
      props?.addFavorite(item);
    }
  }
  useEffect(() => {
    console.log('content', itemOffset);
    setItemOffset(0);
  }, [props?.imageitem?.content]);
  return (
    <>
      <div className=" bg-black w-full top-0">
        <ReactPaginate
          breakLabel="..."
          nextLabel="next >"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          pageCount={pageCount}
          previousLabel="< prev"
          className="react-paginate"
          renderOnZeroPageCount={null}
        />
      </div>
      <div className="w-full !overflow-y-auto flex flex-wrap flex-row justify-between mt-2 h80vh">
        {currentItems &&
          currentItems.map((item: content, index: React.Key) => (
            <img
              className={`${
                props?.imageitem?.mode === 'smartobject' ? 'w-1/4 h-20' : 'w-1/2 h-36'
              } object-cover cursor-pointer border-4 hover:border-white border-transparent`}
              key={index}
              src={item.thumb}
              onContextMenu={(e) => handleRightClick(e, item)}
              onClick={(e) => handleOnImageClick(e, item)}
              data-name={item.name}
            />
          ))}
      </div>
    </>
  );
}
