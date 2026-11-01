import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/* CSS layers, in the exact order the prototype loaded them (build/01..08c). */
import './styles/01-tokens.css';
import './styles/02-base.css';
import './styles/03-shell.css';
import './styles/04-controls.css';
import './styles/05-panels.css';
import './styles/06-canvas.css';
import './styles/07-pages.css';
import './styles/08-dialogs.css';
import './styles/08b-extra.css';
import './styles/08c-extra.css';
import './styles/09-functional.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
