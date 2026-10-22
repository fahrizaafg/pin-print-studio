import { useStudio } from '../../state/StudioContext.jsx';
import { RECENT_PROJECTS } from '../../data/studioData.js';

export default function HomePage({ active }) {
  const studio = useStudio();

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-home" data-page="home" data-od-id="page-home">
      <div className="page-body">
        <div className="page-inner">
          <div className="hero-dark" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-8)' }}>
            <p className="eyebrow">Pin Print Studio</p>
            <h1>Atur layout cetak pin tanpa sisa kertas terbuang.</h1>
            <p className="lead">Kelola gambar pesanan, atur diameter potong dan bleed, lalu susun desain bulat rapi di atas lembar A4/A3. Ekspor siap cetak dalam hitungan detik.</p>
            <div className="hero-cta">
              <button type="button" className="btn btn-primary btn-pill" data-od-id="home-cta-editor" onClick={() => studio.goPage('editor')}>Buka Editor</button>
              <button type="button" className="btn btn-secondary btn-pill" data-od-id="home-cta-gallery" onClick={() => studio.goPage('gallery')}>Lihat Galeri Desain</button>
            </div>
          </div>

          <div className="grid-4 mb-6" data-od-id="home-stats">
            <div className="stat-tile" data-od-id="stat-projects">
              <div className="stat-num num">5</div>
              <div className="stat-label">Proyek tersimpan di perangkat ini</div>
            </div>
            <div className="stat-tile" data-od-id="stat-designs">
              <div className="stat-num num">6</div>
              <div className="stat-label">Desain aktif pada proyek berjalan</div>
            </div>
            <div className="stat-tile" data-od-id="stat-yield">
              <div className="stat-num num">92%</div>
              <div className="stat-label">Rata-rata efisiensi pemakaian kertas</div>
            </div>
            <div className="stat-tile" data-od-id="stat-exports">
              <div className="stat-num num">18</div>
              <div className="stat-label">Ekspor PDF &amp; PNG bulan ini</div>
            </div>
          </div>

          <h2 className="mb-4">Mulai dari sini</h2>
          <div className="tile-grid mb-6" data-od-id="home-tiles">
            <button type="button" className="tile" data-od-id="tile-editor" onClick={() => studio.goPage('editor')}>
              <span className="tile-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
              </span>
              <h3>Editor Layout</h3>
              <p>Susun desain bulat di lembar kertas, atur baris, kolom, margin, dan jarak antardesain.</p>
            </button>
            <button type="button" className="tile" data-od-id="tile-gallery" onClick={() => studio.goPage('gallery')}>
              <span className="tile-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l4.5-4 4 3.5 3-2.5L21 16" /></svg>
              </span>
              <h3>Galeri Desain</h3>
              <p>Kelola pustaka gambar, tambahkan ke proyek, ganti, duplikat, atau hapus berkas lama.</p>
            </button>
            <button type="button" className="tile" data-od-id="tile-templates" onClick={() => studio.goPage('templates')}>
              <span className="tile-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
                  <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
                </svg>
              </span>
              <h3>Template &amp; Preset</h3>
              <p>Simpan kombinasi kertas, diameter, dan grid sebagai preset yang bisa dipakai ulang.</p>
            </button>
          </div>

          <div className="row-between mb-4">
            <h2>Proyek terbaru</h2>
            <button type="button" className="btn btn-secondary btn-sm" data-od-id="home-link-history" onClick={() => studio.goPage('history')}>Semua riwayat proyek</button>
          </div>
          <table className="ds-table" data-od-id="home-recent-table">
            <thead>
              <tr><th>Nama proyek</th><th>Kertas</th><th>Desain</th><th>Diubah</th><th></th></tr>
            </thead>
            <tbody>
              {RECENT_PROJECTS.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td className="num-col">{project.paper}</td>
                  <td className="num-col">{project.designs}</td>
                  <td className="num-col">{project.changed}</td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" data-od-id={project.id} onClick={() => studio.openProject(project.name)}>Buka</button>
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
