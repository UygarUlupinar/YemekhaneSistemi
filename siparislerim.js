let secilenSiparisId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('navbarKullaniciAd').innerText = user.name || 'Kullanıcı';

    const siparisListesiContainer = document.getElementById('siparisListesiContainer');
    const iptalModalElement = document.getElementById('iptalModal');
    const iptalModal = new bootstrap.Modal(iptalModalElement);

    // Bakiyeyi navbar'a yaz
    try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const bakiye = data.balance || 0;
        document.getElementById('navbarBakiye').innerText = `Bakiye: ${bakiye.toFixed(2)} TL`;
    } catch (err) {
        console.log('Bakiye alınamadı.');
    }

    // Siparişleri backendden çek (UC-07)
    async function siparisleriGetir() {
        try {
            const res = await fetch('http://localhost:3000/api/orders/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return await res.json();
        } catch (err) {
            console.log('Siparişler alınamadı.');
            return [];
        }
    }

    // Duruma göre badge rengi
    function durumBadge(status) {
        const renkler = {
            pending: 'bg-primary',
            preparing: 'bg-warning text-dark',
            ready: 'bg-info text-dark',
            delivered: 'bg-success',
            cancelled: 'bg-secondary'
        };
        const isimler = {
            pending: 'Onaylandı',
            preparing: 'Hazırlanıyor',
            ready: 'Hazır',
            delivered: 'Teslim Edildi',
            cancelled: 'İptal Edildi'
        };
        return { renk: renkler[status] || 'bg-secondary', isim: isimler[status] || status };
    }

    // Siparişleri ekrana çiz
    async function siparisleriListele() {
        siparisListesiContainer.innerHTML = '<p class="text-muted">Yükleniyor...</p>';
        const siparisler = await siparisleriGetir();

        siparisListesiContainer.innerHTML = '';

        if (!Array.isArray(siparisler) || siparisler.length === 0) {
            siparisListesiContainer.innerHTML = `<div class="col-12"><div class="alert alert-info">Aktif siparişiniz bulunmamaktadır.</div></div>`;
            return;
        }

        siparisler.forEach(siparis => {
            const iptalEdilebilir = siparis.status === 'pending';
            const btnClass = iptalEdilebilir ? 'btn-outline-danger' : 'btn-secondary disabled';
            const btnText = iptalEdilebilir ? 'Siparişi İptal Et' : 'İptal Edilemez';
            const { renk, isim } = durumBadge(siparis.status);
            // MongoDB: createdAt (timestamps: true)
            const tarih = new Date(siparis.createdAt).toLocaleDateString('tr-TR');

            const cardCol = document.createElement('div');
            cardCol.className = 'col-md-6';
            cardCol.innerHTML = `
                <div class="card shadow-sm border-0 rounded-3 h-100" id="siparis-${siparis._id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title fw-bold text-dark mb-0">${tarih}</h5>
                            <span class="badge ${renk}">${isim}</span>
                        </div>
                        <p class="text-muted small mb-3">${siparis.items || 'Ürünler yükleniyor...'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-medium text-success">${parseFloat(siparis.total_price).toFixed(2)} TL</span>
                            <button class="btn btn-sm ${btnClass} iptal-btn" 
                                data-id="${siparis._id}">
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            siparisListesiContainer.appendChild(cardCol);
        });

        baglaIptalButonlari();
    }

    function baglaIptalButonlari() {
        document.querySelectorAll('.iptal-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                secilenSiparisId = e.target.getAttribute('data-id');
                document.getElementById('iptalTarih').innerText = `Sipariş #${secilenSiparisId.slice(-6)}`;
                iptalModal.show();
            });
        });
    }

    // İptal onayla (UC-05)
    document.getElementById('btnIptaliOnayla').addEventListener('click', async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/orders/${secilenSiparisId}/cancel`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'İptal işlemi başarısız.');
                return;
            }

            iptalModal.hide();

            const basariMesaji = document.getElementById('iptalBasariMesaji');
            basariMesaji.innerText = 'Sipariş iptal edildi. Bakiyenize iade yapıldı.';
            basariMesaji.classList.remove('d-none');
            setTimeout(() => basariMesaji.classList.add('d-none'), 3000);

            // Bakiyeyi güncelle
            try {
                const meRes = await fetch('http://localhost:3000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const meData = await meRes.json();
                document.getElementById('navbarBakiye').innerText = `Bakiye: ${(meData.balance || 0).toFixed(2)} TL`;
            } catch {}

            siparisleriListele();

        } catch (err) {
            alert('Sunucuya bağlanılamadı.');
        }
    });

    siparisleriListele();
});