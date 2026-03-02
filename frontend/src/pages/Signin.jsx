import { useState } from 'react'
import supabase from '../helper/supabaseClient'
import { useNavigate } from 'react-router-dom'
import dogImage from '../assets/log_dog.png' // adjust path if needed
import "./Signin.css";

export default function Signin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/home')
  }

  return (
    <div className="login-page">

      <div className="login-header">
        <h1>LOGIN</h1>
      </div>

      <div className="login-content">

        {/* LEFT SIDE (Dog Image) */}
        <div className="left-side">
          <img src={dogImage} alt="Dog" className="dog-image" />
        </div>

        {/* RIGHT SIDE (Form) */}
        <div className="right-side">
          <form className="login-form" onSubmit={handleSignin}>

            {error && <p className="error-text">{error}</p>}

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              SIGN IN
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}