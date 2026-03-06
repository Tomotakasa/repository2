import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { Category, Child } from '../types/index';

// [who, catLabel, name, size, qty, status, imageUrl, brand, color, memo]
type SeedRow = [string, string, string, string, number, string, string, string, string, string];

const rows: SeedRow[] = [
  ['みれい','cat_01','パンパースはだいち','ビッグ',1.5,'','https://drive.google.com/thumbnail?id=1zAMGe0drdzELbUdu7V6EM3H0HtFZaMat&sz=w500','パンパース','',''],
  ['みれい','cat_01','パンパースおやすみ','ビッグ',1,'','https://drive.google.com/thumbnail?id=1zPnEWjHp4MRBRvGyllr25jOrf-so96d9&sz=w500','パンパース','',''],
  ['みれい','cat_02','マミーポコ','ビッグ',1,'','https://drive.google.com/thumbnail?id=1NxFLN4ZjOM_tZke4tqQkAUh71wn6niGa&sz=w500','マミーポコ','',''],
  ['みれい','cat_01','マミーポコおやすみ','ビッグ',1,'','https://drive.google.com/thumbnail?id=18mvlpYcAnWjuPxhH8_EIjnSnHtFU-ibX&sz=w500','マミーポコ','',''],
  ['みれい','cat_01','トイレトレーニング','ビッグ',1,'','https://drive.google.com/thumbnail?id=1EkY7HfueHnCY4v0jJY1aJrZHbiORqlfA&sz=w500','パンパース','',''],
  ['みれい','cat_01','パンパース','ビッグより大きい',3,'','https://drive.google.com/thumbnail?id=15JmhLzyNK5ynwyVZjKVvEF96iNiiPQeq&sz=w500','パンパース','',''],
  ['みれい','cat_01','パンパースおやすみ','ビッグより大きい',2,'','https://drive.google.com/thumbnail?id=1RxDAy7OtbFmQ0uDHcrzYlc8W9qt-YHHS&sz=w500','パンパース','',''],
  ['りょうま','cat_01','パンパース','M',1.5,'','https://drive.google.com/thumbnail?id=176P9Ob2nVZ-prDE9wKtaKV4CjF6PUdVb&sz=w500','パンパース','',''],
  ['りょうま','cat_01','マミーポコ','M',2.5,'通常','https://drive.google.com/thumbnail?id=1nDT4Mq69upha5mES0rYesgGoH-CfoXrL&sz=w500','マミーポコ','',''],
  ['りょうま','cat_01','パンパース','L',5,'','https://drive.google.com/thumbnail?id=1UTExJV4ExtbvHIxpHz73pfYTBtpzEcPK&sz=w500','パンパース','',''],
  ['りょうま','cat_01','マミーポコ','L',4,'通常','https://drive.google.com/thumbnail?id=1lt8grSZcRaNueoJBaNcOwTwZJyDAd9HQ&sz=w500','マミーポコ','','62枚3セット36枚1セット'],
  ['りょうま','cat_01','マミーポコ夜用','L',2,'通常','https://drive.google.com/thumbnail?id=1laZsDqMzKtUoGqxZJfr4Fsvi-stj7HP2&sz=w500','マミーポコ','',''],
  ['みんな','cat_03','ビーチサンダル小','サイズ不明',1,'','','','',''],
  ['みんな','cat_03','スニーカー','11',1,'','','ノースフェイス','青',''],
  ['みんな','cat_03','ミッキー室内履きスニーカー','12',1,'','','','',''],
  ['みんな','cat_03','サンダルスニーカー','12',1,'','','アシックス','赤','売る'],
  ['みんな','cat_03','スニーカー','12.5',1,'','','アシックス','白','売る'],
  ['みんな','cat_03','スニーカー','12.5',1,'','','アシックス','青','売る'],
  ['みんな','cat_03','メッシュスニーカー','12.5',1,'','','ミキハウス','','売らない'],
  ['みんな','cat_03','スニーカー','13',1,'','','アシックス','白','売る'],
  ['りょうま','cat_03','スニーカー','13',1,'通常','https://drive.google.com/thumbnail?id=1h5XgfYb4nzbp1ThWu20V2ttm_gCdtGAE&sz=w500','ミキハウス','',''],
  ['りょうま','cat_03','アンパンマンスニーカー','13',1,'通常','https://drive.google.com/thumbnail?id=1p1QGXXQqFBhH33bE8w4Y87i7upzfbOnR&sz=w500','','',''],
  ['みんな','cat_03','おとぎの森デニムスニーカー','13',2,'','','','',''],
  ['みんな','cat_03','サンダルスニーカー','13',1,'','','ダブルビー','',''],
  ['みんな','cat_03','水陸両用サンダル','13',1,'','','BREEZE','',''],
  ['みんな','cat_03','ブーツ','13',1,'','','ホットビスケッツ','ベージュ',''],
  ['みんな','cat_03','ショートブーツ','13',1,'','','Familiar','茶色',''],
  ['りょうま','cat_03','アンパンマンスノーブーツ','13',1,'通常','https://drive.google.com/thumbnail?id=1Js465lgYH2NFa4vhFCdbV00SSwm2JxWe&sz=w500','','',''],
  ['みんな','cat_03','長靴','13',1,'','','ダブルビー','青',''],
  ['みんな','cat_03','サンダルくま','14',1,'','','ホットビスケッツ','',''],
  ['みんな','cat_03','水陸両用サンダル','14',1,'','','Petit main','黒',''],
  ['みんな','cat_03','メッシュスニーカー','14',1,'','','ダブルビー','',''],
  ['みんな','cat_03','スニーカー','14',1,'','','ミキハウス','白',''],
  ['みんな','cat_03','スニーカー','14',1,'','','ミキハウス','青・ベージュ',''],
  ['みんな','cat_03','スニーカー','14',1,'','','アシックス','茶色',''],
  ['みんな','cat_03','スノースニーカー','14',1,'','','ミキハウス','赤',''],
  ['みんな','cat_03','サイドゴアブーツ','14',1,'','','Petit main','茶色',''],
  ['みんな','cat_03','ムートンブーツ','14',1,'','','ミキハウス','ベージュ',''],
  ['りょうま','cat_03','スノーブーツ','14',1,'通常','https://drive.google.com/thumbnail?id=1nBMGdNQS8AHgPR4RBTi0hStQzsq7I95w&sz=w500','ホットビスケッツ','',''],
  ['みんな','cat_03','サンダルスニーカー','14.5',1,'','','アシックス','赤',''],
  ['みんな','cat_03','スニーカー','14.5',1,'','','ミキハウス','青',''],
  ['みんな','cat_03','スノーブーツ','15',1,'','','ノースフェイス','紫',''],
  ['みんな','cat_03','ブーツ','15',1,'','','ミキハウス','車柄',''],
  ['みんな','cat_03','スノースニーカー','15',1,'','','ダブルビー','ベージュ',''],
  ['みんな','cat_03','アンパンマンスノーブーツ','15',1,'','','','青',''],
  ['みんな','cat_03','ムートンブーツ','15',1,'メルカリ出品中','','','紺',''],
  ['みんな','cat_03','スノースニーカー','15',1,'','','瞬足','紺',''],
  ['みんな','cat_03','長靴','15',1,'','','Familiar','青',''],
  ['みんな','cat_03','ミッキー水陸両用サンダル','15',1,'','','','',''],
  ['みんな','cat_03','サンダルスニーカー','15',1,'','','ダブルビー','黄・緑',''],
  ['みんな','cat_03','ミッキースニーカー','15',1,'','','adidas','',''],
  ['みんな','cat_03','スニーカー','15',1,'','','ミキハウス','赤','室内で履いた'],
  ['みんな','cat_03','スニーカー','15',1,'','','アシックス','水色','売る？'],
  ['みんな','cat_03','スニーカー','15',1,'','','アシックス','水色',''],
  ['みんな','cat_03','水陸両用サンダル','15.5',1,'','','ニューバランス','ピンク',''],
  ['みんな','cat_03','スニーカー','15.5',1,'','','アシックス','水色',''],
  ['みんな','cat_03','ハートサンダル','16',1,'','','Petit main','ゴールド',''],
  ['みんな','cat_03','サンダル','16',1,'','','ホットビスケッツ','赤',''],
  ['みんな','cat_03','サンダル','16',1,'','','Petit main','茶色','新品'],
  ['みんな','cat_03','水陸両用サンダル','16',1,'','','ブランシェス','黒',''],
  ['みんな','cat_03','ディズニーリゾートビーチサンダル','16',1,'','','','赤',''],
  ['みんな','cat_03','サイドゴアブーツ','16',1,'','','Petit main','ベージュ',''],
  ['みれい','cat_03','長靴','16',1,'通常','https://drive.google.com/thumbnail?id=1D5nvafWxdouVlafbUcjUvLCoaBCnuGvP&sz=w500','ダブルビー','',''],
  ['みんな','cat_03','長靴','16',1,'','','ノースフェイス','黒','新品'],
  ['みんな','cat_03','ブーツ','16',1,'','','Familiar','赤',''],
  ['みんな','cat_03','ムートンブーツうさこ','16',1,'','','ミキハウス','茶色',''],
  ['みんな','cat_03','スノースニーカー','16',1,'','','瞬足','赤','新品'],
  ['みんな','cat_03','スニーカー','16',1,'','','ダブルビー','',''],
  ['みんな','cat_03','スニーカー','16',1,'','','アシックス','紫','売る'],
  ['みんな','cat_03','ハート柄スニーカー','16',1,'','','イフミー','ミント','売る'],
  ['みんな','cat_03','光るスニーカー','16',1,'','','わんだふるプリキュア','',''],
  ['みれい','cat_03','花柄スニーカー','16.5',1,'通常','https://drive.google.com/thumbnail?id=11c7gUnSkdDRLJGQ22CzKe1RgcPBlJwtv&sz=w500','ミキハウス','','保育園用'],
  ['みれい','cat_03','スニーカー','16.5',1,'通常','','ムーンスター','','保育園用'],
  ['みんな','cat_03','スニーカー','16.5',1,'','','ミキハウス','黒',''],
  ['みんな','cat_03','セレモニーシューズ','17',1,'','','Familiar','黒',''],
  ['みんな','cat_03','ハート柄スニーカー','17',1,'','','イフミー','ミント',''],
  ['みんな','cat_03','スニーカー','17',1,'','','瞬足','紫',''],
  ['みんな','cat_03','サンダル','17',1,'','','ベベ','赤',''],
  ['みれい','cat_03','スニーカー','17',1,'通常','https://drive.google.com/thumbnail?id=1eKQEeh4Ut_Dvz_K9n8Ez3neAoP_sF7TW&sz=w500','ANAPKIDS','',''],
  ['みんな','cat_03','スノーブーツ','17',1,'','','ノースフェイス','黒','新品'],
  ['みんな','cat_03','スノースニーカー','17',1,'','','ノースフェイス','黒','新品'],
  ['みれい','cat_03','ボアブーツ','17',1,'通常','https://drive.google.com/thumbnail?id=1W0yxT7ShK_cVFe5qoCRSp6NfXN0CF_W3&sz=w500','ノースフェイス','',''],
  ['みんな','cat_03','サンダル','17',1,'','','ノースフェイス','黒','新品'],
  ['みんな','cat_03','スノーブーツ星柄','18',1,'','','ミキハウス','青','新品'],
  ['みれい','cat_03','アンパンマンスノーブーツ','18',1,'通常','https://drive.google.com/thumbnail?id=1G0x2-rWc4NkJ3pmk-A3_jAcE7MKwxNTO&sz=w500','','',''],
  ['みんな','cat_03','キラキラサンダル','18',1,'','','Any fam','ピンク','新品'],
  ['みんな','cat_03','キラキラ長靴','18',1,'','','Hi my zoo','水色','新品'],
  ['みんな','cat_03','アナ雪長靴','18',1,'','','','水色','新品'],
  ['みんな','cat_03','ムートンブーツ','18',1,'','','Petit main','ピンク',''],
  ['みんな','cat_03','もこもこローファー','18',1,'','','green label','ベージュ',''],
  ['みんな','cat_03','ねこパンプス','19',1,'','','Any fam','',''],
  ['みんな','cat_03','ピカチュウスニーカー','19',1,'','','puma','黄色',''],
  ['みんな','cat_03','ランニングスニーカー','20',1,'','','ノースフェイス','赤',''],
  ['みんな','cat_03','サンダル','20',1,'','','chaco','黒','詳細サイズ不明'],
  ['みれい','cat_02','タンクトップ肌着','90',2,'','','','','置き着，7月中⇒りょうまへ'],
  ['みれい','cat_02','靴下','',2,'','','','','置き着'],
  ['みれい','cat_02','半袖','90',1,'','','','','置き着，りょうまへ'],
  ['みれい','cat_02','半袖','90',1,'','','','','置き着，秋前半まで→りょうまへ'],
  ['みれい','cat_02','短パン','100',2,'','','','',''],
  ['みれい','cat_02','タンクトップ肌着','100',8,'','','','',''],
  ['みれい','cat_02','靴下','',9,'','','','',''],
  ['みれい','cat_02','半袖','100',7,'','','','',''],
  ['みれい','cat_02','水陸両用肌着','100',1,'','','','',''],
  ['みれい','cat_02','厚手半袖','100',1,'','','','','9月～'],
  ['みれい','cat_02','短パン','100',5,'','','','',''],
  ['みれい','cat_02','水陸両用短パン','100',4,'','','','',''],
  ['みれい','cat_02','7分丈ズボン','100',5,'','','','',''],
  ['みれい','cat_02','無地メッシュ半袖肌着','100',2,'','','','白','2025秋'],
  ['みれい','cat_02','靴下','',2,'','','','','2025秋'],
  ['みれい','cat_02','薄手7分丈','100',2,'','','','','2025秋'],
  ['りょうま','cat_02','半袖','90',1,'','','','','2025秋，前半'],
  ['みれい','cat_02','(名前不明)','95',1,'','','','','2025秋，前半'],
  ['みれい','cat_02','長袖','100',2,'','','','','2025秋，後半'],
  ['みれい','cat_02','長レギンス','100',2,'','','','','2025秋，後半'],
  ['みれい','cat_02','タンクトップ肌着','100',8,'','','','','前半'],
  ['みれい','cat_02','無地メッシュ半袖肌着','100',2,'','','','白','前半，置き着'],
  ['みれい','cat_02','靴下','',9,'','','','','前半，うち置き着2セット'],
  ['みれい','cat_02','半袖','100',10,'','','','','前半，1枚水陸両用，うち置き着2枚'],
  ['みれい','cat_02','厚手半袖','100',1,'','','','','前半'],
  ['みれい','cat_02','短パン','100',7,'','','','','前半'],
  ['みれい','cat_02','水陸両用短パン','100',4,'','','','','前半'],
  ['みれい','cat_02','薄手7分丈','100',8,'','','','','前半，うち置き着2セット＋新品2枚'],
  ['みれい','cat_02','薄手7分丈','90',1,'','','','','前半，普段着？'],
  ['みれい','cat_02','半袖メッシュ肌着','100',9,'','','','','後半，うち置き着2枚'],
  ['みれい','cat_02','薄手長袖','100',3,'','','','','1枚追加する？'],
  ['みれい','cat_01','マミーポコ','ビッグ',3.5,'通常','https://drive.google.com/thumbnail?id=1nDT4Mq69upha5mES0rYesgGoH-CfoXrL&sz=w500','マミーポコ','',''],
  ['みんな','cat_05','ダウンベスト','100',1,'通常','https://drive.google.com/thumbnail?id=1s1988DC8AECb5xUzEXlE0_5RoOtcLzBn&sz=w500','ラルフローレン','',''],
  ['みんな','cat_06','ミッキートレーナー','100',1,'通常','https://drive.google.com/thumbnail?id=1r9pNJQ4uLwPnC2n2SlfXa0pfHo2Gstos&sz=w500','ディズニー','白',''],
  ['みんな','cat_06','トレーナー','6T',1,'通常','https://drive.google.com/thumbnail?id=1Gr4rV8gOv46IYUC-RkZ_iBvcK8fggGUw&sz=w500','ラルフローレン','白',''],
  ['みんな','cat_06','トレーナー','100',1,'通常','https://drive.google.com/thumbnail?id=1TJ1DBauvr_CdvHbGwyC0GvibGRY9tDy9&sz=w500','mikiHOUSE','グレー','新品タグ付き'],
  ['みれい','cat_06','ワンピース','110',1,'通常','https://drive.google.com/thumbnail?id=1fG-8mB5iJ3S-fJxVOJiuGqi0vOVl3EZf&sz=w500','Petit main','花柄',''],
  ['みんな','cat_06','トレーナー','130',1,'通常','https://drive.google.com/thumbnail?id=18_wvq3Zxd9ffr4F5GEX-4BrNgoy3ReIs&sz=w500','ダブルビー','グレー',''],
  ['みんな','cat_05','ボアジャケット','130',1,'通常','https://drive.google.com/thumbnail?id=1z8-2EMsX3JkgY0pH3Mk0kRJ7EkwQBlEE&sz=w500','ノースフェイス','ピンク',''],
  ['みんな','cat_05','ボアジャケット','100',1,'通常','https://drive.google.com/thumbnail?id=1jcc5c41imiyTPSxSPOWsB2PZthQygN81&sz=w500','ノースフェイス','ピンク',''],
  ['みんな','cat_05','ダウンジャケット','130',1,'通常','https://drive.google.com/thumbnail?id=1Md-Md_p76GELP1m2YucRv-resYWsAhTF&sz=w500','SHIPS','ピンク','新品タグ付き'],
  ['りょうま','cat_05','キルティングジャケット','80',1,'通常','https://drive.google.com/thumbnail?id=1xWA1NDOJvN8Xfw1aw_2fOeKglYcxhDQg&sz=w500','アルマーニ','オレンジ',''],
  ['みんな','cat_08','スノーウェア','110',1,'通常','https://drive.google.com/thumbnail?id=1-Vmybn5sOD9tBe0VmbymnwlxarODjbWO&sz=w500','reseeda','',''],
  ['みんな','cat_05','ナイロンジャケット','5T',1,'通常','https://drive.google.com/thumbnail?id=1dONWuH_8KzYDYUuRkzjtdL-s74C30hkY&sz=w500','パタゴニア','青',''],
  ['みんな','cat_08','スノーウェア','130',1,'通常','https://drive.google.com/thumbnail?id=1OnoVwfN2FTWnpOqfWwfuZWEU6dwuYMdD&sz=w500','Phenix','青',''],
  ['みんな','cat_05','ナイロンジャケット','120',1,'通常','https://drive.google.com/thumbnail?id=1OVoB-aP9t6Ef0MZ2Blika1GrJ_81mo9P&sz=w500','ノースフェイス','ベージュ',''],
  ['みんな','cat_07','ハーフパンツ','100',1,'通常','https://drive.google.com/thumbnail?id=13HmyILAwmhrFL1Gym2xw8u98Y-JwoCyP&sz=w500','mikiHOUSE','青',''],
  ['みれい','cat_07','花柄ズボン','110',1,'通常','https://drive.google.com/thumbnail?id=1BhA3hWGrl0itq43CSzQSI7WmwTg4Kb96&sz=w500','Petit main','白',''],
  ['みれい','cat_07','ニットボトムス','110',1,'通常','https://drive.google.com/thumbnail?id=1Ju83PnJMSEyjkvsZkXSHmVq8JsxORC6U&sz=w500','Petit main','ピンク',''],
  ['みんな','cat_07','キラキラズボン','130',1,'通常','https://drive.google.com/thumbnail?id=1_4GmEJTjJLTndB_B3l8G_G1KHurW6qEJ&sz=w500','Petit Bateau','紺',''],
  ['みれい','cat_06','スヌーピートップス','100',1,'通常','https://drive.google.com/thumbnail?id=1SSOY3_MwQk45tXLVRaeaLtYhYHeaw7Eb&sz=w500','Petit main','ボーダー',''],
  ['みんな','cat_06','ちいかわトレーナー','110',1,'通常','https://drive.google.com/thumbnail?id=1Xk24NWdvwyu5c7h-ovHTpvC8GcX6CtNm&sz=w500','ちいかわ','白',''],
  ['みんな','cat_08','スノーウェア','120',1,'通常','https://drive.google.com/thumbnail?id=1veH_UXxQTp_sKCUr1DCYH1aAnb60bplo&sz=w500','Columbia','',''],
  ['みんな','cat_06','長袖Tシャツ','100',1,'通常','https://drive.google.com/thumbnail?id=1oApyN1hR89iIxp-red8FZpdgWra4HH_e&sz=w500','mikiHOUSE','黄色',''],
  ['みんな','cat_06','トレーナー','120',1,'通常','https://drive.google.com/thumbnail?id=1uVKJEw5Ldj3mIOqPxsLUF3HS-G0LnAW4&sz=w500','ディズニー','黄色',''],
  ['みれい','cat_09','ホットビスケッツパジャマ','120',1,'通常','https://drive.google.com/thumbnail?id=1dE_NY3G5vE0B42QucHiLq6XbIXpzUBew&sz=w500','ホットビスケッツ','',''],
  ['みれい','cat_07','ニットボトムス','110',1,'通常','https://drive.google.com/thumbnail?id=1Cq42U6BLDfLP34EEVaYP1tirme7H3NK_&sz=w500','Petit main','ベージュ','新品タグ付き'],
  ['みんな','cat_06','長袖Tシャツ','100',1,'通常','https://drive.google.com/thumbnail?id=1agclMJrqW0Xa70vEdw6DaZLE5-5bYOcZ&sz=w500','Petit Bateau','紺',''],
  ['みれい','cat_09','ミキハウスパジャマ','120',1,'通常','https://drive.google.com/thumbnail?id=1z9SygSQR328-CtkPx9FaGuCl9SJJKHQY&sz=w500','mikiHOUSE','白',''],
  ['みれい','cat_05','ナイロンパーカー','120',1,'通常','https://drive.google.com/thumbnail?id=1_IrijgVBOlrfWsHO2Ha2urFC6CUWAqCw&sz=w500','ホットビスケッツ','',''],
  ['みんな','cat_06','猫トレーナー','95',1,'通常','https://drive.google.com/thumbnail?id=1bszqZUoF-pFuRmzTHCkkbT9mHhtenAeD&sz=w500','Petit Bateau','黄色',''],
  ['みんな','cat_06','トレーナー','95',1,'通常','https://drive.google.com/thumbnail?id=1EodzHFUmGa5Frpyq_amJ_zIppDbH-B3h&sz=w500','Petit Bateau','紺',''],
  ['みんな','cat_06','トレーナー','90',1,'通常','https://drive.google.com/thumbnail?id=1G_P_bArKzjrDe6w_frGs5HiHPdZwDAOJ&sz=w500','Jacadi','水色',''],
  ['みれい','cat_06','ワンピース','6',1,'通常','https://drive.google.com/thumbnail?id=1y426og1Itl5KuLCy_-LyO_kW6DJvBn3d&sz=w500','ラルフローレン','',''],
  ['みれい','cat_06','セーター','100',1,'通常','https://drive.google.com/thumbnail?id=1gOE-rNnbJvdm6Cn45pSBtHc7Ymmdjpnn&sz=w500','ラルフローレン','',''],
  ['みれい','cat_06','トレーナー','110',1,'通常','https://drive.google.com/thumbnail?id=1rGqVNKJ88PUpRkcud3LgIs2Ci9gav_2e&sz=w500','apres les cours','',''],
  ['りょうま','cat_06','乗り物トレーナー','110',1,'通常','https://drive.google.com/thumbnail?id=1AI9bv5Rwy-ootI0rouz7qhInOPVE0O64&sz=w500','Petit Bateau','',''],
  ['りょうま','cat_07','ジーンズ','90',1,'通常','https://drive.google.com/thumbnail?id=1lr4_HUpZcKWplvrAW1WK6fVSfo9zATnl&sz=w500','ダブルビー','',''],
  ['みれい','cat_06','ワッフルトレーナー','6T',1,'通常','https://drive.google.com/thumbnail?id=1OUxJdmn4DDokMrowKYiXtuvF2JTOOm6I&sz=w500','ラルフローレン','',''],
  ['みれい','cat_06','ミッキーシャツ','110',1,'通常','https://drive.google.com/thumbnail?id=1sLh6wEiZ1PUXPtbM01Tu_FIhmx-oHUpH&sz=w500','Petit main','',''],
  ['みれい','cat_06','ミッフィートレーナー','110',1,'通常','https://drive.google.com/thumbnail?id=1T2K5JbLMMUUWWgHqOZQXwmXdLU9wGdcx&sz=w500','','',''],
  ['みれい','cat_06','うさパーカー','100',1,'通常','https://drive.google.com/thumbnail?id=1LNzkaauh1VbYAa6TiPxZmHmLglDNT19b&sz=w500','mikiHOUSE','',''],
];

