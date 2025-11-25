declare module '@/utils/api.js' {
  const api: {
    get: (url: string, params?: any) => Promise<any>
    post: (url: string, data?: any) => Promise<any>
    put: (url: string, data?: any) => Promise<any>
    delete: (url: string, data?: any) => Promise<any>
  }
  export default api
}

declare module '@/firebase' {
  export const auth: any
  export const provider: any
}