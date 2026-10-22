import { useStudio } from '../../state/StudioContext.jsx';
import { HISTORY_ROWS } from '../../data/studioData.js';
import { Icon } from '../ui/icons.jsx';

export default function HistoryPage({ active }) {
  const studio = useStudio();

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
            <input type="text" placeholder="Cari nama proyek atau tanggal…" aria-label="Cari proyek" />
          </div>

          <table className="ds-table" data-od-id="history-table">
            <thead>
              <tr>
                <th>Nama proyek</th><th>Kertas</th><th>Desain</th><th>Terakhir diubah</th><th>Ukuran</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY_ROWS.map((row, index) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td className="num-col">{row.paper}</td>
                  <td className="num-col">{row.designs}</td>
                  <td className="num-col">{row.changed}</td>
                  <td className="num-col">{row.size}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={`hist-open-${index + 1}`} onClick={() => studio.openProject(row.name)}>Buka</button>{' '}
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={`hist-restore-${index + 1}`} onClick={() => studio.openDialog('dlg-restore')}>Pulihkan</button>{' '}
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={`hist-dup-${index + 1}`} onClick={() => studio.duplicatePreset(row.name)}>Duplikat</button>{' '}
                    <button
                      type="button"
                      className="btn btn-danger btn-ghost btn-sm"
                      data-od-id={`hist-del-${index + 1}`}
                      onClick={() => studio.requestConfirm({ message: `Hapus proyek ${row.name}?`, toast: 'Proyek dihapus dari riwayat.' })}
                    >Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}