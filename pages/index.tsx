import type { NextPage } from 'next'
import { FormEvent, useContext, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import styles from '../styles/Home.module.css'
import { withSSRGuest } from '../utils/withSSRGuest'

const Home: NextPage = () => {
  const { signIn } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const data = { email, password }
    await signIn(data)
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit} >
      <input type="email" onChange={e => setEmail(e.target.value)} value={email} />
      <input type="password" onChange={e => setPassword(e.target.value)} value={password} />
      <button type="submit">Entrar</button>
    </form>
  )
}

export default Home

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  }
})
