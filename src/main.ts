import './style.css'
import { stayDates } from './data'
import { calculatePriceAcrossDates, occupancyCount, totalGuestCount } from './calculator'
import type { Building, DinnerOption, GuestCounts, GuestNames, RoomType, StayDate } from './types'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const GUEST_CATEGORY_LABELS: Record<keyof GuestCounts, string> = {
  adults: '大人',
  elementary: '小学生',
  toddler: '幼児（3歳以上）',
  infant: '乳幼児（2歳以下）',
}
const GUEST_CATEGORY_ORDER: (keyof GuestCounts)[] = ['adults', 'elementary', 'toddler', 'infant']

// 棟の一覧（IDと名称は日付をまたいで共通）
const BUILDING_LIST = stayDates[0].buildings.map((b) => ({ id: b.id, name: b.name }))

const state = {
  guests: { adults: 2, elementary: 0, toddler: 0, infant: 0 } as GuestCounts,
  guestNames: { adults: [], elementary: [], toddler: [], infant: [] } as GuestNames,
  selectedDateIds: new Set<string>([stayDates[0].id]),
  // 建物ごとの選択状態（日付をまたいで共有・1つだけ選ぶ）
  selection: {} as Record<string, { dinnerId: string | null; roomTypeId: string | null }>,
}

for (const b of BUILDING_LIST) {
  state.selection[b.id] = { dinnerId: null, roomTypeId: null }
}

syncGuestNames()

const app = document.querySelector<HTMLDivElement>('#app')!

function syncGuestNames() {
  for (const key of GUEST_CATEGORY_ORDER) {
    const count = state.guests[key]
    const names = state.guestNames[key]
    if (names.length < count) {
      names.push(...Array(count - names.length).fill(''))
    } else if (names.length > count) {
      names.length = count
    }
  }
}

function guestInput(key: keyof GuestCounts, label: string, note: string): string {
  return `
    <label class="guest-field">
      <span class="guest-field__label">${label}</span>
      <span class="guest-field__note">${note}</span>
      <input type="number" min="0" max="20" step="1" value="${state.guests[key]}" data-guest="${key}" />
    </label>
  `
}

function guestNameRows(): string {
  const rows: string[] = []
  for (const key of GUEST_CATEGORY_ORDER) {
    state.guestNames[key].forEach((name, index) => {
      rows.push(`
        <div class="guest-name-row">
          <span class="guest-name-row__label">${GUEST_CATEGORY_LABELS[key]}</span>
          <input
            type="text"
            class="guest-name-row__input"
            placeholder="ひらがなで入力"
            value="${name}"
            data-guest-name-category="${key}"
            data-guest-name-index="${index}"
          />
        </div>
      `)
    })
  }
  return rows.join('')
}

function render() {
  const occupancy = occupancyCount(state.guests)
  const total = totalGuestCount(state.guests)
  const selectedDates = stayDates.filter((d) => state.selectedDateIds.has(d.id))

  app.innerHTML = `
    <div class="page">
      <header class="page__header">
        <h1>宿泊料金シミュレーター</h1>
        <p class="page__lead">人数・宿泊日を選び、棟とオプションを比較すると、選択した宿泊日ぶんの合計料金が計算されます。</p>
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
        <div class="guest-names">
          <span class="guest-names__title">全宿泊者名（ひらがな）</span>
          ${total === 0 ? `<p class="field-note">宿泊人数を入力すると名前欄が表示されます。</p>` : guestNameRows()}
        </div>
      </section>

      <section class="panel">
        <h2>2. 精算方法について</h2>
        <ul class="settlement-note">
          <li>披露宴参加者のみ宿泊の場合、精算はこちらで事前に済ませる予定です</li>
          <li>ご家族と宿泊の場合、精算はチェックアウト時に参加者本人様にしていただき、本人様分の宿泊代をお車代に追加する予定です</li>
          <li>上記方法で問題ありそうでしたらご連絡ください</li>
        </ul>
      </section>

      <section class="panel">
        <h2>3. 宿泊日</h2>
        <div class="date-checkbox-list">
          ${stayDates
            .map(
              (d) => `
            <label class="date-checkbox">
              <input type="checkbox" data-date="${d.id}" ${state.selectedDateIds.has(d.id) ? 'checked' : ''} />
              <span class="date-checkbox__label">${d.label}</span>
              <span class="date-checkbox__desc">${d.description}</span>
            </label>
          `,
            )
            .join('')}
        </div>
      </section>

      <section class="panel">
        <h2>4. 棟とオプションを比較</h2>
        ${
          selectedDates.length === 0
            ? `<p class="building-card__warning">宿泊日を1つ以上選択してください。</p>`
            : `<div class="building-grid">
                ${BUILDING_LIST.map((b) => renderBuildingCard(b.id, selectedDates, occupancy)).join('')}
              </div>`
        }
      </section>

      <p class="disclaimer">
        ※夕食追加オプション・部屋タイプによる加減額は「1名あたり」に適用し、小学生・幼児は年齢区分の料金比率をかけた金額としています。実際の請求額と異なる場合は宿泊施設に直接ご確認ください。
      </p>
    </div>
  `

  attachEvents()
}

