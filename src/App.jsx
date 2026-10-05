import React from 'react'
import "./App.css"
import { BrowserRouter, Route, Routes } from "react-router"
import Home from './pages/home'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import ProtectedRoute from './components/protectedRoute'
import { ToastProvider } from './contexts/toastContext'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App