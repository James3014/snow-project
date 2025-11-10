/**
 * 增強版拼音映射表
 * 包含常見別名、簡稱和多種拼音變體
 */

export interface PinyinMapping {
  pinyin: string[];  // 可能的拼音寫法
  chinese: string;   // 中文名稱
  resortId: string;  // 雪場 ID
}

// 雪場拼音映射
export const RESORT_PINYIN_MAP: PinyinMapping[] = [
  {
    pinyin: ['zhumiaodai', '猪苗代', 'zhumiaodaihua', 'inawashiroski', 'zhumiaodaihuaxuechang', 'inawashiro', 'inawashiroskiresort', 'zhumiao', 'inawashiro ski resort'],
    chinese: '猪苗代滑雪場',
    resortId: 'fukushima_inawashiro',
  },
  {
    pinyin: ['hoshinoresortsnekomamountain', 'xingyejituan', 'xingyejituan nekoma mountain', 'hoshino resorts nekoma mountain', 'nekoma', 'xingye', 'xingyeji'],
    chinese: '星野集團 NEKOMA MOUNTAIN',
    resortId: 'fukushima_nekoma_mountain',
  },
  {
    pinyin: ['marunumakogenskiresort', '丸沼', 'wanzhaogaoyuanhuaxuechang', 'marunuma kogen ski resort', 'wanzhaogaoyuan', 'marunumakogenski', 'marunuma', 'marunumakogen', 'wanzhaogao', 'wanzhao'],
    chinese: '丸沼高原滑雪場',
    resortId: 'gunma_marunuma_kogen',
  },
  {
    pinyin: ['minakamikogenskiresort', 'shuishanggao', 'shuishanggaoyuanhuaxuedujiacun', 'minakamikogen', 'shuishanggaoyuanhuaxue', 'shuishang', 'minakami', 'minakamikogenski', '水上', 'minakami kogen ski resort', 'shuishanggaoyuan'],
    chinese: '水上高原滑雪度假村',
    resortId: 'gunma_minakami_kogen',
  },
  {
    pinyin: ['岩鞍', 'yanan', 'weilaiyananhuaxuechang', 'iwakura', '尾瀨', 'weilai', 'weilaiyanan', 'whiteworldozeiwakura', 'white world oze iwakura', 'oze', 'weilaiyan'],
    chinese: '尾瀨岩鞍滑雪場',
    resortId: 'gunma_oze_iwakura',
  },
  {
    pinyin: ['qunmawhite valley', 'gunmawhitevalley', 'qunmaw', 'gunmawhitevalleyskiresort', 'gunma white valley ski resort', 'qunmawh', 'qunma', 'white valley', 'qunmawhite valleyhuaxuechang', 'gunmawhitevalleyski'],
    chinese: '群馬White Valley滑雪場',
    resortId: 'gunma_white_valley',
  },
  {
    pinyin: ['furano ski resort', 'furano', 'furanoskiresort', 'fuliang', 'fuliangyehuaxuedujiacun', 'fuliangyehuaxue', 'furanoski', 'fuliangyehua', 'fuliangye', '富良野'],
    chinese: '富良野滑雪度假村',
    resortId: 'hokkaido_furano',
  },
  {
    pinyin: ['niseko', 'ershigum', 'ershi', 'nisekomoiwaski', 'niseko moiwa ski resort', 'nisekomoiwa', 'ershigumoiwahuaxuechang', '二世古', 'nisekomoiwaskiresort', 'ershigu', 'ershigumoiwa', '二世谷'],
    chinese: '二世谷Moiwa滑雪場',
    resortId: 'hokkaido_niseko_moiwa',
  },
  {
    pinyin: ['liushoudoudujiacun', '留壽都', 'rusutsu resort', 'rusutsu', 'liushoudoudu', 'liushoudou', 'liushou', 'rusutsuresort'],
    chinese: '留壽都度假村',
    resortId: 'hokkaido_rusutsu',
  },
  {
    pinyin: ['teine', 'zhahuangshoudaohuaxuechang', 'zhahuangshoudao', 'sapporoteineski', 'sapporo teine ski resort', 'sapporo', '手稻', 'zhahuangshou', 'sapporoteineskiresort', 'sapporoteine', 'zhahuang', '札幌'],
    chinese: '札幌手稻滑雪場',
    resortId: 'hokkaido_sapporo_teine',
  },
  {
    pinyin: ['星野', 'hoshinoresortstomamu', 'hoshino resorts tomamu', 'xingyejituan', 'tomamu', 'xingyejituantomamudujiacun', 'xingyejituantomamu', 'xingye', 'xingyeji'],
    chinese: '星野集團TOMAMU度假村',
    resortId: 'hokkaido_tomamu',
  },
  {
    pinyin: ['anbigaoyuanhuaxuechang', 'anbigaoyuan', 'appikogenskiresort', 'anbi', '安比', 'appikogenski', 'appi', 'appikogen', 'anbigao', 'appi kogen ski resort'],
    chinese: '安比高原滑雪場',
    resortId: 'iwate_appi_kogen',
  },
  {
    pinyin: ['nashihuaxuechang', '雫石', 'shizukuishiski', 'nashi', 'shizukuishiskiresort', 'shizukuishi', 'nashihua', 'shizukuishi ski resort', 'nashihuaxue'],
    chinese: '雫石滑雪場',
    resortId: 'iwate_shizukuishi',
  },
  {
    pinyin: ['baimacortinahuaxuechang', 'baimacortina', 'cortina', 'baimac', 'baima', 'hakubacortina', 'hakubacortinaskiresort', 'hakubacortinaski', 'baimaco', 'hakuba cortina ski resort'],
    chinese: '白馬Cortina滑雪場',
    resortId: 'hakuba_cortina',
  },
  {
    pinyin: ['goryu', 'wulong', 'hakubagoryu&hakuba47wintersportspark', 'baimawulong & hakuba47 huaxuechang', 'hakuba goryu & hakuba47 winter sports park', 'baima', '五龍', 'baimawulong', 'baimawulong & hakuba47 ', '47', 'baimawu'],
    chinese: '白馬五龍 & Hakuba47 滑雪場',
    resortId: 'hakuba_goryu_47',
  },
  {
    pinyin: ['hakuba', '白馬', 'hakuba happo-one ski resort', 'happo', 'bafang', 'baimabafangweigen', 'hakubahappooneski', 'hakubahappooneskiresort', 'baima', 'baimaba', 'hakubahappoone', 'baimabafangweigenhuaxuechang', 'baimabafang', '八方'],
    chinese: '白馬八方尾根滑雪場',
    resortId: 'hakuba_happo_one',
  },
  {
    pinyin: ['baimayanyuehuaxuechang', '岩岳', 'yanyue', 'baimayanyue', 'baima', 'hakubaiwatakesnowfield', 'hakuba iwatake snow field', 'iwatake', 'baimayan'],
    chinese: '白馬岩岳滑雪場',
    resortId: 'hakuba_iwatake',
  },
  {
    pinyin: ['hakubanorikuraonsenski', 'hakubanorikuraonsen', 'baimacheng', 'baima', 'chengan', 'baimachenganwenquan', 'hakubanorikuraonsenskiresort', 'baimachenganwenquanhuaxuechang', '乗鞍', 'hakuba norikura onsen ski resort', 'norikura', 'baimachengan'],
    chinese: '白馬乗鞍溫泉滑雪場',
    resortId: 'hakuba_norikura',
  },
  {
    pinyin: ['hakubatsugaikekogen', 'hakuba tsugaike kogen ski resort', 'baimameichigaoyuan', 'tsugaike', 'baimameichi', '栂池', 'hakubatsugaikekogenski', 'baima', 'baimameichigaoyuanhuaxuechang', 'hakubatsugaikekogenskiresort', 'meichi', 'baimamei'],
    chinese: '白馬栂池高原滑雪場',
    resortId: 'hakuba_tsugaike_kogen',
  },
  {
    pinyin: ['karuizawaprincehotel', 'qingjingze', 'qingjingzewangzidafandianhuaxuechang', 'karuizawa', 'karuizawaprincehotelski', 'karuizawaprincehotelskiresort', '王子', 'karuizawa prince hotel ski resort', 'qingjingzewangzidafandian', 'wangzi', 'qingjingzewang', '輕井澤', 'qingjing'],
    chinese: '輕井澤王子大飯店滑雪場',
    resortId: 'nagano_karuizawa_prince',
  },
  {
    pinyin: ['kurohimekogensnowpark', 'heijigaoyuan', 'heiji', 'kurohime', 'kurohime kogen snow park', 'heijigao', 'heijigaoyuanhuaxuegongyuan', '黑姬'],
    chinese: '黑姬高原滑雪公園',
    resortId: 'nagano_kurohime_kogen',
  },
  {
    pinyin: ['斑尾', 'madarao mountain resort', 'banwei', 'madarao', 'madaraomountain', 'banweigaoyuanhuaxuechang', 'madaraomountainresort', 'banweigao', 'banweigaoyuan'],
    chinese: '斑尾高原滑雪場',
    resortId: 'nagano_madarao_kogen',
  },
  {
    pinyin: ['yezewenquan', 'yezewen', 'yeze', 'nozawaonsensnow', 'yezewenquanhuaxuechang', 'nozawaonsen', 'nozawaonsensnowresort', 'nozawa onsen snow resort', '野澤', 'nozawa'],
    chinese: '野澤溫泉滑雪場',
    resortId: 'nagano_nozawa_onsen',
  },
  {
    pinyin: ['ryuooskipark', 'ryuoo', 'longwanghuaxue', 'ryuoo ski park', 'longwang', 'longwanghuaxuegongyuan', 'longwanghua', '龍王'],
    chinese: '竜王滑雪公園',
    resortId: 'nagano_ryuoo_ski_park',
  },
  {
    pinyin: ['chicang', 'guanguang', 'akakurakankoresort', 'akakura kanko resort', 'chicangguanguangxuechang', '赤倉', '觀光', 'chicangguan', 'akakura', 'chicangguanguang', 'akakurakanko'],
    chinese: '赤倉觀光雪場',
    resortId: 'myoko_akakura_kanko',
  },
  {
    pinyin: ['chicang', 'akakuraonsenski', 'chicangwenquanhuaxuechang', 'chicangwenquan', 'chicangwen', '赤倉溫泉', 'akakuraonsenskiresort', 'akakuraonsen', 'akakura onsen ski resort'],
    chinese: '赤倉溫泉滑雪場',
    resortId: 'myoko_akakura_onsen',
  },
  {
    pinyin: ['池之平', 'ikenotaira onsen alpenblick ski resort', 'miaogaochizhipingwenquan', 'ikenotaira', 'miaogao', 'miaogaochi', 'ikenotairaonsenalpenblickskiresort', 'ikenotairaonsenalpenblickski', 'ikenotairaonsenalpenblick', 'miaogaochizhi', 'miaogaochizhipingwenquanhuaxuechang', 'chizhiping'],
    chinese: '妙高池之平溫泉滑雪場',
    resortId: 'myoko_ikenotaira',
  },
  {
    pinyin: ['lotte', 'lottearairesort', 'lottearai', 'letianxinjingdujiacun', 'arai', 'xinjing', 'lotte arai resort', 'letian', '新井', 'letianxinjing', '樂天', 'letianxin'],
    chinese: '樂天新井度假村',
    resortId: 'myoko_lotte_arai',
  },
  {
    pinyin: ['shanzhiyuan', 'myokosuginoharaski', 'miaogaoshanzhiyuanhuaxuechang', 'myokosuginoharaskiresort', 'miaogao', 'miaogaoshanzhi', 'miaogaoshanzhiyuan', 'myoko suginohara ski resort', '杉之原', 'miaogaoshan', 'suginohara', 'myokosuginohara'],
    chinese: '妙高杉之原滑雪場',
    resortId: 'myoko_suginohara',
  },
  {
    pinyin: ['tangze', 'ga', 'galayuzawa', 'galayuzawasnowresort', 'galatangze', 'gala yuzawa snow resort', '湯澤', 'galatangzehuaxuechang', 'gal', 'gala', 'galayuzawasnow', 'yuzawa'],
    chinese: 'GALA湯澤滑雪場',
    resortId: 'yuzawa_gala',
  },
  {
    pinyin: ['ishiuchimaruyamaski', 'shidawanshan', 'ishiuchimaruyama', '丸山', 'ishiuchi maruyama ski resort', 'ishiuchimaruyamaskiresort', 'wanshan', 'ishiuchi', 'maruyama', 'shidawan', 'shidawanshanhuaxuechang', 'shida', '石打'],
    chinese: '石打丸山滑雪場',
    resortId: 'yuzawa_ishiuchi_maruyama',
  },
  {
    pinyin: ['yanyuanhuaxuechang', 'yanyuanhuaxue', 'iwappara ski resort', 'iwapparaskiresort', 'iwappara', 'iwapparaski', 'yanyuan', '岩原', 'yanyuanhua'],
    chinese: '岩原滑雪場',
    resortId: 'yuzawa_iwappara',
  },
  {
    pinyin: ['上越', 'joetsukokusaiskiresort', 'shangyueguojihuaxuechang', 'joetsukokusaiski', 'shangyueguo', 'shangyue', 'joetsu kokusai ski resort', 'joetsukokusai', 'joetsu', 'shangyueguoji'],
    chinese: '上越國際滑雪場',
    resortId: 'yuzawa_joetsu_kokusai',
  },
  {
    pinyin: ['shenlehuaxuechang', 'shenle', 'shenlehua', 'kagura ski resort', '神樂', 'shenlehuaxue', 'kaguraskiresort', 'kaguraski', 'kagura'],
    chinese: '神樂滑雪場',
    resortId: 'yuzawa_kagura',
  },
  {
    pinyin: ['kandatsu snow resort', 'shenli', 'shenligaoyuanhuaxuechang', 'kandatsusnow', '神立', 'shenligaoyuan', 'kandatsu', 'kandatsusnowresort', 'shenligao'],
    chinese: '神立高原滑雪場',
    resortId: 'yuzawa_kandatsu',
  },
  {
    pinyin: ['wuzigaoyuanhuaxuechang', '舞子', 'maiko snow resort', 'wuzigaoyuan', 'maiko', 'wuzigao', 'wuzi', 'maikosnow', 'maikosnowresort'],
    chinese: '舞子高原滑雪場',
    resortId: 'yuzawa_maiko_kogen',
  },
  {
    pinyin: ['naebaskiresort', 'miaochang', 'miaochanghuaxue', 'naebaski', 'miaochanghuaxuechang', 'miaochanghua', 'naeba', 'naeba ski resort', '苗場'],
    chinese: '苗場滑雪場',
    resortId: 'yuzawa_naeba',
  },
  {
    pinyin: ['nakazato', 'yuzawanakazatosnow', 'tangze', 'yuzawanakazato', 'tangzezhonglihuaxue', 'tangzezhong', '中里', 'tangzezhongli', 'zhongli', 'yuzawa nakazato snow resort', 'yuzawanakazatosnowresort', 'tangzezhonglihuaxuedujiacun'],
    chinese: '湯澤中里滑雪度假村',
    resortId: 'yuzawa_nakazato',
  },
  {
    pinyin: ['nasp', 'naspa', 'na', 'naspaskigarden', 'naspahuaxuehuayuan', 'naspa ski garden', 'nas'],
    chinese: 'NASPA滑雪花園',
    resortId: 'yuzawa_naspa_ski_garden',
  },
  {
    pinyin: ['tangzegongyuanhuaxuechang', 'tangze', 'yuzawaparkresort', '公園', 'park', 'tangzegong', 'yuzawa park resort', 'yuzawapark', 'tangzegongyuan', 'gongyuan'],
    chinese: '湯澤公園滑雪場',
    resortId: 'yuzawa_park',
  },
  {
    pinyin: ['edelweiss', 'edelweiss ski resort', 'エーデルワイススキーリゾート', 'edelweissskiresort', 'エー', 'エーデ', 'edelweissski', 'エーデル'],
    chinese: 'エーデルワイススキーリゾート',
    resortId: 'tochigi_edelweiss',
  },
  {
    pinyin: ['獵人', 'lierenshanyanyuan', 'huntermountainshiobara', 'lierenshanyanyuanhuaxuechang', 'lierenshan', 'lieren', 'lierenshanyan', 'hunter', 'hunter mountain shiobara'],
    chinese: '獵人山鹽原滑雪場',
    resortId: 'tochigi_hunter_mountain_shiobara',
  },
  {
    pinyin: ['zao onsen ski resort', 'zao', 'cangwangwenquan', 'cangwangwenquanhuaxuechang', 'zaoonsenskiresort', 'cangwangwen', 'cangwang', 'zaoonsen', '藏王', 'zaoonsenski'],
    chinese: '藏王溫泉滑雪場',
    resortId: 'yamagata_zao_onsen',
  },
];

