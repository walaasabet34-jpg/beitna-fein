import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setBuild } from './engine/core';
import { LOCAL_ARCHIVE } from './radio/registry';

setBuild(LOCAL_ARCHIVE ? 'archive' : 'public');

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
