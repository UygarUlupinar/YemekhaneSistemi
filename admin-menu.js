document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Sadece admin girebilir
    if (!token || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('menuEkleForm');
    const tabloGovdesi = document.getElementById('menuTabloGövdesi');
    const sayac = document.getElementById('toplamMenuSayisi');

    // Tarihi okunaklı formata çevir
    function tarihFormatla(tarihString) {
        const parcalar = tarihString.split('T')[0].split('-');
        return `${parcalar[2]}.${parcalar[1]}.${parcalar[0]}`;
    }

    // Menüleri backendden çek ve tabloya yaz (UC-08)
    async function menuleriListele() {
        tabloGovdesi.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Yükleniyor...</td></tr>';

        try {
            const res = await fetch('http://localhost:3000/api/menus');
            const menuler = await res.json();

            tabloGovdesi.innerHTML = '';

            if (menuler.length === 0) {
                tabloGovdesi.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Sistemde kayıtlı menü bulunmamaktadır.</td></tr>';
                sayac.innerText = 'Toplam: 0';
                return;
            }

            menuler.forEach(menu => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${tarihFormatla(menu.available_date)}</strong></td>
                    <td>${menu.name}</td>
                    <td><small class="text-muted">${menu.description || '-'}</small></td>
                    <td><span class="badge bg-success">${parseFloat(menu.price).toFixed(2)} TL</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-danger sil-btn" data-id="${menu._id}">Sil</button>
                    </td>
                `;
                tabloGovdesi.appendChild(tr);
            });

            sayac.innerText = `Toplam: ${menuler.length}`;
            silmeButonlariniBagla();

        } catch (err) {
            tabloGovdesi.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Menüler yüklenemedi.</td></tr>';
        }
    }

    // Yeni menü ekle (UC-08)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const corba = document.getElementById('menuCorba').value;
        const anaYemek = document.getElementById('menuAnaYemek').value;
        const yardimci = document.getElementById('menuYardimci').value;
        const tatli = document.getElementById('menuTatli').value;
        const kalori = document.getElementById('menuKalori').value;
        const fiyat = document.getElementById('menuUcret').value;

        const yeniMenu = {
            name: `${corba}, ${anaYemek}, ${yardimci}, ${tatli}`,
            description: `Kalori: ${kalori} kcal`,
            price: parseFloat(fiyat),
            category: 'tabldot',
            available_date: document.getElementById('menuTarih').value
        };

        try {
            const res = await fetch('http://localhost:3000/api/menus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(yeniMenu)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Menü eklenemedi.');
                return;
            }

            form.reset();
            menuleriListele();

        } catch (err) {
            alert('Sunucuya bağlanılamadı.');
        }
    });

    // Menü sil
    function silmeButonlariniBagla() {
        document.querySelectorAll('.sil-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');

                if (!confirm('Bu menüyü silmek istediğinize emin misiniz?')) return;

                try {
                    const res = await fetch(`http://localhost:3000/api/menus/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        alert('Silme işlemi başarısız.');
                        return;
                    }

                    menuleriListele();

                } catch (err) {
                    alert('Sunucuya bağlanılamadı.');
                }
            });
        });
    }

    menuleriListele();
});