document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Sadece admin girebilir
    if (!token || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Raporu backendden çek (UC-10)
    try {
        const res = await fetch('http://localhost:3000/api/balance/report', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // İstatistik kartlarını doldur
        document.getElementById('gunlukGelir').innerText =
            parseFloat(data.revenue.total_revenue || 0).toFixed(2) + ' TL';
        document.getElementById('tamamlananSiparis').innerText =
            data.revenue.total_orders || 0;

        // İptal sayısını bul
        const iptal = data.byStatus.find(s => s.status === 'cancelled');
        document.getElementById('iptalSiparis').innerText = iptal ? iptal.count : 0;

        // En popüler menü
        if (data.topMenus.length > 0) {
            document.getElementById('populerMenu').innerText = data.topMenus[0].name;
        }

        // Grafik — duruma göre sipariş sayısı
        const ctx = document.getElementById('gelirGrafigi').getContext('2d');
        const durumlar = data.byStatus.map(s => {
            const isimler = {
                pending: 'Bekliyor',
                preparing: 'Hazırlanıyor',
                ready: 'Hazır',
                delivered: 'Teslim Edildi',
                cancelled: 'İptal'
            };
            return isimler[s.status] || s.status;
        });
        const sayilar = data.byStatus.map(s => s.count);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: durumlar,
                datasets: [{
                    label: 'Sipariş Sayısı',
                    data: sayilar,
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // En çok satan menüler listesi
        const islemListesi = document.getElementById('sonIslemler');
        islemListesi.innerHTML = '';

        if (data.topMenus.length === 0) {
            islemListesi.innerHTML = '<li class="list-group-item text-muted">Henüz veri yok.</li>';
        } else {
            data.topMenus.forEach((menu, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center py-3';
                li.innerHTML = `
                    <div>
                        <small class="text-muted d-block">#${index + 1}</small>
                        <span class="fw-medium text-dark">${menu.name}</span>
                    </div>
                    <span class="fw-bold text-success">${menu.sold} adet</span>
                `;
                islemListesi.appendChild(li);
            });
        }

    } catch (err) {
        console.log('Rapor alınamadı:', err);
        alert('Rapor yüklenemedi. Backend çalışıyor mu?');
    }
});