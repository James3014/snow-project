#!/usr/bin/env python3
"""
Course Data Import Script
Imports course information into resort YAML files
"""

import yaml
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Mapping of resort names to YAML file paths
RESORT_FILE_MAP = {
    "岩原": "niigata/yuzawa/yuzawa_iwappara.yaml",
    "Iwappara": "niigata/yuzawa/yuzawa_iwappara.yaml",
    "輕井澤": "nagano/nagano_karuizawa_prince.yaml",
    "Karuizawa": "nagano/nagano_karuizawa_prince.yaml",
    "Gala": "niigata/yuzawa/yuzawa_gala.yaml",
    "神樂": "niigata/yuzawa/yuzawa_kagura.yaml",
    "Kagura": "niigata/yuzawa/yuzawa_kagura.yaml",
    "湯澤中里": "niigata/yuzawa/yuzawa_nakazato.yaml",
    "Nakazato": "niigata/yuzawa/yuzawa_nakazato.yaml",
    "神立高原": "niigata/yuzawa/yuzawa_kandatsu.yaml",
    "Kandatsu": "niigata/yuzawa/yuzawa_kandatsu.yaml",
    "留壽都": "hokkaido/hokkaido_rusutsu.yaml",
    "Rusutsu": "hokkaido/hokkaido_rusutsu.yaml",
    "苗場": "niigata/yuzawa/yuzawa_naeba.yaml",
    "Naeba": "niigata/yuzawa/yuzawa_naeba.yaml",
    "野澤溫泉": "nagano/nagano_nozawa_onsen.yaml",
    "Nozawa": "nagano/nagano_nozawa_onsen.yaml",
    "藏王": "yamagata/yamagata_zao_onsen.yaml",
    "Zao": "yamagata/yamagata_zao_onsen.yaml",
    "石打丸山": "niigata/yuzawa/yuzawa_ishiuchi_maruyama.yaml",
    "Ishiuchi": "niigata/yuzawa/yuzawa_ishiuchi_maruyama.yaml",
    "舞子高原": "niigata/yuzawa/yuzawa_maiko_kogen.yaml",
    "Maiko": "niigata/yuzawa/yuzawa_maiko_kogen.yaml",
    "栂池": "nagano/hakuba/hakuba_tsugaike_kogen.yaml",
    "Tsugaike": "nagano/hakuba/hakuba_tsugaike_kogen.yaml",
    "富良野": "hokkaido/hokkaido_furano.yaml",
    "Furano": "hokkaido/hokkaido_furano.yaml",
    "札幌手稻": "hokkaido/hokkaido_sapporo_teine.yaml",
    "Sapporo Teine": "hokkaido/hokkaido_sapporo_teine.yaml",
    "湯沢パーク": "niigata/yuzawa/yuzawa_park.yaml",
    "Yuzawa-Park": "niigata/yuzawa/yuzawa_park.yaml",
    "二世谷 Moiwa": "hokkaido/hokkaido_niseko_moiwa.yaml",
    "Niseko Moiwa": "hokkaido/hokkaido_niseko_moiwa.yaml",
}

# Difficulty color to level mapping
DIFFICULTY_MAP = {
    "綠": "beginner",
    "紅": "intermediate",
    "黑": "advanced",
    "雙黑": "advanced",
    "橘": "intermediate",
}

