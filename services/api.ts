import axios, { Axios, AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies()
let isRefreshing = false;
let failedRequestQueue: any[] = []

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
})

api.interceptors.response.use(res => res, (error: AxiosError<any>) => {
  if (error.response?.status === 401) {
    if (error.response.data.code === "token.expired") {
      cookies = parseCookies()

      const { 'nextauth.refreshToken': refreshToken } = cookies
      const originalConfig = error.config    

      if (!isRefreshing) {
        isRefreshing = true
        
        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data
  
          const cookieOptions = {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/"
          }
    
          setCookie(undefined, "nextauth.token", token, cookieOptions)
          setCookie(undefined, "nextauth.refreshToken", response.data.refreshToken, cookieOptions)
  
          api.defaults.headers['Authorization'] = `Bearer ${token}`

          failedRequestQueue.forEach(request => request.onSuccess(token))
          failedRequestQueue = []
        }).catch(err => {
          failedRequestQueue.forEach(request => request.onFailure(err))
          failedRequestQueue = []
        }).finally(() => {
          isRefreshing = false;
        })
      } 

      return new Promise((resolve, reject) => {
        failedRequestQueue.push({
          onSuccess: (token: string) => { 
            const config = {
              ...originalConfig,
              headers: {
                Authorization: `Bearer ${token}`
              }
            }

            resolve(api(config))
          },
          onFailure: (err: AxiosError<any>) => {
            reject(err)
          }
        })
      })

    } else {
      signOut()
    }
  }

  return Promise.reject(error)
})
