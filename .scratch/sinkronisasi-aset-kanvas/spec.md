# Spesifikasi: Sinkronisasi Aset–Kanvas, Saklar Kunci, dan Latar Kanvas

Status: ready-for-agent

## Problem Statement

Saat memakai editor, ada tiga hal yang terasa salah bagi pengguna:

1. **Status aset tidak ikut berubah saat pin dihapus dari kanvas.** Panel "Gambar Diunggah" menampilkan status per berkas (Ditempatkan / Belum Ditempatkan / Terkunci). Setelah pengguna menambahkan gambar ke kanvas lalu menghapusnya kembali, statusnya tetap "Ditempatkan" dan angka "N di layout" tidak turun. Pengguna jadi tidak bisa memercayai panel itu untuk tahu gambar mana yang masih terpakai.

2. **Saklar "Kunci posisi desain" tidak sesuai kenyataan.** Pin bawaan seperti stiker daun hijau sudah terkunci (tidak bisa digeser), tetapi saklar di panel kanan tampil mati. Pengguna harus menyalakan lalu mematikannya dulu sebelum bisa menggeser. Saklar yang berbohong tentang keadaan pin membuat pengguna mengira aplikasinya rusak.

3. **Latar belakang di belakang kertas tampak hitam polos.** Area kerja di sekitar kertas terlihat datar dan tidak enak dilihat, sehingga editor terasa belum selesai.

Di samping tiga keluhan itu, ada kekhawatiran yang lebih luas: status aset bisa tidak sinkron pada jalur lain (duplikat pin, ganti gambar, hapus halaman, pulihkan versi), dan penguncian bisa dilewati lewat jalur selain geser di kanvas.

## Solution

Dari sudut pandang pengguna:

1. Status di panel "Gambar Diunggah" selalu mencerminkan isi kanvas saat itu juga. Menghapus pin membuat berkas kembali "Belum Ditempatkan" bila tidak ada pin lain yang memakainya, dan angka "N di layout" menyesuaikan jumlah pin nyata.
2. Saklar "Kunci posisi desain" langsung menunjukkan keadaan pin yang sedang dipilih. Memilih pin yang terkunci membuat saklar menyala; mematikan saklar membuka kunci dan pin bisa digeser lagi. Selama terkunci, pin tidak bisa digeser dari mana pun — termasuk lewat kolom posisi di panel kanan.
3. Latar belakang kanvas didesain ulang supaya terasa seperti meja kerja: warna lembut, pola halus, dan kertas tetap menonjol dengan bayangan. Mode gelap tetap memakai kertas putih agar desain terbaca, hanya area sekitarnya yang gelap.

Semua ini tanpa mengubah perilaku ekspor: hasil PNG/PDF tetap sama.

## User Stories

