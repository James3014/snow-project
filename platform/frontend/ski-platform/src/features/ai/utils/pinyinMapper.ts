/**
 * 拼音映射表
 * 自動生成，包含所有雪場的拼音對照
 */

export interface PinyinMapping {
  pinyin: string[];  // 可能的拼音寫法
  chinese: string;   // 中文名稱
  resortId: string;  // 雪場 ID
}

// 雪場拼音映射
export const RESORT_PINYIN_MAP: PinyinMapping[] = [
  {
    pinyin: ['inawashiroskiresort', 'inawashiroski', 'zhumiaodai', 'zhumiaodaihuaxuechang'],
    chinese: '猪苗代滑雪場',
    resortId: 'fukushima_inawashiro',
  },
  {
    pinyin: ['xingyejituan NEKOMA MOUNTAIN', 'xingyejituan NEKOMA ', 'hoshinoresortsnekomamountain'],
    chinese: '星野集團 NEKOMA MOUNTAIN',
    resortId: 'fukushima_nekoma_mountain',
  },
  {
    pinyin: ['wanzhaogaoyuan', 'wanzhaogaoyuanhuaxuechang', 'marunumakogenskiresort', 'marunumakogenski'],
    chinese: '丸沼高原滑雪場',
    resortId: 'gunma_marunuma_kogen',
  },
  {
    pinyin: ['minakamikogenskiresort', 'shuishanggaoyuanhuaxuedujiacun', 'shuishanggaoyuanhuaxue', 'minakamikogenski'],
    chinese: '水上高原滑雪度假村',
    resortId: 'gunma_minakami_kogen',
  },
  {
    pinyin: ['weilaiyananhuaxuechang', 'weilaiyanan', 'whiteworldozeiwakura'],
    chinese: '尾瀨岩鞍滑雪場',
    resortId: 'gunma_oze_iwakura',
  },
  {
    pinyin: ['gunmawhitevalleyskiresort', 'gunmawhitevalleyski', 'qunmaWhite Valley', 'qunmaWhite Valleyhuaxuechang'],
    chinese: '群馬White Valley滑雪場',
    resortId: 'gunma_white_valley',
  },
  {
    pinyin: ['fuliangyehuaxue', 'fuliangyehuaxuedujiacun', 'furanoski', 'furanoskiresort'],
    chinese: '富良野滑雪度假村',
    resortId: 'hokkaido_furano',
  },
  {
    pinyin: ['ershiguMoiwahuaxuechang', 'nisekomoiwaski', 'ershiguMoiwa', 'nisekomoiwaskiresort'],
    chinese: '二世谷Moiwa滑雪場',
    resortId: 'hokkaido_niseko_moiwa',
  },
  {
    pinyin: ['rusutsuresort', 'liushoudou', 'rusutsu', 'liushoudoudujiacun'],
    chinese: '留壽都度假村',
    resortId: 'hokkaido_rusutsu',
  },
  {
    pinyin: ['zhahuangshoudaohuaxuechang', 'sapporoteineskiresort', 'zhahuangshoudao', 'sapporoteineski'],
    chinese: '札幌手稻滑雪場',
    resortId: 'hokkaido_sapporo_teine',
  },
  {
    pinyin: ['xingyejituanTOMAMUdujiacun', 'xingyejituanTOMAMU', 'hoshinoresortstomamu'],
    chinese: '星野集團TOMAMU度假村',
    resortId: 'hokkaido_tomamu',
  },
  {
    pinyin: ['appikogenskiresort', 'anbigaoyuanhuaxuechang', 'appikogenski', 'anbigaoyuan'],
    chinese: '安比高原滑雪場',
    resortId: 'iwate_appi_kogen',
  },
  {
    pinyin: ['nashihuaxuechang', 'shizukuishiski', 'shizukuishiskiresort', 'nashi'],
    chinese: '雫石滑雪場',
    resortId: 'iwate_shizukuishi',
  },
  {
    pinyin: ['hakubacortinaskiresort', 'baimaCortinahuaxuechang', 'hakubacortinaski', 'baimaCortina'],
    chinese: '白馬Cortina滑雪場',
    resortId: 'hakuba_cortina',
  },
  {
    pinyin: ['baimawulong & Hakuba47 huaxuechang', 'baimawulong & Hakuba47 ', 'hakubagoryu&hakuba47wintersportspark'],
    chinese: '白馬五龍 & Hakuba47 滑雪場',
    resortId: 'hakuba_goryu_47',
  },
  {
    pinyin: ['baimabafangweigen', 'hakubahappooneski', 'hakubahappooneskiresort', 'baimabafangweigenhuaxuechang'],
    chinese: '白馬八方尾根滑雪場',
    resortId: 'hakuba_happo_one',
  },
  {
    pinyin: ['hakubaiwatakesnowfield', 'baimayanyue', 'baimayanyuehuaxuechang'],
    chinese: '白馬岩岳滑雪場',
    resortId: 'hakuba_iwatake',
  },
  {
    pinyin: ['baimachenganwenquanhuaxuechang', 'hakubanorikuraonsenskiresort', 'hakubanorikuraonsenski', 'baimachenganwenquan'],
    chinese: '白馬乗鞍溫泉滑雪場',
    resortId: 'hakuba_norikura',
  },
  {
    pinyin: ['hakubatsugaikekogenskiresort', 'baimameichigaoyuan', 'baimameichigaoyuanhuaxuechang', 'hakubatsugaikekogenski'],
    chinese: '白馬栂池高原滑雪場',
    resortId: 'hakuba_tsugaike_kogen',
  },
  {
    pinyin: ['qingjingzewangzidafandian', 'karuizawaprincehotelskiresort', 'qingjingzewangzidafandianhuaxuechang', 'karuizawaprincehotelski'],
    chinese: '輕井澤王子大飯店滑雪場',
    resortId: 'nagano_karuizawa_prince',
  },
  {
    pinyin: ['kurohimekogensnowpark', 'heijigaoyuanhuaxuegongyuan', 'heijigaoyuan'],
    chinese: '黑姬高原滑雪公園',
    resortId: 'nagano_kurohime_kogen',
  },
  {
    pinyin: ['banweigaoyuan', 'madaraomountain', 'madaraomountainresort', 'banweigaoyuanhuaxuechang'],
    chinese: '斑尾高原滑雪場',
    resortId: 'nagano_madarao_kogen',
  },
  {
    pinyin: ['yezewenquan', 'nozawaonsensnowresort', 'yezewenquanhuaxuechang', 'nozawaonsensnow'],
    chinese: '野澤溫泉滑雪場',
    resortId: 'nagano_nozawa_onsen',
  },
  {
    pinyin: ['longwang', 'ryuooskipark', 'longwanghuaxuegongyuan'],
    chinese: '竜王滑雪公園',
    resortId: 'nagano_ryuoo_ski_park',
  },
  {
    pinyin: ['chicangguanguangxuechang', 'akakurakankoresort', 'akakurakanko'],
    chinese: '赤倉觀光雪場',
    resortId: 'myoko_akakura_kanko',
  },
  {
    pinyin: ['akakuraonsenskiresort', 'akakuraonsenski', 'chicangwenquanhuaxuechang', 'chicangwenquan'],
    chinese: '赤倉溫泉滑雪場',
    resortId: 'myoko_akakura_onsen',
  },
  {
    pinyin: ['miaogaochizhipingwenquanhuaxuechang', 'ikenotairaonsenalpenblickskiresort', 'miaogaochizhipingwenquan', 'ikenotairaonsenalpenblickski'],
    chinese: '妙高池之平溫泉滑雪場',
    resortId: 'myoko_ikenotaira',
  },
  {
    pinyin: ['letianxinjing', 'lottearairesort', 'lottearai', 'letianxinjingdujiacun'],
    chinese: '樂天新井度假村',
    resortId: 'myoko_lotte_arai',
  },
  {
    pinyin: ['miaogaoshanzhiyuan', 'myokosuginoharaski', 'myokosuginoharaskiresort', 'miaogaoshanzhiyuanhuaxuechang'],
    chinese: '妙高杉之原滑雪場',
    resortId: 'myoko_suginohara',
  },
  {
    pinyin: ['galayuzawasnow', 'galayuzawasnowresort', 'GALAtangzehuaxuechang', 'GALAtangze'],
    chinese: 'GALA湯澤滑雪場',
    resortId: 'yuzawa_gala',
  },
  {
    pinyin: ['ishiuchimaruyamaskiresort', 'ishiuchimaruyamaski', 'shidawanshan', 'shidawanshanhuaxuechang'],
    chinese: '石打丸山滑雪場',
    resortId: 'yuzawa_ishiuchi_maruyama',
  },
  {
    pinyin: ['yanyuan', 'yanyuanhuaxuechang', 'iwapparaski', 'iwapparaskiresort'],
    chinese: '岩原滑雪場',
    resortId: 'yuzawa_iwappara',
  },
  {
    pinyin: ['joetsukokusaiski', 'shangyueguoji', 'shangyueguojihuaxuechang', 'joetsukokusaiskiresort'],
    chinese: '上越國際滑雪場',
    resortId: 'yuzawa_joetsu_kokusai',
  },
  {
    pinyin: ['kaguraskiresort', 'shenle', 'shenlehuaxuechang', 'kaguraski'],
    chinese: '神樂滑雪場',
    resortId: 'yuzawa_kagura',
  },
  {
    pinyin: ['shenligaoyuan', 'shenligaoyuanhuaxuechang', 'kandatsusnow', 'kandatsusnowresort'],
    chinese: '神立高原滑雪場',
    resortId: 'yuzawa_kandatsu',
  },
  {
    pinyin: ['maikosnow', 'wuzigaoyuan', 'wuzigaoyuanhuaxuechang', 'maikosnowresort'],
    chinese: '舞子高原滑雪場',
    resortId: 'yuzawa_maiko_kogen',
  },
  {
    pinyin: ['naebaski', 'naebaskiresort', 'miaochanghuaxuechang', 'miaochang'],
    chinese: '苗場滑雪場',
    resortId: 'yuzawa_naeba',
  },
  {
    pinyin: ['tangzezhonglihuaxuedujiacun', 'yuzawanakazatosnowresort', 'yuzawanakazatosnow', 'tangzezhonglihuaxue'],
    chinese: '湯澤中里滑雪度假村',
    resortId: 'yuzawa_nakazato',
  },
  {
    pinyin: ['NASPAhuaxuehuayuan', 'naspaskigarden'],
    chinese: 'NASPA滑雪花園',
    resortId: 'yuzawa_naspa_ski_garden',
  },
  {
    pinyin: ['tangzegongyuan', 'yuzawaparkresort', 'tangzegongyuanhuaxuechang', 'yuzawapark'],
    chinese: '湯澤公園滑雪場',
    resortId: 'yuzawa_park',
  },
  {
    pinyin: ['edelweissskiresort', 'エーデルワイススキー', 'edelweissski', 'エーデルワイススキーリゾート'],
    chinese: 'エーデルワイススキーリゾート',
    resortId: 'tochigi_edelweiss',
  },
  {
    pinyin: ['huntermountainshiobara', 'lierenshanyanyuanhuaxuechang', 'lierenshanyanyuan'],
    chinese: '獵人山鹽原滑雪場',
    resortId: 'tochigi_hunter_mountain_shiobara',
  },
  {
    pinyin: ['zaoonsenskiresort', 'cangwangwenquanhuaxuechang', 'zaoonsenski', 'cangwangwenquan'],
    chinese: '藏王溫泉滑雪場',
    resortId: 'yamagata_zao_onsen',
  },
];

/**
 * 將拼音轉換為雪場 ID
 */
export function pinyinToResortId(pinyin: string): string | null {
  const normalized = pinyin.toLowerCase().trim();

  for (const mapping of RESORT_PINYIN_MAP) {
    if (mapping.pinyin.some(p => p === normalized || normalized.includes(p))) {
      return mapping.resortId;
    }
  }

  return null;
}

/**
 * 將拼音轉換為中文雪場名稱
 */
export function pinyinToChinese(pinyin: string): string | null {
  const normalized = pinyin.toLowerCase().trim();

  for (const mapping of RESORT_PINYIN_MAP) {
    if (mapping.pinyin.some(p => p === normalized || normalized.includes(p))) {
      return mapping.chinese;
    }
  }

  return null;
}

/**
 * 檢查輸入是否可能是拼音
 */
export function isPossiblyPinyin(input: string): boolean {
  // 簡單檢查：只包含英文字母
  return /^[a-zA-Z]+$/.test(input);
}
