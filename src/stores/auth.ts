import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import { auth, provider } from '@/firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User
} from 'firebase/auth'
import api from '@/utils/api.js'
import messages from '@/i18n/index.js'
import { readStoredLocale } from '@/composables/useLocale.js'
import { usePortfolioStore } from './portfolio'

interface UserData {
  uid: string
  email: string
  displayName: string,
  photoURL?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 沒登入的話就是demo account
  const user: Ref<UserData> = ref({
    uid: 'demo-user',
    email: 'demo@example.com',
    displayName: 'Demo User'
  })
  // Firebase 還原登入狀態前為 false，避免已登入者先看到 landing page
  const authReady = ref(false)
  let resolveReady: () => void
  const ready = new Promise<void>((r) => (resolveReady = r))
  // 路由守衛用：等 Firebase 還原完登入狀態
  const whenReady = (): Promise<void> => ready

  const login = async (): Promise<void> => {
    await setPersistence(auth, browserLocalPersistence)
    try {
      const result = await signInWithPopup(auth, provider)
      user.value = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || ''
      }
      saveUserData()
      console.log('登入成功', user.value.email)
    } catch (err) {
      console.error('登入失敗', err)
    }
  }

  const logout = async (): Promise<void> => {
    await signOut(auth)
    user.value = {
      uid: 'demo-user',
      email: 'demo@example.com',
      displayName: 'Demo User'
    }
  }

  const saveUserData = (): void => {
    if (user.value) {
      const userData: UserData = {
        uid: user.value.uid,
        email: user.value.email,
        displayName: user.value.displayName,
      }

      api.post('/api/user', { ...userData, portfolioName: messages[readStoredLocale()].defaultPortfolioName })
        .then((response: any) => {
          console.log('User data saved successfully:', response)
          // 新使用者後端會一併建立預設投資組合；登入當下的 fetch 可能早於建立，補抓一次
          if (response?.user) usePortfolioStore().fetchPortfolios()
        })
        .catch((error: any) => {
          console.error('Error saving user data:', error)
        })
    }
  }

  // 監聽登入狀態
  onAuthStateChanged(auth, (currentUser: User | null) => {
    if (currentUser) {
      user.value = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || ''
      }
    } else {
      user.value = {
        uid: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User'
      }
    }
    authReady.value = true
    resolveReady()
  })

  // demo 資料所有訪客共用，後端只允許讀取
  const isDemo = computed(() => user.value.uid === 'demo-user')

  return { user, authReady, whenReady, login, logout, isDemo }
})