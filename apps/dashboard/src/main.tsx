import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { VenueProvider } from './context/VenueContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <VenueProvider>
        <App />
      </VenueProvider>
    </BrowserRouter>
  </StrictMode>
);
