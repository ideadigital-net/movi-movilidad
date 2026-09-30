import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PassengerApp from './pages/PassengerApp'
import DriverApp from './pages/DriverApp'
import Tarifas from './pages/Tarifas'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={<PassengerApp />} />
          <Route path="/driver" element={<DriverApp />} />
          <Route path="/tarifas" element={<Tarifas />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App