/**
 * 將拼音或中文轉換為雪場 ID（支持中文直接匹配）
 */
export function pinyinToResortId(pinyin: string): string | null {
  const normalized = pinyin.toLowerCase().trim();

  // 優先匹配較長的拼音（避免"白馬"匹配到第一個就返回）
  let bestMatch: { resortId: string; matchLength: number } | null = null;

  for (const mapping of RESORT_PINYIN_MAP) {
    // 完全匹配
    if (mapping.pinyin.includes(normalized)) {
      const matchLength = normalized.length;
      if (!bestMatch || matchLength > bestMatch.matchLength) {
        bestMatch = { resortId: mapping.resortId, matchLength };
      }
    }
    // 包含匹配（用於處理用戶輸入較長的情況）
    else if (mapping.pinyin.some(p => normalized.includes(p) && p.length >= 3)) {
      const matchedPinyin = mapping.pinyin.find(p => normalized.includes(p) && p.length >= 3);
      if (matchedPinyin) {
        const matchLength = matchedPinyin.length;
        if (!bestMatch || matchLength > bestMatch.matchLength) {
          bestMatch = { resortId: mapping.resortId, matchLength };
        }
      }
    }
  }

  return bestMatch ? bestMatch.resortId : null;
}

/**
 * 獲取所有匹配的雪場 ID（用於檢測歧義）
 */
