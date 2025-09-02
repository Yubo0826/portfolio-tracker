import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, provider } from '@/firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import api from '@/utils/api.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const login = async () => {
    await setPersistence(auth, browserLocalPersistence)
    try {
      const result = await signInWithPopup(auth, provider)
      user.value = result.user
      saveUserData()
      console.log('登入成功', user.value.email)
    } catch (err) {
      console.error('登入失敗', err)
    }
  }

  const logout = async () => {
    await signOut(auth)
    user.value = null
  }

  const saveUserData = () => {
    if (user.value) {
      const userData = {
        uid: user.value.uid,
        email: user.value.email,
        displayName: user.value.displayName
      }

      api.post('http://localhost:3000/api/user', userData)
        .then(response => {
          console.log('User data saved successfully:', response)
        })
        .catch(error => {
          console.error('Error saving user data:', error)
        })
    }
  }

  // 監聽登入狀態
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    console.log('Auth state changed:', currentUser ? currentUser.email : 'No user logged in')
  })

  return { user, login, logout }
})
