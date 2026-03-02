import { useNavigate } from 'react-router-dom'
import supabase from '../helper/supabaseClient'

export default function Home() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div>
      <h1>Home</h1>
      <button onClick={handleLogout}>Log Out</button>
      {/* rest of your app content */}
    </div>
  )
}