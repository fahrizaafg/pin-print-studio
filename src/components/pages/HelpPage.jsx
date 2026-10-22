import { useStudio } from '../../state/StudioContext.jsx';
import { Icon } from '../ui/icons.jsx';

const STEPS = [
  {
    title: 'Unggah gambar',
    body: <>Klik <strong>Upload Gambar</strong> pada toolbar Editor atau halaman Galeri. Format PNG dengan latar transparan memberi hasil potong paling bersih.</>,
  },
  {
    title: 'Atur kertas & geometri',
    body: <>Buka <strong>Pengaturan Kertas</strong> untuk memilih A4/A3/A3+ atau ukuran custom, lalu tentukan diameter potong dan bleed di panel kanan.</>,
  },
  {
    title: 'Susun desain',
    body: <>Pakai <strong>Susun Otomatis</strong> lalu rapikan dengan <strong>Ratakan ke Grid</strong> atau <strong>Pusatkan Layout</strong>. Geser desain langsung di lembar bila perlu.</>,
  },
  {
    title: 'Periksa & ekspor',
    body: <>Buka <strong>Pratinjau Cetak</strong> untuk memastikan tanda potong dan margin, lalu ekspor PDF atau PNG sesuai resolusi percetakan.</>,
  },
];

const SHORTCUTS = [
  ['Simpan proyek', ['Ctrl', 'S']],
  ['Undo', ['Ctrl', 'Z']],
  ['Redo', ['Ctrl', 'Y']],
  ['Zoom masuk', ['Ctrl', '+']],
  ['Zoom keluar', ['Ctrl', '−']],
  ['Pilih semua desain', ['Ctrl', 'A']],
];

export default function HelpPage({ active }) {
  const studio = useStudio();

  return (
    <section className={`page${active ? ' is-active' : ''}`} id="page-help" data-page="help" data-od-id="page-help">
      <div className="page-head">
        <div className="head-row">
          <div className="head-copy">
            <p className="eyebrow">Panduan</p>
            <h1>Bantuan</h1>
            <p className="lead">Langkah singkat menyiapkan layout pin, ditambah daftar pintasan keyboard dan penjelasan istilah cetak.</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" data-od-id="help-back-editor" onClick={() => studio.goPage('editor')}>Kembali ke Editor</button>
        </div>
      </div>

      <div className="page-body">
        <div className="page-inner">
          <div className="grid-2-1">
            <div>
              <h2 className="mb-5">Alur kerja 4 langkah</h2>
              {STEPS.map((step, i) => (
                <div className="help-step" key={step.title}>
                  <div className="help-num">{i + 1}</div>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="stack-lg">
              <div className="card">
                <h3 className="mb-4">Pintasan keyboard</h3>
                <div className="stack-xs">
                  {SHORTCUTS.map(([label, keys]) => (
                    <div className="row-between" key={label}>
                      <span className="body-sm">{label}</span>
                      <span>{keys.flatMap((k, i) => (i > 0 ? [' ', <span className="kbd" key={k}>{k}</span>] : [<span className="kbd" key={k}>{k}</span>]))}</span>
                    </div>
                  ))}
                  <div className="row-between">
                    <span className="body-sm">Hapus desain terpilih</span>
                    <span className="kbd">Delete</span>
                  </div>
                </div>
              </div>
              <div className="empty">
                <span className="empty-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4" />
                  </svg>
                </span>
                <h3>Masih ada pertanyaan?</h3>
                <p>Dokumentasi lengkap mencakup istilah cetak seperti bleed, safe area, dan tanda potong beserta contoh visual.</p>
                <button type="button" className="btn btn-secondary btn-sm" data-od-id="help-open-docs" onClick={() => studio.toastInline('Dokumentasi dibuka di tab baru.', 'info')}>
                  Buka Dokumentasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

void Icon;