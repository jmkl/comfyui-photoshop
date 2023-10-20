import React, {useEffect, useState, forwardRef, useImperativeHandle} from 'react';

type AccordionProps = {
  sections: {title: string; content: React.ReactNode}[];
  root?: boolean;
  className?: string;
  setDefaultIndex?: (e: number) => void;
};

export const Accordion = forwardRef((props: AccordionProps, ref) => {
  const [activeSection, setActiveSection] = useState<number | null>(props?.root ? 0 : null);

  const toggleSection = (index: number) => {
    if (index === activeSection) {
      setActiveSection(null);
    } else {
      setActiveSection(index);
    }
  };
  function showIndex(e: number) {
    setActiveSection((ee) => e);
  }

  useImperativeHandle(ref, () => ({
    showIndex,
  }));
  return (
    <div className={'p-0 m-0 ' + props?.className}>
      {props?.sections?.map((section, index) => (
        <div key={index} className={`p-0 m-0 ${props?.root ? 'bg-box-root' : 'bg-box-child'}`}>
          <div
            className={`flex flex-row w-full acc-title cursor-pointer text-white rounded-sm p-2 m-0 hover:text-yellow-100 ${index === activeSection ? 'active' : ''}`}
            onClick={() => toggleSection(index)}
          >
            <div className="grow">{section.title}</div>
            <img
              className={`w-3 h-3 object-contain`}
              src={`${
                index != activeSection
                  ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAk0lEQVR4nO3RvQ3CMBRF4axAkRKGSQENlJmGnz0YgeyCWAKQYImPBgmHgJ1EiMqnvu+9c+2iyGQy/wUzbDAfMbvAGtNY6OTFAWWPxSWaYO4YC1+0uaOO5OtnJuQcO1DhpksTtvlgHQpVQyu32nyx7kgkwRJXaaLPmDoywT6yfJh15NDqrc1468Tf7LD9iXUmU/TlAQi4VTMbTW58AAAAAElFTkSuQmCC'
                  : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAArElEQVR4nO2RMQrCQBBFQ7qQLnfIIcTG84hNbmFl7y200QvkDkHBE2gbCzU+WZiFkOysBrXRfTCwLH/+/NmNokDgtwAyU98wToAFcAUuck4+ZT4CKvocgMm7qefADZ07sATSoeZjYOcwLKW67E3Pq6nN+zYdgxoogFiqkLs2zdO/AdZK6tyhzZVtVr4Bp5bwbFN79HYbo7UcfQNmMmTjSq0h22yld6oKA4E/5QEEgFtf4q3fygAAAABJRU5ErkJggg=='
              }`}
            />
          </div>
          {index === activeSection && <div className={`p-2 pt-0`}>{section.content}</div>}
        </div>
      ))}
    </div>
  );
});
