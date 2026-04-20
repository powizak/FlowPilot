import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import { AppRouter } from './app/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>}>
      <AppRouter />
    </Suspense>
  </React.StrictMode>,
);
