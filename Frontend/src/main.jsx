import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom"
import {Toaster}  from 'react-hot-toast'
import AuthProvider from './Context/AuthContext.jsx'
import { TaskProvider } from './Context/TaskContext.jsx'
import { DashboardProvider } from './Context/DashboardContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <DashboardProvider>
      <TaskProvider>
    <BrowserRouter>
      <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "14px",
          background: "#111827",
          color: "#fff",
          padding: "14px 18px",
          fontSize: "14px"
        }
      }}
    />
    <App />
    </BrowserRouter>
    </TaskProvider>
    </DashboardProvider>
    </AuthProvider>
    
  </StrictMode>,
)