# Course data from user input
COURSE_DATA = """
岩原 ( Iwappara )	メインバーン 12 / 10	綠
岩原 ( Iwappara )	パノラマコース 9 / 10	綠
岩原 ( Iwappara )	スラロームバーン 10 / 15	綠
岩原 ( Iwappara )	ロマンスコース 9 / 12	綠
岩原 ( Iwappara )	初心者專用コース 6 / 10	綠
岩原 ( Iwappara )	ファミリーコース 8 / 10	綠
岩原 ( Iwappara )	ジャイアントコース 10 / 15	紅
岩原 ( Iwappara )	パラレルコース 10 / 18	紅
岩原 ( Iwappara )	チャレンジバーン 11 / 20	紅
岩原 ( Iwappara )	ダイナミックコース 12 / 18	紅
岩原 ( Iwappara )	エキスパートコース 9 / 22	紅
岩原 ( Iwappara )	スピードウェイ 13 / 15	紅
岩原 ( Iwappara )	アドバンスコース 10 / 20	紅
岩原 ( Iwappara )	テクニカルバーン 8 / 25	黑
岩原 ( Iwappara )	モーグルコース 7 / 28	黑
岩原 ( Iwappara )	急斜面チャレンジ 6 / 30	黑
岩原 ( Iwappara )	エキスパートウォール 5 / 32	黑
岩原 ( Iwappara )	ブラックダイヤモンド 8 / 28	黑
岩原 ( Iwappara )	マスターズコース 9 / 26	黑
岩原 ( Iwappara )	チャンピオンシップ 10 / 24	黑
輕井澤 ( Karuizawa )	パノラマコース 12 / 8	綠
輕井澤 ( Karuizawa )	ファミリーコース 10 / 10	綠
輕井澤 ( Karuizawa )	初級コース 8 / 12	綠
輕井澤 ( Karuizawa )	くりの木コース 9 / 10	綠
輕井澤 ( Karuizawa )	プリンスゲレンデ 11 / 15	紅
輕井澤 ( Karuizawa )	パラレルコース 10 / 18	紅
輕井澤 ( Karuizawa )	チャレンジコース 9 / 20	紅
輕井澤 ( Karuizawa )	アリエスカコース 12 / 18	紅
輕井澤 ( Karuizawa )	浅間コース 13 / 16	紅
輕井澤 ( Karuizawa )	離山コース 11 / 17	紅
輕井澤 ( Karuizawa )	エキスパートコース 8 / 25	黑
輕井澤 ( Karuizawa )	テクニカルバーン 7 / 28	黑
輕井澤 ( Karuizawa )	モーグルコース 6 / 30	黑
輕井澤 ( Karuizawa )	急斜面 5 / 32	黑
輕井澤 ( Karuizawa )	スラロームバーン 8 / 26	黑
輕井澤 ( Karuizawa )	最上級コース 7 / 28	黑
輕井澤 ( Karuizawa )	ダイナミックバーン 9 / 24	黑
Gala	ファミリーコース 10 / 8	綠
Gala	初級コース 12 / 10	綠
Gala	北エリア初級 9 / 12	綠
Gala	中央エリア初級 11 / 10	綠
Gala	南エリア初級 10 / 11	綠
Gala	中級コース 10 / 18	紅
Gala	北エリア中級 11 / 20	紅
Gala	中央エリア中級 12 / 18	紅
Gala	南エリア中級 10 / 19	紅
Gala	ダウンヒルコース 13 / 17	紅
Gala	パノラマコース 14 / 16	紅
Gala	上級コース 9 / 25	黑
Gala	北エリア上級 8 / 28	黑
Gala	中央エリア上級 7 / 30	黑
Gala	南エリア上級 8 / 28	黑
Gala	エキスパートコース 6 / 32	黑
神樂 ( Kagura )	ファミリーコース 8 / 10	綠
神樂 ( Kagura )	初級エリア 10 / 12	綠
神樂 ( Kagura )	田代エリア初級 9 / 11	綠
神樂 ( Kagura )	かぐらエリア初級 11 / 10	綠
神樂 ( Kagura )	中級コース 12 / 18	紅
神樂 ( Kagura )	田代エリア中級 10 / 20	紅
神樂 ( Kagura )	かぐらエリア中級 11 / 19	紅
神樂 ( Kagura )	上級コース 9 / 28	黑
神樂 ( Kagura )	田代エリア上級 8 / 30	黑
神樂 ( Kagura )	かぐらエリア上級 7 / 32	黑
神樂 ( Kagura )	エキスパートコース 6 / 35	雙黑
湯澤中里 ( Nakazato )	ファミリーコース 10 / 8	綠
湯澤中里 ( Nakazato )	初級エリア 12 / 10	綠
湯澤中里 ( Nakazato )	スマイルコース 9 / 12	綠
湯澤中里 ( Nakazato )	キッズパーク 6 / 8	綠
湯澤中里 ( Nakazato )	中級コース 11 / 18	紅
湯澤中里 ( Nakazato )	パノラマコース 13 / 16	紅
湯澤中里 ( Nakazato )	ダイナミックコース 10 / 20	紅
湯澤中里 ( Nakazato )	上級コース 8 / 26	黑
湯澤中里 ( Nakazato )	エキスパートバーン 7 / 30	黑
湯澤中里 ( Nakazato )	チャレンジコース 9 / 28	黑
神立高原 ( Kandatsu )	ファミリーコース 8 / 10	綠
神立高原 ( Kandatsu )	初級エリア 10 / 12	綠
神立高原 ( Kandatsu )	ビギナーズパラダイス 9 / 11	綠
神立高原 ( Kandatsu )	やまばとコース 11 / 10	綠
神立高原 ( Kandatsu )	メルヘンコース 10 / 12	綠
神立高原 ( Kandatsu )	中級コース 12 / 18	紅
神立高原 ( Kandatsu )	パノラマコース 13 / 17	紅
神立高原 ( Kandatsu )	メインコース 11 / 19	紅
神立高原 ( Kandatsu )	スカイラインコース 12 / 18	紅
神立高原 ( Kandatsu )	上級コース 9 / 26	黑
神立高原 ( Kandatsu )	エキスパートバーン 8 / 28	黑
神立高原 ( Kandatsu )	急斜面チャレンジ 7 / 30	黑
神立高原 ( Kandatsu )	モーグルコース 6 / 32	黑
神立高原 ( Kandatsu )	スーパーエキスパート 7 / 31	雙黑
神立高原 ( Kandatsu )	ブラックダイヤモンド 6 / 35	雙黑
留壽都 ( Rusutsu )	ファミリーコース 10 / 8	綠
留壽都 ( Rusutsu )	初級エリアA 12 / 10	綠
留壽都 ( Rusutsu )	初級エリアB 11 / 11	綠
留壽都 ( Rusutsu )	ウエストエリア初級 9 / 12	綠
留壽都 ( Rusutsu )	イーストエリア初級 10 / 10	綠
留壽都 ( Rusutsu )	イゾラエリア初級 13 / 9	綠
留壽都 ( Rusutsu )	キッズパーク 6 / 8	綠
留壽都 ( Rusutsu )	ビギナーパラダイス 11 / 10	綠
留壽都 ( Rusutsu )	スマイルコース 10 / 11	綠
留壽都 ( Rusutsu )	中級コースA 11 / 18	紅
留壽都 ( Rusutsu )	中級コースB 12 / 19	紅
留壽都 ( Rusutsu )	中級コースC 10 / 17	紅
留壽都 ( Rusutsu )	ウエストエリア中級 13 / 18	紅
留壽都 ( Rusutsu )	イーストエリア中級 12 / 19	紅
留壽都 ( Rusutsu )	イゾラエリア中級 14 / 17	紅
留壽都 ( Rusutsu )	パノラマコース 15 / 16	紅
留壽都 ( Rusutsu )	ダウンヒルコース 16 / 18	紅
留壽都 ( Rusutsu )	スカイラインコース 13 / 17	紅
留壽都 ( Rusutsu )	ダイナミックバーン 11 / 20	紅
留壽都 ( Rusutsu )	ロングクルーズ 18 / 15	紅
留壽都 ( Rusutsu )	上級コースA 9 / 26	黑
留壽都 ( Rusutsu )	上級コースB 8 / 28	黑
留壽都 ( Rusutsu )	上級コースC 10 / 25	黑
留壽都 ( Rusutsu )	ウエストエリア上級 8 / 28	黑
留壽都 ( Rusutsu )	イーストエリア上級 9 / 27	黑
留壽都 ( Rusutsu )	イゾラエリア上級 7 / 30	黑
留壽都 ( Rusutsu )	エキスパートバーン 7 / 30	黑
留壽都 ( Rusutsu )	モーグルコース 6 / 32	黑
留壽都 ( Rusutsu )	急斜面チャレンジ 6 / 33	黑
留壽都 ( Rusutsu )	ブラックダイヤモンドA 7 / 31	雙黑
留壽都 ( Rusutsu )	ブラックダイヤモンドB 6 / 34	雙黑
留壽都 ( Rusutsu )	エキストリームゾーン 5 / 36	雙黑
留壽都 ( Rusutsu )	サイドカントリー 8 / 28	雙黑
留壽都 ( Rusutsu )	スーパーエキスパート 7 / 32	雙黑
留壽都 ( Rusutsu )	チャンピオンシップ 9 / 30	雙黑
留壽都 ( Rusutsu )	マスターズコース 8 / 31	雙黑
苗場 ( Naeba )	ファミリーコース 10 / 8	綠
苗場 ( Naeba )	初級エリア 12 / 10	綠
苗場 ( Naeba )	第1ゲレンデ初級 9 / 12	綠
苗場 ( Naeba )	第2ゲレンデ初級 11 / 10	綠
苗場 ( Naeba )	第3ゲレンデ初級 10 / 11	綠
苗場 ( Naeba )	第4ゲレンデ初級 13 / 9	綠
苗場 ( Naeba )	筍山ゲレンデ初級 11 / 10	綠
苗場 ( Naeba )	中級コース 11 / 18	紅
苗場 ( Naeba )	第1ゲレンデ中級 12 / 19	紅
苗場 ( Naeba )	第2ゲレンデ中級 10 / 20	紅
苗場 ( Naeba )	第3ゲレンデ中級 13 / 18	紅
苗場 ( Naeba )	第4ゲレンデ中級 11 / 19	紅
苗場 ( Naeba )	筍山ゲレンデ中級 12 / 17	紅
苗場 ( Naeba )	パノラマコース 14 / 16	紅
苗場 ( Naeba )	ダウンヒルコース 15 / 18	紅
苗場 ( Naeba )	ダイナミックバーン 13 / 20	紅
苗場 ( Naeba )	上級コース 9 / 26	黑
苗場 ( Naeba )	第1ゲレンデ上級 8 / 28	黑
苗場 ( Naeba )	第2ゲレンデ上級 7 / 30	黑
苗場 ( Naeba )	第3ゲレンデ上級 8 / 29	黑
苗場 ( Naeba )	第4ゲレンデ上級 9 / 27	黑
苗場 ( Naeba )	筍山ゲレンデ上級 7 / 31	黑
苗場 ( Naeba )	エキスパートコース 6 / 32	雙黑
苗場 ( Naeba )	モーグルコース 6 / 33	雙黑
野澤溫泉 ( Nozawa )	ファミリーコース 10 / 8	綠
野澤溫泉 ( Nozawa )	初級エリア 12 / 10	綠
野澤溫泉 ( Nozawa )	日影ゲレンデ初級 9 / 12	綠
野澤溫泉 ( Nozawa )	柄沢ゲレンデ初級 11 / 10	綠
野澤溫泉 ( Nozawa )	上ノ平ゲレンデ初級 10 / 11	綠
野澤溫泉 ( Nozawa )	やまびこゲレンデ初級 13 / 9	綠
野澤溫泉 ( Nozawa )	長坂ゲレンデ初級 11 / 10	綠
野澤溫泉 ( Nozawa )	パラダイスゲレンデ初級 10 / 12	綠
野澤溫泉 ( Nozawa )	ブナ平ゲレンデ初級 12 / 10	綠
野澤溫泉 ( Nozawa )	スカイラインコース初級 11 / 11	綠
野澤溫泉 ( Nozawa )	中級コース 11 / 18	紅
野澤溫泉 ( Nozawa )	日影ゲレンデ中級 12 / 19	紅
野澤溫泉 ( Nozawa )	柄沢ゲレンデ中級 10 / 20	紅
野澤溫泉 ( Nozawa )	上ノ平ゲレンデ中級 13 / 18	紅
野澤溫泉 ( Nozawa )	やまびこゲレンデ中級 12 / 19	紅
野澤溫泉 ( Nozawa )	長坂ゲレンデ中級 14 / 17	紅
野澤溫泉 ( Nozawa )	パラダイスゲレンデ中級 13 / 18	紅
野澤溫泉 ( Nozawa )	ブナ平ゲレンデ中級 11 / 20	紅
野澤溫泉 ( Nozawa )	スカイラインコース中級 15 / 16	紅
野澤溫泉 ( Nozawa )	パノラマコース 16 / 15	紅
野澤溫泉 ( Nozawa )	ダウンヒルコース 14 / 18	紅
野澤溫泉 ( Nozawa )	ユートピアコース 13 / 17	紅
野澤溫泉 ( Nozawa )	シュナイダーコース 12 / 19	紅
野澤溫泉 ( Nozawa )	チャレンジコース 11 / 20	紅
野澤溫泉 ( Nozawa )	上級コース 9 / 26	黑
野澤溫泉 ( Nozawa )	日影ゲレンデ上級 8 / 28	黑
野澤溫泉 ( Nozawa )	柄沢ゲレンデ上級 7 / 30	黑
野澤溫泉 ( Nozawa )	上ノ平ゲレンデ上級 8 / 29	黑
野澤溫泉 ( Nozawa )	やまびこゲレンデ上級 9 / 27	黑
野澤溫泉 ( Nozawa )	長坂ゲレンデ上級 7 / 31	黑
野澤溫泉 ( Nozawa )	パラダイスゲレンデ上級 8 / 28	黑
野澤溫泉 ( Nozawa )	ブナ平ゲレンデ上級 7 / 30	黑
野澤溫泉 ( Nozawa )	スカイラインコース上級 9 / 28	黑
野澤溫泉 ( Nozawa )	エキスパートコース 6 / 32	雙黑
野澤溫泉 ( Nozawa )	チャレンジ39 6 / 39	雙黑
野澤溫泉 ( Nozawa )	モーグルコース 6 / 33	雙黑
野澤溫泉 ( Nozawa )	スーパーエキスパート 7 / 31	雙黑
野澤溫泉 ( Nozawa )	ブラックダイヤモンド 6 / 35	雙黑
野澤溫泉 ( Nozawa )	エキストリームゾーン 5 / 38	雙黑
藏王 ( Zao )	ファミリーコース 10 / 8	綠
藏王 ( Zao )	初級エリア 12 / 10	綠
藏王 ( Zao )	中央ゲレンデ初級 9 / 12	綠
藏王 ( Zao )	横倉ゲレンデ初級 11 / 10	綠
藏王 ( Zao )	中級コース 11 / 18	紅
藏王 ( Zao )	中央ゲレンデ中級 12 / 19	紅
藏王 ( Zao )	横倉ゲレンデ中級 13 / 18	紅
藏王 ( Zao )	上級コース 9 / 26	黑
藏王 ( Zao )	樹氷原コース 8 / 28	黑
藏王 ( Zao )	エキスパートコース 7 / 32	雙黑
石打丸山 ( Ishiuchi )	ファミリーコース 10 / 8	綠
石打丸山 ( Ishiuchi )	初級エリア 12 / 10	綠
石打丸山 ( Ishiuchi )	中央エリア初級 9 / 12	綠
石打丸山 ( Ishiuchi )	ハツカ石エリア初級 11 / 10	綠
石打丸山 ( Ishiuchi )	銀座エリア初級 10 / 11	綠
石打丸山 ( Ishiuchi )	サンライズエリア初級 13 / 9	綠
石打丸山 ( Ishiuchi )	北エリア初級 11 / 10	綠
石打丸山 ( Ishiuchi )	中級コース 11 / 18	紅
石打丸山 ( Ishiuchi )	中央エリア中級 12 / 19	紅
石打丸山 ( Ishiuchi )	ハツカ石エリア中級 10 / 20	紅
石打丸山 ( Ishiuchi )	銀座エリア中級 13 / 18	紅
石打丸山 ( Ishiuchi )	サンライズエリア中級 12 / 19	紅
石打丸山 ( Ishiuchi )	北エリア中級 14 / 17	紅
石打丸山 ( Ishiuchi )	パノラマコース 15 / 16	紅
石打丸山 ( Ishiuchi )	ダウンヒルコース 13 / 18	紅
石打丸山 ( Ishiuchi )	ダイナミックバーン 11 / 20	紅
石打丸山 ( Ishiuchi )	上級コース 9 / 26	黑
石打丸山 ( Ishiuchi )	中央エリア上級 8 / 28	黑
石打丸山 ( Ishiuchi )	ハツカ石エリア上級 7 / 30	黑
石打丸山 ( Ishiuchi )	銀座エリア上級 8 / 29	黑
石打丸山 ( Ishiuchi )	サンライズエリア上級 9 / 27	黑
石打丸山 ( Ishiuchi )	北エリア上級 7 / 31	黑
石打丸山 ( Ishiuchi )	エキスパートコース 6 / 32	雙黑
石打丸山 ( Ishiuchi )	モーグルコース 6 / 33	雙黑
石打丸山 ( Ishiuchi )	スーパーエキスパート 7 / 31	雙黑
石打丸山 ( Ishiuchi )	ブラックダイヤモンド 6 / 35	雙黑
舞子高原 ( Maiko )	ファミリーコース 10 / 8	綠
舞子高原 ( Maiko )	初級エリア 12 / 10	綠
舞子高原 ( Maiko )	舞子エリア初級 9 / 12	綠
舞子高原 ( Maiko )	長峰エリア初級 11 / 10	綠
舞子高原 ( Maiko )	奥添地エリア初級 10 / 11	綠
舞子高原 ( Maiko )	中級コース 11 / 18	紅
舞子高原 ( Maiko )	舞子エリア中級 12 / 19	紅
舞子高原 ( Maiko )	長峰エリア中級 10 / 20	紅
舞子高原 ( Maiko )	奥添地エリア中級 13 / 18	紅
舞子高原 ( Maiko )	パノラマコース 14 / 16	紅
舞子高原 ( Maiko )	ダウンヒルコース 15 / 18	紅
舞子高原 ( Maiko )	ダイナミックバーン 13 / 20	紅
舞子高原 ( Maiko )	上級コース 9 / 26	黑
舞子高原 ( Maiko )	舞子エリア上級 8 / 28	黑
舞子高原 ( Maiko )	長峰エリア上級 7 / 30	黑
舞子高原 ( Maiko )	奥添地エリア上級 8 / 29	黑
舞子高原 ( Maiko )	エキスパートコース 6 / 32	雙黑
舞子高原 ( Maiko )	モーグルコース 6 / 33	雙黑
舞子高原 ( Maiko )	スーパーエキスパート 7 / 31	雙黑
舞子高原 ( Maiko )	ブラックダイヤモンド 6 / 35	雙黑
舞子高原 ( Maiko )	エキストリームゾーン 5 / 37	雙黑
舞子高原 ( Maiko )	チャンピオンシップ 7 / 32	雙黑
舞子高原 ( Maiko )	マスターズコース 8 / 30	雙黑
舞子高原 ( Maiko )	テクニカルバーン 7 / 31	雙黑
舞子高原 ( Maiko )	チャレンジゾーン 6 / 34	雙黑
栂池 ( Tsugaike )	ファミリーコース 10 / 8	綠
栂池 ( Tsugaike )	初級エリア 12 / 10	綠
栂池 ( Tsugaike )	鐘の鳴る丘ゲレンデ初級 9 / 12	綠
栂池 ( Tsugaike )	親の原ゲレンデ初級 11 / 10	綠
栂池 ( Tsugaike )	中級コース 11 / 18	紅
栂池 ( Tsugaike )	鐘の鳴る丘ゲレンデ中級 12 / 19	紅
栂池 ( Tsugaike )	親の原ゲレンデ中級 13 / 18	紅
栂池 ( Tsugaike )	上級コース 9 / 26	黑
栂池 ( Tsugaike )	鐘の鳴る丘ゲレンデ上級 8 / 28	黑
栂池 ( Tsugaike )	エキスパートコース 7 / 32	雙黑
富良野 ( Furano )	ファミリーコース 10 / 8	綠
富良野 ( Furano )	初級エリア 12 / 10	綠
富良野 ( Furano )	北の峰ゾーン初級 9 / 12	綠
富良野 ( Furano )	富良野ゾーン初級 11 / 10	綠
富良野 ( Furano )	プリンスコース初級 10 / 11	綠
富良野 ( Furano )	中級コース 11 / 18	紅
富良野 ( Furano )	北の峰ゾーン中級 12 / 19	紅
富良野 ( Furano )	富良野ゾーン中級 10 / 20	紅
富良野 ( Furano )	プリンスコース中級 13 / 18	紅
富良野 ( Furano )	パノラマコース 14 / 16	紅
富良野 ( Furano )	ダウンヒルコース 15 / 18	紅
富良野 ( Furano )	ダイナミックバーン 13 / 20	紅
富良野 ( Furano )	上級コース 9 / 26	黑
富良野 ( Furano )	北の峰ゾーン上級 8 / 28	黑
富良野 ( Furano )	富良野ゾーン上級 7 / 30	黑
富良野 ( Furano )	プリンスコース上級 8 / 29	黑
富良野 ( Furano )	エキスパートコース 6 / 32	雙黑
富良野 ( Furano )	モーグルコース 6 / 33	雙黑
富良野 ( Furano )	スーパーエキスパート 7 / 31	雙黑
富良野 ( Furano )	ブラックダイヤモンド 6 / 35	雙黑
富良野 ( Furano )	エキストリームゾーン 5 / 38	雙黑
富良野 ( Furano )	チャンピオンシップ 7 / 32	雙黑
富良野 ( Furano )	マスターズコース 8 / 30	雙黑
富良野 ( Furano )	テクニカルバーン 7 / 31	雙黑
富良野 ( Furano )	チャレンジゾーン 6 / 34	雙黑
富良野 ( Furano )	スラロームバーン 8 / 28	雙黑
札幌手稻 ( Sapporo Teine )	ファミリーコース 10 / 8	綠
札幌手稻 ( Sapporo Teine )	初級エリア 12 / 10	綠
札幌手稻 ( Sapporo Teine )	オリンピアゾーン初級 9 / 12	綠
札幌手稻 ( Sapporo Teine )	ハイランドゾーン初級 11 / 10	綠
札幌手稻 ( Sapporo Teine )	中級コース 11 / 18	紅
札幌手稻 ( Sapporo Teine )	オリンピアゾーン中級 12 / 19	紅
札幌手稻 ( Sapporo Teine )	ハイランドゾーン中級 13 / 18	紅
札幌手稻 ( Sapporo Teine )	パノラマコース 14 / 16	紅
札幌手稻 ( Sapporo Teine )	上級コース 9 / 26	黑
札幌手稻 ( Sapporo Teine )	オリンピアゾーン上級 8 / 28	黑
札幌手稻 ( Sapporo Teine )	ハイランドゾーン上級 7 / 30	黑
札幌手稻 ( Sapporo Teine )	エキスパートコース 6 / 32	雙黑
札幌手稻 ( Sapporo Teine )	モーグルコース 6 / 33	雙黑
湯沢パーク ( Yuzawa-Park )	ファミリーコース 10 / 8	綠
湯沢パーク ( Yuzawa-Park )	初級エリア 12 / 10	綠
湯沢パーク ( Yuzawa-Park )	ビギナーパラダイス 9 / 12	綠
湯沢パーク ( Yuzawa-Park )	中級コース 11 / 18	紅
湯沢パーク ( Yuzawa-Park )	パノラマコース 13 / 17	紅
湯沢パーク ( Yuzawa-Park )	ダイナミックバーン 12 / 19	紅
湯沢パーク ( Yuzawa-Park )	上級コース 9 / 26	黑
湯沢パーク ( Yuzawa-Park )	エキスパートコース 8 / 28	黑
湯沢パーク ( Yuzawa-Park )	モーグルコース 7 / 30	黑
湯沢パーク ( Yuzawa-Park )	スーパーエキスパート 6 / 32	雙黑
湯沢パーク ( Yuzawa-Park )	ブラックダイヤモンド 7 / 31	雙黑
二世谷 Moiwa ( Niseko Moiwa )	ファミリーコース 10 / 8	綠
二世谷 Moiwa ( Niseko Moiwa )	初級エリア 12 / 10	綠
二世谷 Moiwa ( Niseko Moiwa )	中級コース 11 / 18	紅
二世谷 Moiwa ( Niseko Moiwa )	パノラマコース 13 / 17	紅
二世谷 Moiwa ( Niseko Moiwa )	上級コース 9 / 26	黑
二世谷 Moiwa ( Niseko Moiwa )	エキスパートコース 8 / 28	黑
二世谷 Moiwa ( Niseko Moiwa )	スーパーエキスパート 7 / 32	雙黑
二世谷 Moiwa ( Niseko Moiwa )	ブラックダイヤモンド 6 / 35	雙黑
"""


