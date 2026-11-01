import { useStudio } from '../../state/StudioContext.jsx';
import { ASSET_STATUS_LABEL } from '../../data/studioData.js';
import { Icon } from '../ui/icons.jsx';

export default function AssetPanel() {
  const studio = useStudio();
  const { assets, assetQuery, setAssetQuery, toggleAsset, selectAllAssets, deselectAssets, openDialog, requestConfirm } = studio;

  const query = assetQuery.toLowerCase();
  const count = assets.length;

  return (
    <aside className="panel panel-l" id="panel-l" data-od-id="panel-assets" aria-label="Daftar gambar">
      <div className="panel-head">
        <span className="panel-title">Gambar Diunggah</span>
        <span className="badge-count" data-od-id="asset-count"><span id="asset-total">{count}</span> file</span>
      </div>

      <div className="search" data-od-id="asset-search">
        <Icon name="search" />
        <input
          type="text"
          id="asset-search-input"
          placeholder="Cari desain…"
          aria-label="Cari desain"
          value={assetQuery}
          onChange={(e) => setAssetQuery(e.target.value)}
        />
      </div>

      <div className="panel-body">
        <div className="asset-list" id="asset-list" data-od-id="asset-list">
          {assets.map((asset, index) => {
            const visible = asset.name.toLowerCase().includes(query);
            return (
              <button
                key={asset.id}
                type="button"
                className={`asset${asset.selected ? ' is-selected' : ''}${visible ? '' : ' is-hidden'}`}
                data-asset-id={asset.id}
                data-od-id={`asset-${index + 1}`}
                onClick={() => toggleAsset(asset.id)}
              >
                <span className={`box${asset.selected ? ' is-checked' : ''}`} aria-hidden="true">
                  <Icon name="check" stroke={2.4} />
                </span>
                <span className="asset-thumb">
                  {asset.url ? (
                    <img src={asset.url} alt={asset.name} />
                  ) : (
                    <span className={`pin-art ${asset.art}`} style={{ width: 34, height: 34 }}>
                      <Icon name={asset.icon} stroke={1.8} />
                    </span>
                  )}
                </span>
                <span className="asset-main">
                  <span className="asset-name">{asset.name}</span>
                  <span className="asset-sub">
                    <span>{asset.meta}</span>
                    <span className={`status is-${asset.status}`}><span className="dot" />{ASSET_STATUS_LABEL[asset.status]}</span>
                  </span>
                  <span className="asset-sub"><span>Pesanan: {asset.order} pcs</span><span>· {asset.inLayout} di layout</span></span>
                </span>
              </button>
            );
          })}
        </div>
        {count === 0 ? (
          <div className="empty" data-od-id="asset-empty" style={{ margin: '12px 0', textAlign: 'center' }}>
            <h3 style={{ fontSize: 14, margin: '8px 0 4px' }}>Belum ada gambar</h3>
            <p className="body-sm muted" style={{ margin: '0 0 10px' }}>Unggah PNG, JPG, atau SVG untuk mulai menyusun layout.</p>
            <button type="button" className="btn btn-primary btn-sm" data-od-id="asset-empty-upload" onClick={() => openDialog('dlg-upload')}>
              <Icon name="plus" />
              Upload Gambar
            </button>
          </div>
        ) : null}
      </div>

      <div className="panel-foot" data-od-id="asset-actions">
        <div className="row2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            data-od-id="btn-add-design"
            onClick={() => openDialog('dlg-upload')}
          >
            <Icon name="plus" />
            Tambah Desain
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            id="btn-focus-search"
            data-od-id="btn-search-design"
            onClick={() => document.getElementById('asset-search-input')?.focus()}
          >
            <Icon name="search" />
            Cari Desain
          </button>
        </div>
        <div className="row2">
          <button type="button" className="btn btn-secondary btn-sm" id="btn-select-all" data-od-id="btn-select-all" onClick={selectAllAssets}>Pilih Semua</button>
          <button type="button" className="btn btn-secondary btn-sm" id="btn-deselect" data-od-id="btn-deselect" onClick={deselectAssets}>Batalkan Pilihan</button>
        </div>
        <div className="row2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            id="btn-add-to-layout"
            data-od-id="btn-add-to-layout"
            style={{ gridColumn: '1 / -1' }}
            onClick={() => studio.addSelectedAssetsToLayout()}
          >
            <Icon name="plus" />
            Tambah ke Layout
          </button>
        </div>
        <div className="row3">
          <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-replace" onClick={() => openDialog('dlg-replace')}>Ganti Gambar</button>
          <button type="button" className="btn btn-secondary btn-sm" id="btn-duplicate" data-od-id="btn-duplicate" onClick={studio.duplicateSelectedPin}>Duplikat</button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            data-od-id="btn-delete-asset"
            onClick={() => requestConfirm({
              message: 'Hapus aset terpilih dari panel?',
              note: 'Aset yang dihapus tidak bisa dikembalikan. Desain di layout tetap utuh.',
              toast: 'Aset dihapus.',
              onConfirm: () => studio.removeSelectedAssets(),
            })}
          >Hapus</button>
        </div>
      </div>
    </aside>
  );
}
