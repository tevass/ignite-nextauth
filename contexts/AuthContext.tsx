import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user?: User;
}

export const AuthContext = createContext({} as AuthContextData)

type AuthProviderProps = {
  children: ReactNode;
}

export function signOut() {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user;

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies()

    if (token) {
      api.get('/me')
        .then(response => {
          const { email, roles, permissions } = response.data

          setUser({ email, permissions, roles })
        })
        .catch(() => {
            signOut()
        })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('/sessions', {
        email, password
      })

      const { token, refreshToken, permissions, roles } = response.data

      const cookieOptions = {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/"
      }

      setCookie(undefined, "nextauth.token", token, cookieOptions)
      setCookie(undefined, "nextauth.refreshToken", refreshToken, cookieOptions)

      setUser({ email,  permissions, roles })

      api.defaults.headers['Authorization'] = `Bearer ${token}`
      
      Router.push('/dashboard')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
      { children }
    </AuthContext.Provider>
  )
}

