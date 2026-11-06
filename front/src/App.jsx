import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import LoginIcon from '@mui/icons-material/Login'
import AppShell from './components/AppShell.jsx'
import Logo from './components/Logo.jsx'
import Fighters from './pages/Fighters.jsx'
import Venues from './pages/Venues.jsx'
import Orders from './pages/Orders.jsx'
import OrderTracking from './pages/OrderTracking.jsx'

function Home() {
  const navigate = useNavigate()

  return (
    <main className="home">
      <Logo variant="compact" tone="light" />
      <Button
        color="inherit"
        onClick={() => navigate('/index')}
        size="large"
        startIcon={<LoginIcon />}
        variant="contained"
        disableElevation
        sx={{
          bgcolor: 'var(--accent)',
          color: 'var(--text-on-dark)',
          borderRadius: 'var(--radius-button)',
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          textTransform: 'none',
          px: 'var(--space-6)',
          py: 'var(--space-3)',
          transition: 'background-color var(--duration-fast) var(--ease-out)',
          '&:hover': { bgcolor: 'var(--accent-hover)' },
          '&:focus-visible': {
            outline: 'var(--ring-width) solid var(--accent)',
            outlineOffset: 'var(--ring-offset)',
          },
        }}
      >
        Log in
      </Button>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<AppShell />}>
        <Route path="/fighters" element={<Fighters />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
      </Route>
      {/* Former URLs: the empty /index page and the combined /catalog page. */}
      <Route path="/index" element={<Navigate to="/fighters" replace />} />
      <Route path="/catalog" element={<Navigate to="/fighters" replace />} />
      <Route path="*" element={<Navigate to="/fighters" replace />} />
    </Routes>
  )
}
