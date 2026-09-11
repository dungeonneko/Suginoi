import type { StayDate, RoomType } from './types'

// 1室1名利用は共通で「部屋タイプ選択不可・*1.5倍」
function singleRoomType(label: string): RoomType {
  return { id: 'single', label, capacity: 1, isSingle: true, delta: 0 }
}

const nijiKan: StayDate['buildings'][number] = {
  id: 'niji',
  name: '虹館',
  basePrice: 11000,
  basePriceLabel: 'シーダパレス朝食付き',
  dinnerOptions: [
    { id: 'cedar', label: 'シーダパレス', price: 5000, description: 'シーダパレスでの夕食追加' },
    { id: 'ariran', label: '亜李蘭離宮', price: 7000, description: '亜李蘭離宮での夕食追加' },
  ],
  roomTypes: [
    singleRoomType('1室1名利用（部屋タイプ選択不可）'),
    { id: 'twin', label: '1室2名利用（カジュアルツイン）', capacity: 2, isSingle: false, delta: 0 },
    { id: 'double', label: '1室2名利用（カジュアルダブル）', capacity: 2, isSingle: false, delta: 0 },
    { id: 'loft3', label: '1室3名利用（カジュアルロフト）', capacity: 3, isSingle: false, delta: -1000 },
    { id: 'loft4', label: '1室4名利用（カジュアルロフト）', capacity: 4, isSingle: false, delta: -2000 },
    { id: 'skip3', label: '1室3名利用（カジュアルスキップ）', capacity: 3, isSingle: false, delta: -1000 },
    { id: 'skip4', label: '1室4名利用（カジュアルスキップ）', capacity: 4, isSingle: false, delta: -2000 },
  ],
}

const hoshiKan: StayDate['buildings'][number] = {
  id: 'hoshi',
  name: '星館',
  basePrice: 13000,
  basePriceLabel: '和ダイニング星朝食付き',
  dinnerOptions: [
    { id: 'cedar', label: 'シーダパレス', price: 5000, description: 'シーダパレスでの夕食追加＋朝食シーダパレスに変更' },
    { id: 'hoshi', label: '和ダイニング星', price: 7000, description: '和ダイニング星での夕食追加' },
    { id: 'ariran', label: '亜李蘭離宮', price: 7000, description: '亜李蘭離宮での夕食追加' },
    { id: 'sai', label: '和料理 彩SAI', price: 15000, description: '彩SAIでの夕食追加' },
  ],
  roomTypes: [
    singleRoomType('1室1名利用（部屋タイプ選択不可・スタンダード山）'),
    { id: 'yama2', label: '1室2名利用（スタンダード山）', capacity: 2, isSingle: false, delta: 0 },
    { id: 'yama3', label: '1室3名利用（スタンダード山）', capacity: 3, isSingle: false, delta: -1000 },
    { id: 'yama4', label: '1室4名利用（スタンダード山）', capacity: 4, isSingle: false, delta: -2000 },
    { id: 'umi2', label: '1室2名利用（スタンダード海）', capacity: 2, isSingle: false, delta: 2000 },
    { id: 'umi3', label: '1室3名利用（スタンダード海）', capacity: 3, isSingle: false, delta: 1000 },
    { id: 'umi4', label: '1室4名利用（スタンダード海）', capacity: 4, isSingle: false, delta: 0 },
  ],
}

const soraKan: StayDate['buildings'][number] = {
  id: 'sora',
  name: '宙館',
  basePrice: 16000,
  basePriceLabel: 'TERRACE&DINING SORA朝食付き',
  dinnerOptions: [
    { id: 'cedar', label: 'シーダパレス', price: 5000, description: 'シーダパレスでの夕食追加＋朝食シーダパレスに変更' },
    { id: 'sora', label: 'TERRACE&DINING SORA', price: 7000, description: 'TERRACE&DINING SORAでの夕食追加' },
    { id: 'ariran', label: '亜李蘭離宮', price: 7000, description: '亜李蘭離宮での夕食追加' },
    { id: 'sai', label: '和料理 彩SAI', price: 15000, description: '彩SAIでの夕食追加' },
  ],
  roomTypes: [
    singleRoomType('1室1名利用（部屋タイプ選択不可・スタンダードツイン山）'),
    { id: 'twinYama2', label: '1室2名利用（スタンダードツイン山）', capacity: 2, isSingle: false, delta: 0 },
    { id: 'premYama2', label: '1室2名利用（プレミアムスタンダード山和洋）', capacity: 2, isSingle: false, delta: 2000 },
    { id: 'premYama3', label: '1室3名利用（プレミアムスタンダード山和洋）', capacity: 3, isSingle: false, delta: 1000 },
    { id: 'premYama4', label: '1室4名利用（プレミアムスタンダード山和洋）', capacity: 4, isSingle: false, delta: 0 },
    { id: 'premUmi2', label: '1室2名利用（プレミアムスタンダード海洋室）', capacity: 2, isSingle: false, delta: 3000 },
    { id: 'premUmi3', label: '1室3名利用（プレミアムスタンダード海洋室）', capacity: 3, isSingle: false, delta: 2000 },
    { id: 'premUmi4', label: '1室4名利用（プレミアムスタンダード海洋室）', capacity: 4, isSingle: false, delta: 1000 },
    { id: 'deluxeUmi2', label: '1室2名利用（デラックス海）', capacity: 2, isSingle: false, delta: 5000 },
    { id: 'deluxeUmi3', label: '1室3名利用（デラックス海）', capacity: 3, isSingle: false, delta: 4000 },
    { id: 'deluxeUmi4', label: '1室4名利用（デラックス海）', capacity: 4, isSingle: false, delta: 3000 },
  ],
}

export const stayDates: StayDate[] = [
  {
    id: '2027-03-19',
    label: '2027年3月19日',
    buildings: [nijiKan, hoshiKan, soraKan],
  },
]