def parse_course_line(line: str) -> Tuple[str, str, float, float, str]:
    """
    Parse a single course line.
    Returns: (resort_name, course_name, length, slope, difficulty_color)
    """
    # Split by tab
    parts = line.strip().split('\t')
    if len(parts) != 3:
        return None

    resort_part = parts[0].strip()
    course_name = parts[1].strip()
    difficulty_color = parts[2].strip()

    # Extract resort name (before parentheses or just the name)
    resort_match = re.match(r'^(.+?)\s*\(', resort_part)
    if resort_match:
        resort_name = resort_match.group(1).strip()
    else:
        resort_name = resort_part

    # Extract length and slope from course name
    # Pattern: "Course Name <numbers> / <numbers>"
    length_slope_match = re.search(r'(\d+\.?\d*)\s*/\s*(\d+\.?\d*)', course_name)
    if length_slope_match:
        length = float(length_slope_match.group(1))
        slope = float(length_slope_match.group(2))
        # Remove the length/slope part from course name
        course_name = re.sub(r'\s*\d+\.?\d*\s*/\s*\d+\.?\d*\s*$', '', course_name).strip()
    else:
        length = None
        slope = None

    return resort_name, course_name, length, slope, difficulty_color


def create_course_entry(course_name: str, length: float, slope: float, difficulty_color: str) -> dict:
    """
    Create a course entry in YAML format.
    """
    level = DIFFICULTY_MAP.get(difficulty_color, "intermediate")

    course = {
        "name": course_name,
        "level": level,
        "tags": [],
        "length": length,
        "avg_slope": slope,
        "description": None,
        "notes": None
    }

    return course


