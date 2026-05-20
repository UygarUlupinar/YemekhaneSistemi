let aktifBakiye = 0;
const menuFiyati = 45.00;

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Giriş yapılmamışsa login'e yönlendir
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('navbarKullaniciAd').innerText = user.name || 'Kullanıcı';

    const menuContainer = document.getElementById('menuContainer');
    const siparisModalElement = document.getElementById('siparisModal');
    const siparisModal = new bootstrap.Modal(siparisModalElement);
    const modalTarih = document.getElementById('modalTarih');

    // Bakiyeyi backendden çek
    try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        aktifBakiye = data.balance || 0;
        document.getElementById('navbarBakiye').innerText = `Bakiye: ${aktifBakiye.toFixed(2)} TL`;
    } catch (err) {
        console.log('Bakiye alınamadı.');
        document.getElementById('navbarBakiye').innerText = 'Bakiye: ?';
    }

    // Menüleri backendden çek
    let menuler = [];
    try {
        const res = await fetch('http://localhost:3000/api/menus');
        menuler = await res.json();
    } catch (err) {
        menuContainer.innerHTML = '<p class="text-danger">Menü yüklenemedi. Backend çalışıyor mu?</p>';
        return;
    }

    if (menuler.length === 0) {
        menuContainer.innerHTML = '<p class="text-muted">Henüz menü eklenmemiş.</p>';
        return;
    }

    // Menüleri ekrana bas
    menuler.forEach((menu) => {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-6 col-lg-4';
        // Tarih formatlama
        let tarihStr = menu.available_date;
        try {
            const dateObj = new Date(menu.available_date);
            tarihStr = dateObj.toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' });
        } catch(e) {}

        let yiyeceklerHTML = '';
        if (menu.name && menu.name.includes(',')) {
            const yiyecekler = menu.name.split(',').map(y => y.trim());
            yiyeceklerHTML = `<ul class="list-unstyled text-start mx-auto mb-3" style="max-width: 80%;">`;
            yiyecekler.forEach(y => {
                yiyeceklerHTML += `<li class="mb-2"><span class="text-success me-2">✔</span><span class="fw-medium">${y}</span></li>`;
            });
            yiyeceklerHTML += `</ul>`;
        } else {
            yiyeceklerHTML = `<h5 class="card-title fw-bold text-dark mb-4 px-2">${menu.name}</h5>`;
        }

        cardCol.innerHTML = `
            <div class="card h-100 shadow border-0 rounded-4 overflow-hidden hover-card">
                <div class="card-header bg-primary text-white border-bottom-0 py-3 text-center">
                    <h6 class="mb-0 fw-bold">📅 ${tarihStr}</h6>
                </div>
                <div class="card-body text-center d-flex flex-column pt-4">
                    ${yiyeceklerHTML}
                    <div class="mt-auto">
                        <hr class="text-muted opacity-25">
                        <div class="d-flex justify-content-between align-items-center mb-3 px-2">
                            <span class="text-muted small px-2 py-1 bg-light rounded-pill">${menu.description || 'Kalori belirtilmemiş'}</span>
                            <span class="fw-bold fs-5 text-success">${parseFloat(menu.price).toFixed(2)} TL</span>
                        </div>
                        <button class="btn btn-primary w-100 fw-bold siparis-btn rounded-pill py-2 shadow-sm" 
                            data-id="${menu._id}" 
                            data-fiyat="${menu.price}"
                            data-isim="${menu.name}">
                            Siparişi Oluştur
                        </button>
                    </div>
                </div>
            </div>
        `;
        menuContainer.appendChild(cardCol);
    });

    // Sipariş butonları
    let secilenMenuId = null;
    let secilenFiyat = 0;

    document.querySelectorAll('.siparis-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            secilenMenuId = e.target.getAttribute('data-id');
            secilenFiyat = parseFloat(e.target.getAttribute('data-fiyat'));
            const isim = e.target.getAttribute('data-isim');

            modalTarih.innerText = isim;
            document.getElementById('mevcutBakiye').innerText = `${aktifBakiye.toFixed(2)} TL`;
            document.getElementById('kalanBakiye').innerText = `${(aktifBakiye - secilenFiyat).toFixed(2)} TL`;
            document.getElementById('siparisBasariMesaji').classList.add('d-none');
            document.getElementById('btnSiparisiOnayla').disabled = false;

            siparisModal.show();
        });
    });

    // Siparişi onayla
    document.getElementById('btnSiparisiOnayla').addEventListener('click', async () => {
        if (aktifBakiye < secilenFiyat) {
            alert('Yetersiz bakiye! Lütfen bakiye yükleyin.');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: [{ menu_id: secilenMenuId, quantity: 1 }]
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Sipariş oluşturulamadı.');
                return;
            }

            aktifBakiye -= secilenFiyat;
            document.getElementById('siparisBasariMesaji').classList.remove('d-none');
            document.getElementById('btnSiparisiOnayla').disabled = true;

            setTimeout(() => siparisModal.hide(), 2000);

        } catch (err) {
            alert('Sunucuya bağlanılamadı.');
        }
    });
});