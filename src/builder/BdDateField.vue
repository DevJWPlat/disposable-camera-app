<script setup>
// Builder date picker. v-model is "YYYY-MM-DD", or "YYYY-MM-DDTHH:MM" with
// with-time. Times are this browser's local time (UK for the owner).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  withTime: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Choose a date' },
})
const emit = defineEmits(['update:modelValue'])

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const root = ref(null)
const open = ref(false)
const datePart = computed(() => (props.modelValue || '').slice(0, 10))
const timePart = computed(() => (props.withTime ? (props.modelValue || '').slice(11, 16) || '09:00' : ''))

const initial = datePart.value ? new Date(`${datePart.value}T12:00:00`) : new Date()
const viewYear = ref(initial.getFullYear())
const viewMonth = ref(initial.getMonth())
watch(datePart, (value) => {
  if (!value) return
  const d = new Date(`${value}T12:00:00`)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
})

function ordinal(n) {
  const s = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${s}`
}
function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)}${h < 12 ? 'am' : 'pm'}`
}

// e.g. "Sat 12th June 2027" or "Sun 13th June 2027, 9:00am"
const label = computed(() => {
  if (!datePart.value) return ''
  const d = new Date(`${datePart.value}T12:00:00`)
  const text = `${DAYS[d.getDay()]} ${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return props.withTime ? `${text}, ${timeLabel(timePart.value)}` : text
})

// Six Monday-first weeks covering the shown month.
const weeks = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1, 12)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7))
  const today = ymd(new Date())
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + w * 7 + i)
      const key = ymd(d)
      return { key, day: d.getDate(), inMonth: d.getMonth() === viewMonth.value, today: key === today, selected: key === datePart.value }
    }),
  )
})

const times = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`)

function shift(months) {
  const d = new Date(viewYear.value, viewMonth.value + months, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}
function pick(key) {
  emit('update:modelValue', props.withTime ? `${key}T${timePart.value}` : key)
  if (!props.withTime) open.value = false
}
function pickTime(value) {
  const date = datePart.value || ymd(new Date())
  emit('update:modelValue', `${date}T${value}`)
}

function onDocument(event) {
  if (open.value && root.value && !root.value.contains(event.target)) open.value = false
}
function onKey(event) {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocument)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocument)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="bd-date">
    <button type="button" class="bd-input bd-date__button" :class="{ 'bd-date__button--empty': !label }" :aria-expanded="open" @click="open = !open">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
      <span>{{ label || placeholder }}</span>
    </button>

    <div v-if="open" class="bd-cal" role="dialog" aria-label="Choose a date">
      <div class="bd-cal__head">
        <button type="button" class="bd-cal__nav" aria-label="Previous month" @click="shift(-1)">‹</button>
        <strong>{{ MONTHS[viewMonth] }} {{ viewYear }}</strong>
        <button type="button" class="bd-cal__nav" aria-label="Next month" @click="shift(1)">›</button>
      </div>
      <div class="bd-cal__grid">
        <span v-for="(d, i) in ['M', 'T', 'W', 'T', 'F', 'S', 'S']" :key="i" class="bd-cal__dow">{{ d }}</span>
        <template v-for="(week, w) in weeks" :key="w">
          <button
            v-for="cell in week"
            :key="cell.key"
            type="button"
            class="bd-cal__day"
            :class="{ 'bd-cal__day--out': !cell.inMonth, 'bd-cal__day--today': cell.today, 'bd-cal__day--on': cell.selected }"
            @click="pick(cell.key)"
          >{{ cell.day }}</button>
        </template>
      </div>
      <div v-if="withTime" class="bd-cal__time">
        <label>
          <span>Time</span>
          <select class="bd-input" :value="timePart" @change="pickTime($event.target.value)">
            <option v-for="t in times" :key="t" :value="t">{{ timeLabel(t) }}</option>
          </select>
        </label>
        <button type="button" class="bd-btn" @click="open = false">Done</button>
      </div>
    </div>
  </div>
</template>