interface ResolvedPlan {
  buildingsPerDate: Building[]
  availableRoomTypes: RoomType[]
  roomType: RoomType | null
  dinner: DinnerOption | null
}

/** buildingId に対応する Building オブジェクトを、選択中の宿泊日ごとに集める（基本料金以外は共通） */
function resolvePlan(buildingId: string, selectedDates: StayDate[], occupancy: number): ResolvedPlan {
  const sel = state.selection[buildingId]

  const buildingsPerDate = selectedDates
    .map((date) => date.buildings.find((b) => b.id === buildingId))
    .filter((b): b is Building => Boolean(b))

  const reference = buildingsPerDate[0]

  const availableRoomTypes = reference
    ? reference.roomTypes.filter((rt) => (rt.isSingle ? occupancy === 1 : occupancy === rt.capacity))
    : []

  // 選択済みが利用可能な範囲から外れたら自動調整
  let roomTypeId = sel.roomTypeId
  if (!roomTypeId || !availableRoomTypes.some((rt) => rt.id === roomTypeId)) {
    roomTypeId = availableRoomTypes[0]?.id ?? null
    sel.roomTypeId = roomTypeId
  }
  const roomType = availableRoomTypes.find((rt) => rt.id === roomTypeId) ?? null

  const dinner = reference?.dinnerOptions.find((d) => d.id === sel.dinnerId) ?? null

  return { buildingsPerDate, availableRoomTypes, roomType, dinner }
}

function buildPlanText(
  buildingName: string,
  selectedDates: StayDate[],
  occupancy: number,
  plan: ResolvedPlan,
): string {
  const { buildingsPerDate, roomType, dinner } = plan
  const guests = state.guests

  const guestLines: string[] = []
  if (guests.adults > 0) guestLines.push(`大人 ${guests.adults}名`)
  if (guests.elementary > 0) guestLines.push(`小学生 ${guests.elementary}名`)
  if (guests.toddler > 0) guestLines.push(`幼児（3歳以上） ${guests.toddler}名`)
  if (guests.infant > 0) guestLines.push(`乳幼児（2歳以下） ${guests.infant}名`)

  const nameLines: string[] = []
  for (const key of GUEST_CATEGORY_ORDER) {
    for (const name of state.guestNames[key]) {
      if (name.trim()) nameLines.push(`　${name.trim()}（${GUEST_CATEGORY_LABELS[key]}）`)
    }
  }

  const lines = [
    `【${buildingName}】`,
    `宿泊日：`,
    ...selectedDates.map((d) => `　${d.label}`),
    `人数：${guestLines.join('、') || 'なし'}`,
    `宿泊者名：`,
    ...(nameLines.length > 0 ? nameLines : ['　未入力']),
  ]

  if (occupancy === 0) {
    lines.push('人数が未入力のため、部屋タイプ・合計金額は未確定です。')
    return lines.join('\n')
  }

  if (!roomType) {
    lines.push(`この人数（${occupancy}名）に対応する部屋タイプがありません。`)
    return lines.join('\n')
  }

  lines.push('基本料金：')
  selectedDates.forEach((date, i) => {
    lines.push(`　${date.label} ${yen.format(buildingsPerDate[i].basePrice)}`)
  })
  lines.push(`　${buildingsPerDate[0].basePriceLabel}`)

  lines.push(`夕食追加：${dinner ? `${dinner.label}（${yen.format(dinner.price)}）` : '追加なし'}`)
  lines.push(`部屋タイプ：${roomType.label}`)

  const result = calculatePriceAcrossDates(buildingsPerDate, dinner, roomType, guests)
  lines.push('内訳：')
  for (const dateResult of result.perDate) {
    for (const line of dateResult.lines) {
      lines.push(`　${line.categoryLabel} × ${line.count}　${yen.format(line.unitPrice)} × ${line.count} = ${yen.format(line.subtotal)}`)
    }
  }
  lines.push(`合計：${yen.format(result.total)}`)

  return lines.join('\n')
}

