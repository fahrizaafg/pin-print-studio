# 02: Saklar "Kunci posisi desain" mengikuti pin terpilih

**What to build:** Saklar di panel kanan menunjukkan keadaan kunci dari pin yang sedang dipilih, bukan dari nilai awal yang terpisah. Memilih stiker daun hijau (pin bawaan yang terkunci) langsung menyalakan saklar. Mematikan saklar membuka kunci dan pin bisa digeser tanpa langkah tambahan. Menyalakan saklar mengunci pin terpilih. Saat beberapa pin dipilih dengan keadaan kunci berbeda, saklar tampil mati; menekannya mengunci semuanya.

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] Memilih pin yang terkunci membuat saklar menyala (keadaan `aria-checked` benar).
- [ ] Memilih pin yang tidak terkunci membuat saklar mati.
- [ ] Mematikan saklar membuat pin bisa langsung digeser; menyalakannya lagi menahan geseran.
- [ ] Membuka atau mengunci lewat menu klik kanan membuat saklar ikut berubah.
- [ ] Multi-seleksi dengan kunci campuran menampilkan saklar mati, dan menekannya mengunci semua pin terpilih.
- [ ] Memilih pin lain memindahkan saklar ke keadaan pin baru, tanpa perlu menyalakan-mematikan dulu.
- [ ] Tahap uji E2E baru membuktikan saklar dan geseran di browser.