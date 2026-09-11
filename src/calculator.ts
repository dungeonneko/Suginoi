import type { Building, DinnerOption, GuestCounts, RoomType } from './types'

export const RATE = {
  adults: 1,
  elementary: 0.7,
  toddler: 0.5,
  infant: 0,
} as const

export interface GuestLine {
  categoryLabel: string
  count: number
  rate: number
  unitPrice: number
  subtotal: number
}

export interface PriceResult {
  perPersonBase: number // 基本料金 + 夕食追加（人数割前）
  lines: GuestLine[]
  total: number
}

/** 部屋タイプ選択に必要な「宿泊人数」（乳幼児は部屋定員に含めない） */
export function occupancyCount(guests: GuestCounts): number {
  return guests.adults + guests.elementary + guests.toddler
}

export function totalGuestCount(guests: GuestCounts): number {
  return occupancyCount(guests) + guests.infant
}

export function calculatePrice(
  building: Building,
  dinner: DinnerOption | null,
  roomType: RoomType,
  guests: GuestCounts,
): PriceResult {
  const base = building.basePrice + (dinner?.price ?? 0)

  const perPersonBase = roomType.isSingle ? base * 1.5 : base + roomType.delta

  const categories: { key: keyof GuestCounts; label: string; rate: number }[] = [
    { key: 'adults', label: '大人', rate: RATE.adults },
    { key: 'elementary', label: '小学生', rate: RATE.elementary },
    { key: 'toddler', label: '幼児（3歳以上）', rate: RATE.toddler },
    { key: 'infant', label: '乳幼児（2歳以下）', rate: RATE.infant },
  ]

  const lines: GuestLine[] = categories
    .map(({ key, label, rate }) => {
      const count = guests[key]
      const unitPrice = Math.round(perPersonBase * rate)
      return { categoryLabel: label, count, rate, unitPrice, subtotal: unitPrice * count }
    })
    .filter((line) => line.count > 0)

  const total = lines.reduce((sum, line) => sum + line.subtotal, 0)

  return { perPersonBase, lines, total }
}
