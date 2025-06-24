import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import './index.css';
import App from './App.jsx';

// Load Apollo Client error messages in development
if (import.meta.env.DEV) {
  loadDevMessages();
  loadErrorMessages();
}

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
