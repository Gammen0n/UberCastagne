import { Route, Routes, useNavigate } from 'react-router-dom'
import Catalog from './pages/Catalog.jsx'

function Home() {
  const navigate = useNavigate()

  return (
    <main className="home">
      <button type="button" onClick={() => navigate('/index')}>
        Log in
      </button>
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