// seed label → category display name in the app
const CAT_LABEL_TO_NAME: Record<string, string> = {
  cat_01: 'オムツ',
  cat_02: '保育園用品',
  cat_03: '靴',
  cat_04: '靴下',
  cat_05: 'アウター',
  cat_06: 'トップス',
  cat_07: 'ボトムス',
  cat_08: 'スノーウェア',
  cat_09: 'パジャマ',
};

function buildNotes(color: string, memo: string, status: string): string {
  const parts: string[] = [];
  if (color.trim()) parts.push(`色：${color.trim()}`);
  if (memo.trim())  parts.push(memo.trim());
  if (status.trim() && status.trim() !== '通常') parts.push(status.trim());
  return parts.join('　');
}

export async function importSeedData(
  groupId: string,
  categories: Category[],
  children: Child[],
  userId: string,
  onProgress?: (count: number, total: number) => void,
): Promise<number> {
  // Build name → id maps from the existing group
  const catNameToId: Record<string, string> = {};
  for (const cat of categories) catNameToId[cat.name] = cat.id;

  const childNameToId: Record<string, string> = {};
  for (const child of children) childNameToId[child.name] = child.id;

  const now = Timestamp.now();
  const itemsCol = collection(db, 'groups', groupId, 'items');
  let count = 0;

  for (const [who, catLabel, name, size, qty, status, imageUrl, brand, color, memo] of rows) {
    // Resolve childId
    let childId: string;
    if (who === 'みんな' || who === '' || who === ' ') {
      childId = 'all';
    } else {
      childId = childNameToId[who] ?? 'all';
    }

    // Resolve categoryId
    const catName = CAT_LABEL_TO_NAME[catLabel] ?? catLabel;
    const categoryId = catNameToId[catName] ?? catLabel;

    await addDoc(itemsCol, {
      name:       name.trim(),
      categoryId,
      childId,
      size:       size.trim(),
      brand:      brand.trim(),
      quantity:   qty,
      notes:      buildNotes(color, memo, status),
      imageUrl:   imageUrl.trim() || null,
      createdAt:  now,
      updatedAt:  now,
      createdBy:  userId,
    });

    count++;
    onProgress?.(count, rows.length);
  }

  return count;
}

export const SEED_ITEM_COUNT = rows.length;
