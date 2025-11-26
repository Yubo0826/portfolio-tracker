import translationData from './lang.yaml'

const enObj = {}
const zhObj = {}

// 遞歸處理嵌套結構
function processNestedTranslations(obj, langObj, prefix = '') {
  Object.entries(obj).forEach(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (val && typeof val === 'object' && val.en !== undefined && val.zh !== undefined) {
      // 這是一個翻譯葉節點
      langObj.en[fullKey] = val.en || ''
      langObj.zh[fullKey] = val.zh || ''
    } else if (val && typeof val === 'object') {
      // 這是一個嵌套結構，繼續遞歸處理
      processNestedTranslations(val, langObj, fullKey)
    } else if (typeof val === 'string') {
      // 舊格式的兼容性處理（如果有的話）
      langObj.en[fullKey] = val
      langObj.zh[fullKey] = val
    }
  })
}

const langObj = { en: enObj, zh: zhObj }
processNestedTranslations(translationData, langObj)

const messages = {
  en: enObj,
  zh: zhObj
}

export default messages
