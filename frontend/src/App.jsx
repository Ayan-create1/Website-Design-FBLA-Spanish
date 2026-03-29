import './App.css';
import SombreroDogChatbot from './components/SombreroDogChatbot_Final';
import Navbar from './Navbar/Navbar';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login_Home from "./pages/Login_Home";
import Register from "./pages/Register";
import Signin from "./pages/Signin";
import Home from "./pages/Home";
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useLocation } from 'react-router-dom'
import Activities from './pages/Activities';
import WordSearch from './pages/WordSearch';
import Crossword from './pages/Crossword';
import GroupStudyPage from './pages/GSP';
import HistoryPage from './pages/History';
import ResourcesPage from './pages/Resources';
import GoogleAnalyticsTracker from './GoogleAnalyticsTracker';

function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  const authRoutes = ['/', '/register', '/signin'];
  const isAuthPage = authRoutes.includes(location.pathname);

  return (
    <>
      {user && !isAuthPage && <Navbar />}
      {user && !isAuthPage && <SombreroDogChatbot />}
      <Routes>
        <Route path="/activities" element={<Activities />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/groupstudy" element={<GroupStudyPage/>} />
        <Route path="/" element={<Login_Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
    <GoogleAnalyticsTracker />
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

{/*}
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      */}
      {/* CHATBOT - Floats in bottom-right corner */}