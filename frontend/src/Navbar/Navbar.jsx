import React from 'react';
import './Navbar.css';
import logo from '../assets/logo.png';
import { User,Settings, Info } from 'lucide-react';

const Navbar = () => {
  return (

<nav className="navbar">
  <div className="navbar-left">
    <a href="/" className="logo">
      <img src={logo} alt />
      CÓMO SE DICE
    </a>
  </div>
  <div className="navbar-center">
    <ul className="nav-links">
      <li>
        <a href="/products">HOME</a>
      </li>
      <li>
        <a href="/about">TUTORING</a>
      </li>
      <li>
        <a href="/contact">RESOURCES</a>
      </li>
      <li>
        <a href="/contact">ACTIVITIES</a>
      </li>
      <li>
        <a href="/contact">HISTORY</a>
      </li>
    </ul>
  </div>
  <div className="navbar-right">
  <a href="/info" className="user-icon"><Info size={24} /></a>
  <a href="/settings" className="user-icon"><Settings size={24} /></a>
  <a href="/account" className="user-icon"><User size={24} /></a>
  </div>
</nav>
);
};

export default Navbar;