1. Sebagai pengguna editor, saya ingin status berkas di panel gambar berubah menjadi "Belum Ditempatkan" begitu pin terakhirnya dihapus dari kanvas, supaya saya tahu berkas itu sudah tidak terpakai.
2. Sebagai pengguna editor, saya ingin angka "N di layout" turun saat saya menghapus satu pin, supaya jumlahnya cocok dengan yang saya lihat di kanvas.
3. Sebagai pengguna editor, saya ingin status tetap "Ditempatkan" bila masih ada pin lain dari berkas yang sama, supaya status tidak berubah padahal gambarnya masih dipakai.
4. Sebagai pengguna editor, saya ingin status dihitung dari semua halaman, bukan hanya halaman yang sedang terbuka, supaya berpindah halaman tidak mengubah status secara menipu.
5. Sebagai pengguna editor, saya ingin menghapus beberapa pin sekaligus tetap memperbarui status semua berkas terkait.
6. Sebagai pengguna editor, saya ingin mengosongkan satu halaman memperbarui status berkas yang pin-nya hanya ada di halaman itu.
7. Sebagai pengguna editor, saya ingin menduplikat pin tidak mengubah status berkas menjadi salah, supaya jumlah di panel tetap masuk akal.
8. Sebagai pengguna editor, saya ingin memilih berkas berstatus "Terkunci" tetap menampilkan "Terkunci", karena itu keputusan berkas, bukan efek pin di kanvas.
9. Sebagai pengguna editor, saya ingin pin baru yang saya tambahkan langsung tercatat sebagai pemakai berkasnya, supaya sinkronisasi berlaku sejak awal.
10. Sebagai pengguna editor, saya ingin pin hasil crop dan pin hasil "Ganti Gambar" juga tercatat sebagai pemakai berkas yang benar.
11. Sebagai pengguna editor, saya ingin memilih pin yang terkunci membuat saklar "Kunci posisi desain" langsung menyala, supaya saya tidak bingung antara keadaan pin dan saklar.
12. Sebagai pengguna editor, saya ingin saklar menyala juga saat saya membuka kunci lewat menu klik kanan, supaya semua jalur menunjukkan keadaan yang sama.
13. Sebagai pengguna editor, saya ingin mematikan saklar benar-benar membuka kunci, supaya pin bisa langsung digeser tanpa langkah tambahan.
14. Sebagai pengguna editor, saya ingin menyalakan saklar mengunci pin yang sedang dipilih, supaya tidak tergeser tak sengaja.
15. Sebagai pengguna editor, saya ingin pin terkunci tidak bisa digeser lewat kolom posisi di panel kanan, supaya kunci tidak bisa dilewati.
16. Sebagai pengguna editor, saya ingin memilih beberapa pin dengan status kunci berbeda menampilkan saklar dalam keadaan mati, supaya saya tidak salah mengira semuanya terkunci.
17. Sebagai pengguna editor, saya ingin mengunci beberapa pin sekaligus lewat saklar saat multi-seleksi, supaya pekerjaan cepat.
18. Sebagai pengguna editor, saya ingin latar kanvas terlihat seperti meja kerja yang lembut dengan pola halus, supaya mata tidak lelah saat menyusun layout lama.
19. Sebagai pengguna editor, saya ingin kertas tetap jelas menonjol dari latarnya, supaya batas area cetak langsung terlihat.
20. Sebagai pengguna yang mengaktifkan mode gelap, saya ingin latar kanvas berwarna arang lembut (bukan hitam pekat) dengan kertas tetap putih, supaya desain tetap terbaca.
21. Sebagai pengguna editor, saya ingin perubahan latar kanvas tidak mengubah warna atau isi kertas, supaya hasil ekspor tetap sama seperti sebelumnya.
22. Sebagai pengguna editor, saya ingin semua keadaan ini tetap benar setelah saya me-refresh halaman, karena status dan kunci ikut tersimpan.
23. Sebagai pengguna editor, saya ingin undo mengembalikan pin beserta status berkasnya, supaya membatalkan hapus juga memulihkan status "Ditempatkan".
24. Sebagai pengguna editor, saya ingin restore backup memulihkan status yang konsisten dengan pin di dalamnya, supaya proyek yang dipulihkan tidak menampilkan status palsu.

## Implementation Decisions

**Sumber kebenaran status aset**

- Pin menyimpan rujukan ke berkas asalnya (`assetId`). Pin baru dari "Tambah ke Layout", crop, dan "Ganti Gambar" mengisi rujukan ini. Pin duplikat mewarisi rujukan yang sama.
- Status `placed`/`unplaced` dan angka `inLayout` **dihitung dari pin yang benar-benar ada di semua halaman**, bukan disimpan sebagai fakta terpisah lalu disunting manual. Satu fungsi rekonsiliasi di modul state melakukan ini setiap kali daftar halaman berubah (tambah pin, hapus pin, duplikat, ganti gambar, kosongkan halaman, undo/redo, restore).
- Status `locked` tetap disimpan di berkas aset dan tidak disentuh rekonsiliasi, karena itu keputusan berkas, bukan akibat pin.
- Konsekuensi yang diterima: angka `inLayout` pada data contoh bawaan (12, 8, 6, 4) akan turun ke jumlah pin nyata. Angka lama itu hanya contoh tampilan, bukan hitungan sungguhan.

**Rujukan pin → aset**

- Pin hasil tambah-ke-layout, crop, dan ganti-gambar menyimpan `assetId` berkas sumbernya.
- Pin bawaan (seed) diberi `assetId` saat inisialisasi dengan mencocokkan label pin ke nama berkas. Kalau nama tidak cocok, pin dibiarkan tanpa rujukan dan tidak memengaruhi status apa pun.
- Pin yang tidak punya rujukan tetap berfungsi seperti biasa; hanya tidak ikut menghitung status berkas.

**Saklar kunci posisi**

