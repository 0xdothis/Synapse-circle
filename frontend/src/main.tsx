import { StrictMode } from 'react'
import { GoogleOAuthProvider } from "@react-oauth/google"
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()
const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient} >
      <GoogleOAuthProvider clientId={clientID}>
        <App />
        <Toaster position='top-right' toastOptions={{
          classNames: {
            toast: "font-sans",
            error: "!bg-danger-100 !text-danger-500 border !border-danger-500",
            success: "!bg-success-50 !text-success-800 border !border-success-400",
            info: "!bg-info-100 !text-info-500 border !border-info-500",
            warning: "!bg-warning-100 !text-warning-500 border !border-warning-500"
          }
        }} />
      </GoogleOAuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
