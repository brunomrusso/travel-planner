'use client';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO 3166-1 alpha-2 → numeric (string)
const A2_TO_NUM: Record<string, string> = {
  ad:'020',ae:'784',af:'004',ag:'028',al:'008',am:'051',ao:'024',ar:'032',
  at:'040',au:'036',az:'031',ba:'070',bb:'052',bd:'050',be:'056',bf:'854',
  bg:'100',bh:'048',bi:'108',bj:'204',bn:'096',bo:'068',br:'076',bs:'044',
  bt:'064',bw:'072',by:'112',bz:'084',ca:'124',cd:'180',cf:'140',cg:'178',
  ch:'756',ci:'384',cl:'152',cm:'120',cn:'156',co:'170',cr:'188',cu:'192',
  cv:'132',cy:'196',cz:'203',de:'276',dj:'262',dk:'208',dm:'212',do:'214',
  dz:'012',ec:'218',ee:'233',eg:'818',er:'232',es:'724',et:'231',fi:'246',
  fj:'242',fr:'250',ga:'266',gb:'826',gd:'308',ge:'268',gh:'288',gm:'270',
  gn:'324',gq:'226',gr:'300',gt:'320',gw:'624',gy:'328',hn:'340',hr:'191',
  ht:'332',hu:'348',id:'360',ie:'372',il:'376',in:'356',iq:'368',ir:'364',
  is:'352',it:'380',jm:'388',jo:'400',jp:'392',ke:'404',kg:'417',kh:'116',
  ki:'296',km:'174',kn:'659',kp:'408',kr:'410',kw:'414',kz:'398',la:'418',
  lb:'422',lc:'662',li:'438',lk:'144',lr:'430',ls:'426',lt:'440',lu:'442',
  lv:'428',ly:'434',ma:'504',mc:'492',md:'498',me:'499',mg:'450',mh:'584',
  mk:'807',ml:'466',mm:'104',mn:'496',mr:'478',mt:'470',mu:'480',mv:'462',
  mw:'454',mx:'484',my:'458',mz:'508',na:'516',ne:'562',ng:'566',ni:'558',
  nl:'528',no:'578',np:'524',nr:'520',nz:'554',om:'512',pa:'591',pe:'604',
  pg:'598',ph:'608',pk:'586',pl:'616',pt:'620',pw:'585',py:'600',qa:'634',
  ro:'642',rs:'688',ru:'643',rw:'646',sa:'682',sb:'090',sc:'690',sd:'729',
  se:'752',sg:'702',si:'705',sk:'703',sl:'694',sm:'674',sn:'686',so:'706',
  sr:'740',ss:'728',st:'678',sv:'222',sy:'760',sz:'748',td:'148',tg:'768',
  th:'764',tj:'762',tl:'626',tm:'795',tn:'788',to:'776',tr:'792',tt:'780',
  tv:'798',tz:'834',ua:'804',ug:'800',us:'840',uy:'858',uz:'860',vc:'670',
  ve:'862',vn:'704',vu:'548',ws:'882',ye:'887',za:'710',zm:'894',zw:'716',
};

interface WorldMapProps {
  visitedCodes: string[];
}

export default function WorldMap({ visitedCodes }: WorldMapProps) {
  const visited = new Set(visitedCodes.map(c => A2_TO_NUM[c.toLowerCase()]).filter(Boolean));

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 110, center: [10, 20] }}
      style={{ width: '100%', height: 'auto' }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={visited.has(String(geo.id)) ? '#0d9488' : '#D1FAF5'}
              stroke="#ffffff"
              strokeWidth={0.4}
              style={{
                default: { outline: 'none' },
                hover: { fill: visited.has(String(geo.id)) ? '#0f766e' : '#99f6e4', outline: 'none' },
                pressed: { outline: 'none' },
              }}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  );
}
