import React from 'react';
import ReactDOM from 'react-dom/client';
import DrivePrototypeApp from './driveEdition/DrivePrototypeApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DrivePrototypeApp />
  </React.StrictMode>,
);