- Nilai saklar **diturunkan** dari pin yang sedang dipilih: menyala bila semua pin terpilih terkunci, mati bila tidak semua terkunci (termasuk saat multi-seleksi campur).
- Menekan saklar menerapkan keadaan yang sama ke semua pin terpilih (sudah berperilaku begitu, dipertahankan).
- Panel inspektur berhenti membaca bidang `lock` pada data inspector sebagai sumber kebenaran untuk tampilan saklar; bidang itu hanya boleh dipakai sebagai nilai awal saat tidak ada pin terpilih.
- Penguncian berlaku di semua jalur perpindahan: geser di kanvas, geser lewat panel kanan (kolom posisi), dan perataan ke grid. Kerataan massal tidak menggeser pin terkunci.

**Latar kanvas**

- Perubahan hanya pada gaya area gulir kanvas dan varian mode gelapnya. Kertas tetap putih dan isi kanvas tidak berubah; satu-satunya pengecualian yang disepakati saat implementasi: di mode gelap kertas boleh diberi bayangan dan garis tepi tipis tambahan supaya tidak terlihat ditempel ke latar arang.
- Mode terang: warna meja kerja abu hangat, pola titik halus berjarak tetap, gradasi lembut di dua sudut.
- Mode gelap: arang lembut (bukan hitam pekat) dengan pola titik berpendar tipis; kertas tetap putih.
- Tidak menambah gambar atau aset biner; semuanya lewat CSS yang sudah ada.

## Testing Decisions

- **Satu seam saja:** uji perilaku lewat browser memakai skrip E2E yang sudah ada. Itu seam tertinggi di repo ini dan sudah dipakai untuk ekspor, backup, restore, undo, dan zoom. Semua asersi baru masuk ke skrip yang sama, bukan membuat skrip baru.
- Yang diuji hanya perilaku yang terlihat pengguna: teks status di panel gambar, angka "N di layout", keadaan `aria-checked` saklar, posisi pin setelah digeser, dan warna latar kanvas yang terhitung. Tidak menguji nama fungsi atau bentuk state internal.
- Tambahan tahap uji:
  1. Tambah berkas ke layout, hapus pin-nya, pastikan status berkas kembali "Belum Ditempatkan" dan angka "di layout" menjadi 0.
  2. Pilih pin bawaan yang terkunci, pastikan saklar menyala; matikan saklar, geser pin, pastikan posisinya berubah.
  3. Nyalakan saklar, coba geser pin, pastikan posisinya tidak berubah.
  4. Pastikan latar kanvas mode terang bukan hitam pekat dan kertas tetap putih.
- Prior art: tahap-tahap di skrip E2E yang sudah memeriksa teks DOM (indikator kertas, status simpan) dan kelas aktif. Pola asersi yang sama dipakai agar konsisten.
- Untuk fungsi murni yang sudah dipisahkan (geometri pin dan filter foto), tidak ditambah uji baru karena perilakunya tidak berubah oleh spesifikasi ini.

## Out of Scope

- Mengubah status `Terkunci` pada berkas secara otomatis dari kanvas.
- Migrasi khusus untuk proyek lama: pin yang belum punya rujukan berkas dicocokkan lewat label setiap kali daftar halaman dimuat (saat aplikasi dibuka, buka proyek, terapkan preset, pulihkan versi, atau impor backup). Pin yang labelnya tidak cocok dibiarkan tanpa rujukan dan tidak memengaruhi status.
- Mendesain ulang kertas itu sendiri (warna, tekstur, atau bingkai potong).
- Fitur baru seperti memindahkan pin antar halaman atau riwayat per-berkas.
- Mengubah hasil ekspor PNG/PDF.

## Further Notes

- Dugaan awal untuk latar hitam: setelan "Kanvas gelap" di halaman Pengaturan sedang aktif, sehingga latar memakai warna gelap hampir polos. Perbaikan desain harus tetap menghormati setelan itu, bukan mematikannya.
- Dokumen kontrak fungsional repo sudah diperbarui: perubahan pada modul state kini diizinkan untuk perbaikan bug atau pemindahan kode tanpa ubah perilaku; menambah action/state baru tetap perlu izin lead. Spesifikasi ini tidak menambah action baru.
- Ketiga masalah berasal dari satu akar yang sama: ada dua sumber kebenaran untuk fakta yang sama (status berkas vs isi kanvas; bidang `lock` di inspector vs `locked` di pin). Arah perbaikannya konsisten: turunkan satu dari yang lain.