import translationData from './lang.yaml'

const enObj: Record<string, string> = {}
const zhObj: Record<string, string> = {}

interface LangData {
    [key: string]: {
        en?: string
        zh?: string
    }
}

const data = translationData as LangData

Object.entries(data).forEach(([key, val]) => {
    const enStr = val.en || ''
    const zhStr = val.zh || ''
    enObj[key] = enStr
    zhObj[key] = zhStr
})

const messages = {
    en: enObj,
    zh: zhObj
}

export default messages
