import { defineStore } from 'pinia'
import { loginUser } from '../utils/db.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: JSON.parse(localStorage.getItem('univo_user')||'null') }),
  getters: {
    isLoggedIn: s => !!s.user,
    isAdmin:    s => s.user?.rol==='admin',
    userArea:   s => s.user?.area,
    userName:   s => s.user?.nombre,
  },
  actions: {
    async login(email, password) {
      const user = await loginUser(email, password)
      if (user) { this.user=user; localStorage.setItem('univo_user',JSON.stringify(user)); return true }
      return false
    },
    logout() { this.user=null; localStorage.removeItem('univo_user') }
  }
})