export function getAllMatchingResortIds(pinyin: string): string[] {
  const normalized = pinyin.toLowerCase().trim();
  const matchedIds: string[] = [];

  for (const mapping of RESORT_PINYIN_MAP) {
    // 完全匹配
    if (mapping.pinyin.includes(normalized)) {
      matchedIds.push(mapping.resortId);
    }
    // 包含匹配（用於處理用戶輸入較長的情況）
    else if (mapping.pinyin.some(p => normalized.includes(p) && p.length >= 3)) {
      matchedIds.push(mapping.resortId);
    }
  }

  return matchedIds;
}

/**
 * 將拼音轉換為中文雪場名稱
 */
export function pinyinToChinese(pinyin: string): string | null {
  const normalized = pinyin.toLowerCase().trim();

  for (const mapping of RESORT_PINYIN_MAP) {
    // 完全匹配
    if (mapping.pinyin.includes(normalized)) {
      return mapping.chinese;
    }
    // 包含匹配
    if (mapping.pinyin.some(p => normalized.includes(p) && p.length >= 3)) {
      return mapping.chinese;
    }
  }

  return null;
}

/**
 * 檢查輸入是否可能是拼音
 */
export function isPossiblyPinyin(input: string): boolean {
  // 檢查：只包含英文字母、數字、空格
  return /^[a-zA-Z0-9\s]+$/.test(input);
}
