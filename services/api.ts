import axios, { AxiosError } from "axios";
import { GetServerSidePropsContext } from "next";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "../errors/AuthTokenError";

let isRefreshing = false;
let failedRequestQueue: any[] = []

export function setupAPIClient(ctx?: GetServerSidePropsContext) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })
  
  api.interceptors.response.use(res => res, (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      if (error.response.data.code === "token.expired") {
        cookies = parseCookies(ctx)
  
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
      
            setCookie(ctx, "nextauth.token", token, cookieOptions)
            setCookie(ctx, "nextauth.refreshToken", response.data.refreshToken, cookieOptions)
    
            api.defaults.headers['Authorization'] = `Bearer ${token}`
  
            failedRequestQueue.forEach(request => request.onSuccess(token))
            failedRequestQueue = []
          }).catch(err => {
            failedRequestQueue.forEach(request => request.onFailure(err))
            failedRequestQueue = []
  
            if(typeof window !== undefined) {
              signOut()
            }
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
        if(typeof window !== undefined) {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error)
  })

  return api
}