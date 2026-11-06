import { Route, Routes, useNavigate } from 'react-router-dom'
bouton connexionimport Button from '@mui/material/Button'
import LoginIcon from '@mui/icons-material/Login'
import Catalog from './pages/Catalog.jsx'

function Home() {
  const navigate = useNavigate()

  return (
    <main className="home">
      <Button
        color="inherit"
        onClick={() => navigate('/index')}
        size="large"
        startIcon={<LoginIcon />}
        variant="contained"
        sx={{
          bgcolor: '#ffffff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          color: '#082f6b',
          fontWeight: 700,
          px: 3,
          py: 1.25,
          '&:hover': {
            bgcolor: '#e5e7eb',
          },
        }}
      >
        Connexion
      </Button>
    </main>
  )
}

function Index() {
  return <main aria-label="Index page" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/index" element={<Index />} />
      <Route path="/catalog" element={<Catalog />} />
    </Routes>
  )
}
