import { NavLink, Outlet } from 'react-router-dom'
import Logo from './Logo.jsx'

const NAV = [
  { to: '/fighters', label: 'Fighters' },
  { to: '/venues', label: 'Venues' },
  { to: '/orders', label: 'My orders' },
]

export default function AppShell() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/fighters" className="logo-link" aria-label="Uber Castagne, home">
            <Logo variant="long" tone="light" />
          </NavLink>
          <nav aria-label="Main">
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className="nav-link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="content" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  )
}
