import './style.css'
import { stayDates } from './data'
import { calculatePrice, occupancyCount, totalGuestCount } from './calculator'
import type { Building, DinnerOption, GuestCounts, RoomType, StayDate } from './types'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const state = {
  guests: { adults: 2, elementary: 0, toddler: 0, infant: 0 } as GuestCounts,
  dateId: stayDates[0].id,
  // 建物ごとの選択状態
  selection: {} as Record<string, { dinnerId: string | null; roomTypeId: string | null }>,
}

for (const b of stayDates[0].buildings) {
  state.selection[b.id] = { dinnerId: null, roomTypeId: null }
}

const app = document.querySelector<HTMLDivElement>('#app')!

function guestInput(key: keyof GuestCounts, label: string, note: string): string {
  return `
    <label class="guest-field">
      <span class="guest-field__label">${label}</span>
      <span class="guest-field__note">${note}</span>
      <input type="number" min="0" max="20" step="1" value="${state.guests[key]}" data-guest="${key}" />
    </label>
  `
}

function render() {
  const date = stayDates.find((d) => d.id === state.dateId)!
  const occupancy = occupancyCount(state.guests)
  const total = totalGuestCount(state.guests)

  app.innerHTML = `
    <div class="page">
      <header class="page__header">
        <h1>宿泊料金シミュレーター</h1>
        <p class="page__lead">人数・宿泊日・棟とオプションを選ぶと、各棟の料金をその場で比較できます。</p>
      </header>

      <section class="panel">
        <h2>1. 宿泊人数</h2>
        <div class="guest-grid">
          ${guestInput('adults', '大人', '　')}
          ${guestInput('elementary', '小学生', '大人料金の70%')}
          ${guestInput('toddler', '幼児（3歳以上）', '大人料金の50%')}
          ${guestInput('infant', '乳幼児（2歳以下）', '無料')}
        </div>
        <p class="guest-summary">
          合計 ${total}名（部屋定員としてカウントする人数：${occupancy}名 ※乳幼児は定員に含みません）
        </p>
      </section>

      <section class="panel">
        <h2>2. 宿泊日</h2>
        <div class="date-select">
          <select id="date-select">
            ${stayDates.map((d) => `<option value="${d.id}" ${d.id === state.dateId ? 'selected' : ''}>${d.label}</option>`).join('')}
          </select>
        </div>
      </section>

      <section class="panel">
        <h2>3. 棟とオプションを比較</h2>
        <div class="building-grid">
          ${date.buildings.map((b) => renderBuildingCard(b, occupancy)).join('')}
        </div>
      </section>

      <p class="disclaimer">
        ※夕食追加オプション・部屋タイプによる加減額は「1名あたり」に適用し、小学生・幼児は年齢区分の料金比率をかけた金額としています。実際の請求額と異なる場合は宿泊施設に直接ご確認ください。
      </p>
    </div>
  `

  attachEvents()
}

interface ResolvedPlan {
  availableRoomTypes: RoomType[]
  roomType: RoomType | null
  dinner: DinnerOption | null
}

function resolvePlan(building: Building, occupancy: number): ResolvedPlan {
  const sel = state.selection[building.id]

  const availableRoomTypes = building.roomTypes.filter((rt) =>
    rt.isSingle ? occupancy === 1 : occupancy === rt.capacity,
  )

  // 選択済みが利用可能な範囲から外れたら自動調整
  let roomTypeId = sel.roomTypeId
  if (!roomTypeId || !availableRoomTypes.some((rt) => rt.id === roomTypeId)) {
    roomTypeId = availableRoomTypes[0]?.id ?? null
    sel.roomTypeId = roomTypeId
  }
  const roomType = availableRoomTypes.find((rt) => rt.id === roomTypeId) ?? null

  const dinner = building.dinnerOptions.find((d) => d.id === sel.dinnerId) ?? null

  return { availableRoomTypes, roomType, dinner }
}

function buildPlanText(
  building: Building,
  date: StayDate,
  occupancy: number,
  plan: ResolvedPlan,
): string {
  const { roomType, dinner } = plan
  const guests = state.guests

  const guestLines: string[] = []
  if (guests.adults > 0) guestLines.push(`大人 ${guests.adults}名`)
  if (guests.elementary > 0) guestLines.push(`小学生 ${guests.elementary}名`)
  if (guests.toddler > 0) guestLines.push(`幼児（3歳以上） ${guests.toddler}名`)
  if (guests.infant > 0) guestLines.push(`乳幼児（2歳以下） ${guests.infant}名`)

  const lines = [
    `【${building.name}】`,
    `宿泊日：${date.label}`,
    `人数：${guestLines.join('、') || 'なし'}`,
    `基本料金：${yen.format(building.basePrice)}（${building.basePriceLabel}）`,
    `夕食追加：${dinner ? `${dinner.label}（${yen.format(dinner.price)}）` : '追加なし'}`,
  ]

  if (occupancy === 0) {
    lines.push('人数が未入力のため、部屋タイプ・合計金額は未確定です。')
    return lines.join('\n')
  }

  if (!roomType) {
    lines.push(`この人数（${occupancy}名）に対応する部屋タイプがありません。`)
    return lines.join('\n')
  }

  lines.push(`部屋タイプ：${roomType.label}`)

  const result = calculatePrice(building, dinner, roomType, guests)
  lines.push('内訳：')
  for (const line of result.lines) {
    lines.push(`　${line.categoryLabel} × ${line.count}　${yen.format(line.unitPrice)} × ${line.count} = ${yen.format(line.subtotal)}`)
  }
  lines.push(`合計：${yen.format(result.total)}`)

  return lines.join('\n')
}

