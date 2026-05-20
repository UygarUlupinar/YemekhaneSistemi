document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Giriş yapılmamışsa veya yetkisiz rolse login'e yönlendir
    if (!token || (user.role !== 'admin' && user.role !== 'staff_worker')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Eğer sadece görevliyse (admin değilse), admin linklerini gizle
    if (user.role !== 'admin') {
        const adminLinkleri = document.getElementById('mutfakAdminLinkleri');
        if(adminLinkleri) adminLinkleri.style.display = 'none';
    }

    const siparisListesi = document.getElementById('mutfakSiparisListesi');
    const sayac = document.getElementById('aktifSiparisSayisi');

    // Duruma göre görsel özellikler
    function durumBilgisi(status) {
        const map = {
            pending:   { border: 'border-danger',  btn: 'btn-danger',            btnText: 'Hazırlanıyor Olarak İşaretle', badge: 'bg-danger',           durum: 'Yeni Sipariş',     sonraki: 'preparing' },
            preparing: { border: 'border-info',    btn: 'btn-info text-white',   btnText: 'Teslimata Hazır Yap',         badge: 'bg-info text-dark',   durum: 'Hazırlanıyor',     sonraki: 'ready' },
            ready:     { border: 'border-warning', btn: 'btn-success',           btnText: 'Teslim Edildi İşaretle',      badge: 'bg-warning text-dark', durum: 'Teslimata Hazır', sonraki: 'delivered' },
        };
        return map[status] || null;
    }

    // Siparişleri backendden çek
    async function siparisleriGetir() {
        try {
            const res = await fetch('http://localhost:3000/api/orders/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return await res.json();
        } catch (err) {
            console.log('Siparişler alınamadı:', err);
            return [];
        }
    }

    // Arayüzü çiz
    async function arayuzuCiz() {
        siparisListesi.innerHTML = '<p class="text-muted">Yükleniyor...</p>';
        const siparisler = await siparisleriGetir();

        // Sadece aktif siparişleri göster (iptal ve teslim edilenler hariç)
        const aktif = siparisler.filter(s => ['pending', 'preparing', 'ready'].includes(s.status));

        siparisListesi.innerHTML = '';
        sayac.innerText = aktif.length;

        if (aktif.length === 0) {
            siparisListesi.innerHTML = `<div class="col-12"><div class="alert alert-success text-center">Tüm siparişler tamamlandı. Bekleyen sipariş yok!</div></div>`;
            return;
        }

        aktif.forEach(siparis => {
            const bilgi = durumBilgisi(siparis.status);
            if (!bilgi) return;

            const zaman = new Date(siparis.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 col-xl-3';
            card.innerHTML = `
                <div class="card h-100 shadow-sm border-2 ${bilgi.border}">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center border-bottom-0 pt-3">
                        <span class="fw-bold fs-5">#${siparis.id}</span>
                        <span class="badge ${bilgi.badge}">${bilgi.durum}</span>
                    </div>
                    <div class="card-body py-2">
                        <p class="text-muted small mb-3">🕒 ${zaman}</p>
                        <p class="mb-4 fw-medium text-dark">${siparis.items || 'Ürünler yükleniyor...'}</p>
                        <p class="fw-bold text-success">${parseFloat(siparis.total_price).toFixed(2)} TL</p>
                    </div>
                    <div class="card-footer bg-white border-top-0 pb-3">
                        <button class="btn ${bilgi.btn} w-100 fw-bold py-2 durum-btn" 
                            data-id="${siparis.id}" 
                            data-sonraki="${bilgi.sonraki}">
                            ${bilgi.btnText}
                        </button>
                    </div>
                </div>
            `;
            siparisListesi.appendChild(card);
        });

        butonlariBagla();
    }

    function butonlariBagla() {
        document.querySelectorAll('.durum-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const sonraki = e.target.getAttribute('data-sonraki');

                try {
                    const res = await fetch(`http://localhost:3000/api/orders/${id}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: sonraki })
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        alert(data.message || 'Güncelleme başarısız.');
                        return;
                    }

                    // Arayüzü yenile
                    arayuzuCiz();

                } catch (err) {
                    alert('Sunucuya bağlanılamadı.');
                }
            });
        });
    }

    // İlk yüklemede çiz, sonra her 10 saniyede yenile
    arayuzuCiz();
    setInterval(arayuzuCiz, 10000);
});