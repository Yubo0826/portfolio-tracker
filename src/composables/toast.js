import toasteventbus from 'primevue/toasteventbus'

// 全域預設，可被 configure 覆蓋
const BASE = {
  severity: 'custom',
  group: 'standard',
  life: 3000
}

/** 覆蓋全域預設：configure({ group, life, severity }) */
export function configure(overrides = {}) {
  Object.assign(BASE, overrides)
}

function emit(payload = {}) {
  // 確保沒帶時用預設值（life / group / severity）
  const msg = {
    ...payload,
    severity: payload.severity ?? BASE.severity,
    group: payload.group ?? BASE.group,
    life: payload.life ?? BASE.life
  }
  toasteventbus.emit('add', msg)
}

/** 通用顯示：show({ type, summary, detail, ...PrimeVueMessageKeys }) */
export function show(opts = {}) {
  emit(opts)
}

/** 便捷方法（不寫 life 則預設 3000） */
export function success(summary, detail, opts = {}) {
  emit({ type: 'success', summary, detail, ...opts })
}
export function warn(summary, detail, opts = {}) {
  emit({ type: 'warn', summary, detail, ...opts })
}
export function error(summary, detail, opts = {}) {
  emit({ type: 'error', summary, detail, ...opts })
}
export function info(summary, detail, opts = {}) {
  emit({ type: 'info', summary, detail, ...opts })
}

/** 產生綁定特定 group 的 API（選用） */
export function withGroup(group) {
  return {
    show:   (opts = {}) => emit({ group, ...opts }),
    success:(s, d, o={}) => emit({ group, type:'success', summary:s, detail:d, ...o }),
    warn:   (s, d, o={}) => emit({ group, type:'warn',    summary:s, detail:d, ...o }),
    error:  (s, d, o={}) => emit({ group, type:'error',   summary:s, detail:d, ...o }),
    info:   (s, d, o={}) => emit({ group, type:'info',    summary:s, detail:d, ...o }),
  }
}
