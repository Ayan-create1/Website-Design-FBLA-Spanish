import React, { useState, useEffect } from 'react';
import './Navbar.css';
import logo from '../assets/logo.png';
import { User,Settings, Info, Menu, X } from 'lucide-react';

const navItems = [
  { name: "HOME", href: "/products" },
  { name: "TUTORING", href: "/tutoring"},
  { name: "RESOURCES", href: "/resources"},
  { name: "ACTIVITIES", href: "/activities"},
  { name: "HISTORY", href: "/history"},
]

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
  <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
    <div className="navbar-left">
      <a href="/" className="logo">
        <img src={logo} alt="logo" />
        CÓMO SE DICE
      </a>
    </div>
    {/* Desktop nav */}
    <div className="navbar-center">
      <ul className="nav-links">
        {navItems.map((item,key) => (
          <li key={key}>
            <a href={item.href}>{item.name}</a>
          </li>
        ))}
      </ul>
    </div>
      
    {/* Desktop icons */}
    <div className="navbar-right">
      <a href="/info" className="user-icon"><Info size={24} /></a>
      <a href="/settings" className="user-icon"><Settings size={24} /></a>
      <a href="/account" className="user-icon"><User size={24} /></a>
    </div>
    
    {/* Hamburger button */}
    <button 
      className="hamburger" 
      onClick={() =>setMenuOpen((prev) => !prev)}
      aria-label={menuOpen ? "Close Menu" : "Open Menu"}
    >
      {menuOpen ? <X size={28} /> : <Menu size={28} />}
    </button>
    
    {/* Mobile menu */}
    <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
      <div className="mobile-nav-links">
        {navItems.map((item, key) => (
          <a key={key} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.name}
          </a>
        ))}
      </div>
      <div className="mobile-icons">
        <a href="/info" className="user-icon"><Info size={24} /></a>
        <a href="/settings" className="user-icon"><Settings size={24} /></a>
        <a href="/account" className="user-icon"><User size={24} /></a>
      </div>
    </div>

  </nav>
  );
};

export default Navbar;