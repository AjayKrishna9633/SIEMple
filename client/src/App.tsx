import { useState } from 'react'
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'

function App() {
  const [view, setView] = useState<'setup' | 'login'>('setup')

  if (view === 'login') return <LoginPage />
  return <SetupPage onSetupComplete={() => setView('login')} />
}

export default App