function renderBuildingCard(building: Building, occupancy: number): string {
  const { availableRoomTypes, roomType, dinner } = resolvePlan(building, occupancy)
  const roomTypeId = roomType?.id ?? null

  const resultHtml = (() => {
    if (occupancy === 0) {
      return `<p class="building-card__warning">大人・小学生・幼児のいずれかを1名以上入力してください。</p>`
    }
    if (!roomType) {
      return `<p class="building-card__warning">この人数（${occupancy}名）に対応する部屋タイプがありません。</p>`
    }
    const result = calculatePrice(building, dinner, roomType, state.guests)
    return `
      <table class="price-table">
        ${result.lines
          .map(
            (line) => `
          <tr>
            <td>${line.categoryLabel} × ${line.count}</td>
            <td class="price-table__num">${yen.format(line.unitPrice)}</td>
            <td class="price-table__num">${yen.format(line.subtotal)}</td>
          </tr>
        `,
          )
          .join('')}
      </table>
      <p class="building-card__total">合計 <strong>${yen.format(result.total)}</strong></p>
    `
  })()

  return `
    <article class="building-card" data-building="${building.id}">
      <h3>${building.name}</h3>
      <p class="building-card__base">基本料金 ${yen.format(building.basePrice)}</br>（${building.basePriceLabel}）</p>

      <label class="field">
        <span>夕食追加オプション</span>
        <select data-role="dinner" data-building="${building.id}">
          <option value="" ${dinner === null ? 'selected' : ''}>追加なし</option>
          ${building.dinnerOptions
            .map(
              (d) =>
                `<option value="${d.id}" ${dinner?.id === d.id ? 'selected' : ''}>${d.label}（${yen.format(d.price)}）</option>`,
            )
            .join('')}
        </select>
      </label>
      ${dinner ? `<p class="field-note">${dinner.description}</p>` : ''}

      <label class="field">
        <span>部屋タイプ</span>
        <select data-role="roomType" data-building="${building.id}" ${availableRoomTypes.length === 0 ? 'disabled' : ''}>
          ${
            availableRoomTypes.length === 0
              ? `<option>選択できる部屋タイプがありません</option>`
              : availableRoomTypes
                  .map(
                    (rt) =>
                      `<option value="${rt.id}" ${rt.id === roomTypeId ? 'selected' : ''}>${rt.label}${rt.isSingle ? '（×1.5）' : rt.delta !== 0 ? `（${rt.delta > 0 ? '+' : ''}${rt.delta}）` : ''}</option>`,
                  )
                  .join('')
          }
        </select>
      </label>

      <div class="building-card__result">
        ${resultHtml}
      </div>

      <button type="button" class="copy-button" data-role="copy" data-building="${building.id}">
        宿泊プランをコピー
      </button>
    </article>
  `
}

function attachEvents() {
  app.querySelectorAll<HTMLInputElement>('input[data-guest]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.guest as keyof GuestCounts
      const value = Math.max(0, Math.floor(Number(input.value) || 0))
      state.guests[key] = value
      render()
    })
  })

  app.querySelector<HTMLSelectElement>('#date-select')?.addEventListener('change', (e) => {
    state.dateId = (e.target as HTMLSelectElement).value
    render()
  })

  app.querySelectorAll<HTMLSelectElement>('select[data-role="dinner"]').forEach((select) => {
    select.addEventListener('change', () => {
      const buildingId = select.dataset.building!
      state.selection[buildingId].dinnerId = select.value || null
      render()
    })
  })

  app.querySelectorAll<HTMLSelectElement>('select[data-role="roomType"]').forEach((select) => {
    select.addEventListener('change', () => {
      const buildingId = select.dataset.building!
      state.selection[buildingId].roomTypeId = select.value || null
      render()
    })
  })

  app.querySelectorAll<HTMLButtonElement>('button[data-role="copy"]').forEach((button) => {
    button.addEventListener('click', () => {
      const buildingId = button.dataset.building!
      const date = stayDates.find((d) => d.id === state.dateId)!
      const building = date.buildings.find((b) => b.id === buildingId)!
      const occupancy = occupancyCount(state.guests)
      const plan = resolvePlan(building, occupancy)
      const text = buildPlanText(building, date, occupancy, plan)
      copyToClipboard(text, button)
    })
  })
}

async function copyToClipboard(text: string, button: HTMLButtonElement) {
  const originalLabel = button.textContent
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    button.textContent = 'コピーしました'
    button.classList.add('copy-button--done')
  } catch {
    button.textContent = 'コピーに失敗しました'
  } finally {
    setTimeout(() => {
      button.textContent = originalLabel
      button.classList.remove('copy-button--done')
    }, 1800)
  }
}

render()
