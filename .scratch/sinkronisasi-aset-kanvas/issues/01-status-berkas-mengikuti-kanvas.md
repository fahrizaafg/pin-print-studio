# 01: Status berkas mengikuti isi kanvas

**What to build:** Status di panel "Gambar Diunggah" (Ditempatkan / Belum Ditempatkan / Terkunci) dan angka "N di layout" selalu mencerminkan pin yang benar-benar ada di kanvas. Saat pin terakhir dari sebuah berkas dihapus, berkas itu kembali "Belum Ditempatkan" dan angkanya menjadi 0. Kalau masih ada pin lain dari berkas yang sama — termasuk di halaman lain — status tetap "Ditempatkan" dan angkanya sesuai jumlah pin nyata.

Agar mungkin, pin yang dibuat dari "Tambah ke Layout", crop, dan "Ganti Gambar" mencatat berkas asalnya. Pin duplikat mewarisi catatan yang sama. Pin bawaan dicocokkan ke berkasnya lewat nama saat aplikasi dimuat; kalau namanya tidak cocok, pin itu tidak ikut menghitung apa pun.

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] Menambah berkas ke layout lalu menghapus pin-nya mengembalikan status berkas itu ke "Belum Ditempatkan" dan angkanya ke 0.
- [ ] Menghapus satu pin dari dua pin berkas yang sama menyisakan status "Ditempatkan" dengan angka turun satu.
- [ ] Status dihitung dari seluruh halaman: pin di halaman 2 tetap membuat berkasnya "Ditempatkan" saat pengguna berada di halaman 1.
- [ ] Menghapus beberapa pin sekaligus memperbarui status semua berkas terkait dengan benar.
- [ ] Mengosongkan satu halaman memperbarui berkas yang pin-nya hanya ada di halaman itu.
- [ ] Menduplikat pin tidak mengubah status berkas menjadi salah dan angkanya bertambah sesuai jumlah pin.
- [ ] Pin hasil crop dan pin hasil "Ganti Gambar" tercatat sebagai pemakai berkas yang benar.
- [ ] Berkas berstatus "Terkunci" tetap "Terkunci" apa pun isi kanvas.
- [ ] Undo setelah menghapus pin mengembalikan status "Ditempatkan" dan angkanya.
- [ ] Restore backup menghasilkan status yang cocok dengan pin di dalam backup.
- [ ] Tahap uji E2E baru membuktikan perilaku di atas di browser, bukan hanya di state.