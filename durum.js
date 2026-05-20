document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Giriş yapılmamışsa login'e yönlendir
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('navbarKullaniciAd').innerText = user.name || 'Kullanıcı';

    const progressBar = document.getElementById('siparisProgressBar');
    const durumRozeti = document.getElementById('durumRozeti');
    const adim2 = document.getElementById('adim2');
    const adim3 = document.getElementById('adim3');
    const adim4 = document.getElementById('adim4');
    const pollingBilgi = document.getElementById('pollingBilgi');

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

    // Durumu arayüze yansıt
    function arayuzuGuncelle(status) {
        if (status === 'preparing') {
            progressBar.style.width = '50%';
            progressBar.innerText = '%50';
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-info';
            durumRozeti.innerText = 'Hazırlanıyor';
            durumRozeti.className = 'badge bg-info fs-6';
            adim2.classList.remove('text-muted');
            adim2.innerHTML = '<span class="text-success me-2">✔</span> <strong>Hazırlanıyor</strong>';
        }
        else if (status === 'ready') {
            progressBar.style.width = '75%';
            progressBar.innerText = '%75';
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-warning text-dark';
            durumRozeti.innerText = 'Teslimata Hazır';
            durumRozeti.className = 'badge bg-warning text-dark fs-6';
            adim2.classList.remove('text-muted');
            adim2.innerHTML = '<span class="text-success me-2">✔</span> <strong>Hazırlanıyor</strong>';
            adim3.classList.remove('text-muted');
            adim3.innerHTML = '<span class="text-success me-2">✔</span> <strong>Teslimata Hazır</strong>';
        }
        else if (status === 'delivered') {
            progressBar.style.width = '100%';
            progressBar.innerText = '%100';
            progressBar.className = 'progress-bar bg-success';
            durumRozeti.innerText = 'Teslim Edildi';
            durumRozeti.className = 'badge bg-success fs-6';
            adim2.classList.remove('text-muted');
            adim2.innerHTML = '<span class="text-success me-2">✔</span> <strong>Hazırlanıyor</strong>';
            adim3.classList.remove('text-muted');
            adim3.innerHTML = '<span class="text-success me-2">✔</span> <strong>Teslimata Hazır</strong>';
            adim4.classList.remove('text-muted');
            adim4.innerHTML = '<span class="text-success me-2">✔</span> <strong>Teslim Edildi</strong>';
            pollingBilgi.className = 'alert alert-success text-center mb-0';
            pollingBilgi.innerHTML = '<strong>Afiyet olsun!</strong> Siparişiniz başarıyla teslim edilmiştir.';
            clearInterval(pollingInterval);
        }
        else if (status === 'cancelled') {
            progressBar.style.width = '0%';
            durumRozeti.innerText = 'İptal Edildi';
            durumRozeti.className = 'badge bg-secondary fs-6';
            pollingBilgi.className = 'alert alert-warning text-center mb-0';
            pollingBilgi.innerHTML = 'Siparişiniz iptal edilmiştir.';
            clearInterval(pollingInterval);
        }
    }

    // Backend'den en son siparişi çek (UC-07)
    async function siparisDurumunuKontrolEt() {
        try {
            const res = await fetch('http://localhost:3000/api/orders/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const siparisler = await res.json();

            if (!siparisler || siparisler.length === 0) {
                pollingBilgi.className = 'alert alert-info text-center mb-0';
                pollingBilgi.innerHTML = 'Aktif siparişiniz bulunmamaktadır.';
                clearInterval(pollingInterval);
                return;
            }

            // En son siparişi al
            const sonSiparis = siparisler[0];
            
            document.getElementById('canliSiparisNo').innerText = `Sipariş No: #${sonSiparis._id.slice(-6).toUpperCase()}`;
            document.getElementById('canliSiparisIcerik').innerText = sonSiparis.items || 'Menü';
            
            arayuzuGuncelle(sonSiparis.status);

            // Teslim edildiyse veya iptal edildiyse polling durdur
            if (sonSiparis.status === 'delivered' || sonSiparis.status === 'cancelled') {
                clearInterval(pollingInterval);
            }

        } catch (err) {
            console.log('Durum alınamadı:', err);
        }
    }

    // Sayfa açılınca hemen çek, sonra her 5 saniyede bir kontrol et
    siparisDurumunuKontrolEt();
    const pollingInterval = setInterval(siparisDurumunuKontrolEt, 5000);
});