function renderBuildingCard(buildingId: string, selectedDates: StayDate[], occupancy: number): string {
  const plan = resolvePlan(buildingId, selectedDates, occupancy)
  const { buildingsPerDate, availableRoomTypes, roomType, dinner } = plan
  const reference = buildingsPerDate[0]
  const roomTypeId = roomType?.id ?? null

  if (!reference) {
    return ''
  }

  const resultHtml = (() => {
    if (occupancy === 0) {
      return `<p class="building-card__warning">大人・小学生・幼児のいずれかを1名以上入力してください。</p>`
    }
    if (!roomType) {
      return `<p class="building-card__warning">この人数（${occupancy}名）に対応する部屋タイプがありません。</p>`
    }
    const result = calculatePriceAcrossDates(buildingsPerDate, dinner, roomType, state.guests)
    return `
      <table class="price-table">
        ${result.perDate
          .map(
            (dateResult, i) => `
          <tr class="price-table__date-row">
            <td colspan="3">${selectedDates[i].label}</td>
          </tr>
          ${dateResult.lines
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
        `,
          )
          .join('')}
      </table>
      <p class="building-card__total">合計 <strong>${yen.format(result.total)}</strong></p>
    `
  })()

  return `
    <article class="building-card" data-building="${buildingId}">
      <h3>${reference.name}</h3>
      <p class="building-card__base">
        基本料金：
        ${selectedDates.map((d, i) => `<br />　${d.label} ${yen.format(buildingsPerDate[i].basePrice)}`).join('')}
        <br />　${reference.basePriceLabel}
      </p>

      <label class="field">
        <span>夕食追加オプション</span>
        <select data-role="dinner" data-building="${buildingId}">
          <option value="" ${dinner === null ? 'selected' : ''}>追加なし</option>
          ${reference.dinnerOptions
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
        <select data-role="roomType" data-building="${buildingId}" ${availableRoomTypes.length === 0 ? 'disabled' : ''}>
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

      <button type="button" class="copy-button" data-role="copy" data-building="${buildingId}">
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
      syncGuestNames()
      render()
    })
  })

  app.querySelectorAll<HTMLInputElement>('input[data-guest-name-category]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.guestNameCategory as keyof GuestCounts
      const index = Number(input.dataset.guestNameIndex)
      state.guestNames[key][index] = input.value
    })
  })

  app.querySelectorAll<HTMLInputElement>('input[data-date]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const dateId = checkbox.dataset.date!
      if (checkbox.checked) {
        state.selectedDateIds.add(dateId)
      } else {
        state.selectedDateIds.delete(dateId)
      }
      render()
    })
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
      const selectedDates = stayDates.filter((d) => state.selectedDateIds.has(d.id))
      const occupancy = occupancyCount(state.guests)
      const plan = resolvePlan(buildingId, selectedDates, occupancy)
      const buildingName = plan.buildingsPerDate[0]?.name ?? BUILDING_LIST.find((b) => b.id === buildingId)!.name
      const text = buildPlanText(buildingName, selectedDates, occupancy, plan)
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
