import { Route, Routes, useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <main className="home">
      <button type="button" onClick={() => navigate('/index')}>
        Connexion
      </button>
    </main>
  )
}

function Index() {
  return <main aria-label="Page d'index" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/index" element={<Index />} />
    </Routes>
  )
}
