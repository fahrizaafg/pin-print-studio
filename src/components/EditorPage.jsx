import Toolbar from './Toolbar.jsx';
import AssetPanel from './editor/AssetPanel.jsx';
import CanvasArea from './editor/CanvasArea.jsx';
import InspectorPanel from './editor/InspectorPanel.jsx';

export default function EditorPage({ active }) {
  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-editor" data-page="editor" data-od-id="page-editor">
      <Toolbar />
      <div className="editor-body">
        <AssetPanel />
        <CanvasArea />
        <InspectorPanel />
      </div>
    </section>
  );
}