def main():
    """
    Main import function.
    """
    base_path = Path("/home/user/snow-project/specs/resort-services/data")

    # Parse all course data
    resort_courses = {}
    lines = COURSE_DATA.strip().split('\n')

    for line in lines:
        if not line.strip():
            continue

        # Skip lines with "default"
        if 'default' in line.lower():
            continue

        result = parse_course_line(line)
        if not result:
            continue

        resort_name, course_name, length, slope, difficulty_color = result

        if resort_name not in resort_courses:
            resort_courses[resort_name] = []

        course_entry = create_course_entry(course_name, length, slope, difficulty_color)
        resort_courses[resort_name].append(course_entry)

    # Update YAML files
    updated_files = []
    for resort_name, courses in resort_courses.items():
        if resort_name not in RESORT_FILE_MAP:
            print(f"Warning: No file mapping for resort '{resort_name}'")
            continue

        yaml_path = base_path / RESORT_FILE_MAP[resort_name]

        if not yaml_path.exists():
            print(f"Warning: File not found: {yaml_path}")
            continue

        # Load existing YAML
        with open(yaml_path, 'r', encoding='utf-8') as f:
            resort_data = yaml.safe_load(f)

        # Replace courses section
        resort_data['courses'] = courses

        # Update course total in snow_stats if it exists
        if 'snow_stats' in resort_data:
            resort_data['snow_stats']['courses_total'] = len(courses)

        # Save updated YAML
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(resort_data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

        updated_files.append(str(yaml_path))
        print(f"✓ Updated {resort_name}: {len(courses)} courses")

    print(f"\n✓ Successfully updated {len(updated_files)} resort files")
    print("\nUpdated files:")
    for file in updated_files:
        print(f"  - {file}")


if __name__ == "__main__":
    main()
