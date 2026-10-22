import { useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import { GALLERY_CARDS } from '../../data/studioData.js';
import { Icon } from '../ui/icons.jsx';

export default function GalleryPage({ active }) {
  const studio = useStudio();
  const [cards, setCards] = useState(GALLERY_CARDS);
  const [selectMode, setSelectMode] = useState(true);

  const toggleCard = (id) => {
    setCards((list) => list.map((c) => (c.id === id ? { ...c, checked: !c.checked, selected: !c.checked ? true : c.selected } : c)));
  };

  const checkedCount = cards.filter((c) => c.checked).length;

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-gallery" data-page="gallery" data-od-id="page-gallery">
      <div className="page-head">
        <div className="head-row">
          <div className="head-copy">
            <p className="eyebrow">Pustaka</p>
            <h1>Galeri Desain</h1>
            <p className="lead">Semua gambar yang pernah diunggah. Pilih beberapa berkas untuk ditambahkan ke proyek aktif.</p>
          </div>
          <div className="row">
            <button
              type="button"
              className={`btn btn-secondary btn-sm${selectMode ? ' is-on' : ''}`}
              id="gallery-select-mode"
              data-od-id="btn-select-mode"
              onClick={() => setSelectMode((v) => !v)}
            >Mode Pilih File</button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="gallery-tambah"
              data-od-id="btn-add-to-project"
              onClick={() => studio.toastInline(`${checkedCount} desain ditambahkan ke proyek aktif.`, 'ok')}
            >Tambah ke Proyek</button>
            <button type="button" className="btn btn-primary btn-sm" data-od-id="gallery-upload" onClick={() => studio.openDialog('dlg-upload')}>
              <Icon name="upload" />
              Upload Gambar
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="page-inner">
          <div
            className="search"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-5)' }}
            data-od-id="gallery-search"
          >
            <Icon name="search" />
            <input type="text" placeholder="Cari nama berkas, tag, atau tanggal…" aria-label="Cari desain" />
          </div>

          <h2 className="mb-4">6 berkas <span className="muted body-sm" style={{ fontWeight: 400 }}>· 2 belum ditempatkan</span></h2>

          <div className="gallery-grid mb-6" data-od-id="gallery-grid">
            {cards.map((card, index) => (
              <div key={card.id} className={`gcard${card.selected ? ' is-selected' : ''}`} data-od-id={`gcard-${index + 1}`}>
                <div className="gcard-art">
                  <span
                    className={`gcard-check box${card.checked ? ' is-checked' : ''}`}
                    onClick={() => toggleCard(card.id)}
                    role="checkbox"
                    aria-checked={card.checked}
                    aria-label={`Pilih ${card.name}`}
                    tabIndex={0}
                  >
                    <Icon name="check" stroke={2.4} />
                  </span>
                  <span className={`pin-art ${card.art}`}><Icon name={card.icon} /></span>
                </div>
                <div className="gcard-foot">
                  <div className="gcard-name">{card.name}</div>
                  <div className="gcard-meta">
                    <span>{card.format}</span>
                    <span>· {card.size}</span>
                    {card.status ? <span className="status is-unplaced"><span className="dot" />Belum</span> : null}
                  </div>
                  <div className="gcard-actions">
                    <button type="button" className="btn btn-secondary" data-od-id={`gcard-${index + 1}-edit`} onClick={() => studio.openDialog('dlg-edit-image')}>Edit</button>
                    <button type="button" className="btn btn-secondary" data-od-id={`gcard-${index + 1}-replace`} onClick={() => studio.openDialog('dlg-replace')}>Ganti</button>
                    <button type="button" className="btn btn-secondary" data-od-id={`gcard-${index + 1}-dup`} onClick={() => studio.toastInline(`${card.name} diduplikat.`, 'ok')}>Duplikat</button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      data-od-id={`gcard-${index + 1}-del`}
                      onClick={() => studio.requestConfirm({ message: `Hapus ${card.name} dari galeri?`, toast: 'Berkas dihapus dari galeri.' })}
                    >Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="empty" data-od-id="gallery-empty-demo">
            <span className="empty-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l4.5-4 4 3.5 3-2.5L21 16" /><circle cx="8.5" cy="9" r="1.4" />
              </svg>
            </span>
            <h3>Belum ada gambar di galeri</h3>
            <p>Unggah berkas PNG, JPG, atau SVG untuk mulai menyusun layout pin. Format ideal memiliki latar transparan dan sisi minimal 1000 px.</p>
            <button type="button" className="btn btn-primary btn-sm" data-od-id="gallery-empty-upload" onClick={() => studio.openDialog('dlg-upload')}>Upload Gambar</button>
          </div>
        </div>
      </div>
    </section>
  );
}
