import translationData from './lang.yaml'

const enObj = {}
const zhObj = {}

Object.entries(translationData).forEach(([key, val]) => {
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
