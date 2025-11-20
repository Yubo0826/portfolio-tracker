import toasteventbus from 'primevue/toasteventbus'

interface ToastOptions {
    severity?: 'success' | 'info' | 'warn' | 'error' | 'custom';
    summary?: string;
    detail?: string;
    life?: number;
    group?: string;
    [key: string]: any;
}

// 全域預設，可被 configure 覆蓋
const BASE: ToastOptions = {
    severity: 'custom',
    group: 'standard',
    life: 3000
}

/** 覆蓋全域預設：configure({ group, life, severity }) */
export function configure(overrides: ToastOptions = {}) {
    Object.assign(BASE, overrides)
}

function emit(payload: ToastOptions = {}) {
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
export function show(opts: ToastOptions = {}) {
    emit(opts)
}

/** 便捷方法（不寫 life 則預設 3000） */
export function success(summary: string, detail: string, opts: ToastOptions = {}) {
    emit({ severity: 'success', summary, detail, ...opts })
}
export function warn(summary: string, detail: string, opts: ToastOptions = {}) {
    emit({ severity: 'warn', summary, detail, ...opts })
}
export function error(summary: string, detail: string, opts: ToastOptions = {}) {
    emit({ severity: 'error', summary, detail, ...opts })
}
export function info(summary: string, detail: string, opts: ToastOptions = {}) {
    emit({ severity: 'info', summary, detail, ...opts })
}

/** 產生綁定特定 group 的 API（選用） */
export function withGroup(group: string) {
    return {
        show: (opts: ToastOptions = {}) => emit({ group, ...opts }),
        success: (s: string, d: string, o: ToastOptions = {}) => emit({ group, severity: 'success', summary: s, detail: d, ...o }),
        warn: (s: string, d: string, o: ToastOptions = {}) => emit({ group, severity: 'warn', summary: s, detail: d, ...o }),
        error: (s: string, d: string, o: ToastOptions = {}) => emit({ group, severity: 'error', summary: s, detail: d, ...o }),
        info: (s: string, d: string, o: ToastOptions = {}) => emit({ group, severity: 'info', summary: s, detail: d, ...o }),
    }
}
