import { StrictMode } from 'react'
import { GoogleOAuthProvider } from "@react-oauth/google"
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()
const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient} >
      <GoogleOAuthProvider clientId={clientID}>
        <App />
      </GoogleOAuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
