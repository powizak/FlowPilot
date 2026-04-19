import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback="Loading...">
      <h1>Hello FlowPilot</h1>
    </Suspense>
  </React.StrictMode>,
);
