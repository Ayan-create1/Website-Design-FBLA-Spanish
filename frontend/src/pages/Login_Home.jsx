import { useNavigate } from 'react-router-dom'
import './Login_Home.css'
import welcomeLogo from '../assets/log_logo.png' // update path as needed

export default function Login_Home() {
  const navigate = useNavigate()

  return (
    <>
      <header className="login-header">
        <h1 className="login-title">LOGIN PAGE</h1>
      </header>

      <main className="login-main">
        <div className="login-logo">
          <img src={welcomeLogo} alt="Bienvenidos - Cómo Se Dice" />
        </div>

        <div className="login-buttons">
          <button className="login-btn" onClick={() => navigate('/signin')}>
            LOGIN
          </button>
          <button className="login-btn" onClick={() => navigate('/register')}>
            REGISTER
          </button>
        </div>
      </main>
    </>
  )
}