export interface GuestCounts {
  adults: number
  elementary: number // 小学生: 70%
  toddler: number // 3歳以上幼児: 50%
  infant: number // 2歳以下乳幼児: 無料
}

export interface DinnerOption {
  id: string
  label: string
  price: number
  description: string
}

export interface RoomType {
  id: string
  label: string
  capacity: number // 1室あたりの利用人数
  isSingle: boolean // 1名利用（*1.5倍）かどうか
  delta: number // 基本料金への加減算（1名利用の場合は無視）
}

export interface Building {
  id: string
  name: string
  basePrice: number
  basePriceLabel: string // 朝食プラン名など
  dinnerOptions: DinnerOption[]
  roomTypes: RoomType[]
}

export interface StayDate {
  id: string
  label: string
  buildings: Building[]
}
