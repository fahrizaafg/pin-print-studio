import { useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
import { Icon } from '../ui/icons.jsx';

export default function HistoryPage({ active }) {
  const studio = useStudio();
  const [query, setQuery] = useState('');

  const projects = studio.projects;
  const needle = query.trim().toLowerCase();
  const matches = (row) => !needle
    || String(row.name || '').toLowerCase().includes(needle)
    || String(row.paper || '').toLowerCase().includes(needle);
  const visibleCount = projects.filter(matches).length;

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-history" data-page="history" data-od-id="page-history">
      <div className="page-head">
        <div className="head-row">
          <div className="head-copy">
            <p className="eyebrow">Arsip</p>
            <h1>Riwayat Proyek</h1>
            <p className="lead">Buka kembali, pulihkan versi lama, atau ekspor cadangan proyek yang pernah dikerjakan.</p>
          </div>
          <div className="row">
            <button type="button" className="btn btn-secondary btn-sm" data-od-id="btn-restore-version" onClick={() => studio.openDialog('dlg-restore')}>
              <Icon name="history" />
              Pulihkan Versi
            </button>
            <button type="button" className="btn btn-primary btn-sm" id="btn-backup" data-od-id="btn-backup" onClick={() => studio.openDialog('dlg-backup')}>
              <Icon name="exportArrow" />
              Ekspor Cadangan
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="page-inner">
          <div className="search" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-5)' }} data-od-id="history-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Cari nama proyek atau tanggal…"
              aria-label="Cari proyek"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <h2 className="mb-4">{projects.length} proyek <span className="muted body-sm" style={{ fontWeight: 400 }}>· {visibleCount} ditampilkan</span></h2>

          <table className="ds-table" data-od-id="history-table">
            <thead>
              <tr>
                <th>Nama proyek</th><th>Kertas</th><th>Desain</th><th>Terakhir diubah</th><th>Ukuran</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((row, index) => (
                <tr key={row.id} className={matches(row) ? undefined : 'is-hidden'}>
                  <td>{row.name}</td>
                  <td className="num-col">{row.paper}</td>
                  <td className="num-col">{row.designs}</td>
                  <td className="num-col">{row.changed}</td>
                  <td className="num-col">{row.size}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={`hist-open-${index + 1}`} onClick={() => studio.openProject(row.name)}>Buka</button>{' '}
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={`hist-restore-${index + 1}`} onClick={() => studio.openDialog('dlg-restore')}>Pulihkan</button>{' '}
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={`hist-dup-${index + 1}`} onClick={() => studio.duplicateProject(row.id)}>Duplikat</button>{' '}
                    <button
                      type="button"
                      className="btn btn-danger btn-ghost btn-sm"
                      data-od-id={`hist-del-${index + 1}`}
                      onClick={() => studio.requestConfirm({
                        message: `Hapus proyek ${row.name}?`,
                        note: 'Proyek akan dihapus dari riwayat di perangkat ini.',
                        toast: 'Proyek dihapus dari riwayat.',
                        onConfirm: () => studio.removeProject(row.id),
                      })}
                    >Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {projects.length === 0 ? (
            <div className="empty mt-6" data-od-id="history-empty">
              <span className="empty-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
                </svg>
              </span>
              <h3>Belum ada proyek di riwayat</h3>
              <p>Proyek yang kamu buat atau simpan akan muncul di sini agar bisa dibuka kembali kapan saja.</p>
              <button type="button" className="btn btn-primary btn-sm" data-od-id="history-empty-editor" onClick={() => studio.goPage('editor')}>Buka Editor</button>
            </div>
          ) : null}

          {projects.length > 0 && visibleCount === 0 ? (
            <div className="empty mt-6" data-od-id="history-no-match">
              <span className="empty-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" />
                </svg>
              </span>
              <h3>Tidak ada proyek yang cocok</h3>
              <p>Tidak ada nama proyek atau kertas yang memuat kata kunci “{query.trim()}”. Coba kata kunci lain.</p>
              <button type="button" className="btn btn-secondary btn-sm" data-od-id="history-reset-search" onClick={() => setQuery('')}>Hapus Pencarian</button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
