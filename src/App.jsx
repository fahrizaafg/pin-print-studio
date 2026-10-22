import { Component, useEffect } from 'react';
import { StudioProvider, useStudio } from './state/StudioContext.jsx';
import { ToastProvider } from './state/ToastContext.jsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import Rail from './components/Rail.jsx';
import EditorPage from './components/EditorPage.jsx';
import HomePage from './components/pages/HomePage.jsx';
import GalleryPage from './components/pages/GalleryPage.jsx';
import TemplatesPage from './components/pages/TemplatesPage.jsx';
import HistoryPage from './components/pages/HistoryPage.jsx';
import SettingsPage from './components/pages/SettingsPage.jsx';
import HelpPage from './components/pages/HelpPage.jsx';
import PreviewPage from './components/pages/PreviewPage.jsx';
import Dialogs from './components/dialogs/Dialogs.jsx';
import { TooltipLayer } from './components/ui/TooltipLayer.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: 20 }}>Terjadi kesalahan pada antarmuka</h1>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: '#b00020' }}>{String(this.state.error && this.state.error.stack)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Shell() {
  const { page, railOpen, closeRail } = useStudio();
  useKeyboardShortcuts();

  return (
    <>
      <div className="app">
        <Rail />
        <main className="main" id="main">
          <HomePage active={page === 'home'} />
          <EditorPage active={page === 'editor'} />
          <GalleryPage active={page === 'gallery'} />
          <TemplatesPage active={page === 'templates'} />
          <HistoryPage active={page === 'history'} />
          <SettingsPage active={page === 'settings'} />
          <HelpPage active={page === 'help'} />
          <PreviewPage active={page === 'preview'} />
        </main>
      </div>
      {railOpen ? <div className="rail-scrim" onClick={closeRail} aria-hidden="true" /> : null}
      <Dialogs />
      <TooltipLayer />
    </>
  );
}

/* First-run greeting — same message and kind as the prototype. */
function WelcomeToast() {
  const { notify } = useStudio();
  useEffect(() => {
    const t = window.setTimeout(() => notify('Selamat datang di Pin Print Studio.', 'info'), 220);
    return () => window.clearTimeout(t);
  }, [notify]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <StudioProvider>
        <ErrorBoundary>
          <Shell />
          <WelcomeToast />
        </ErrorBoundary>
      </StudioProvider>
    </ToastProvider>
  );
}
