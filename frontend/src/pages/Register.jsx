import { useState } from 'react'
import supabase from '../helper/supabaseClient'
import { useNavigate } from 'react-router-dom'
import carlitoDog from '../assets/reg_dog.png' // update path as needed
import './Login_Home.css';

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else navigate('/home')
  }

  return (
    <div className="login-page">
      {/* Header */}
      <div className="login-header">
        <h1>REGISTER</h1>
      </div>

      {/* Content Row */}
      <div className="login-content">

        {/* Left Side - Carlito with speech bubble (single image asset) */}
        <div className="left-side">
          <img
            src={carlitoDog}
            alt="Carlito the dog"
            className="dog-image"
          />
        </div>

        {/* Right Side - Form */}
        <div className="right-side">
          <form className="login-form" onSubmit={handleRegister}>
            {error && <p className="error-text">{error}</p>}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">REGISTER</button>
          </form>
        </div>

      </div>
    </div>
  )
}