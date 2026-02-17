import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div className="fatal-fallback">Etherea shell recovered from an unexpected error.</div>}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
