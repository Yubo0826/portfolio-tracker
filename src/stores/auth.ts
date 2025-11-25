import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
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

interface UserData {
  uid: string
  email: string
  displayName: string
}

export const useAuthStore = defineStore('auth', () => {
  // 沒登入的話就是demo account
  const user: Ref<UserData> = ref({
    uid: 'demo-user',
    email: 'demo@example.com',
    displayName: 'Demo User'
  })

  const login = async (): Promise<void> => {
    await setPersistence(auth, browserLocalPersistence)
    try {
      const result = await signInWithPopup(auth, provider)
      user.value = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || ''
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
        displayName: user.value.displayName
      }

      api.post('/api/user', userData)
        .then((response: any) => {
          console.log('User data saved successfully:', response)
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
        displayName: currentUser.displayName || ''
      }
    } else {
      user.value = {
        uid: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User'
      }
    }
    console.log(currentUser)
    console.log('Auth state changed:', currentUser ? currentUser.email : 'No user logged in')
  })

  return { user, login, logout }
})