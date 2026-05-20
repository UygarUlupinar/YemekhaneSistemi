document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Giriş yapılmamışsa login'e yönlendir
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('navbarKullaniciAd').innerText = user.name || 'Kullanıcı';

    const tutarInput = document.getElementById('yuklenecekTutar');
    const tutarButonlari = document.querySelectorAll('.tutar-sec');
    const kartNoInput = document.getElementById('kartNo');
    const sktInput = document.getElementById('skt');
    const odemeFormu = document.getElementById('odemeFormu');

    // Mevcut bakiyeyi backendden çek
    let mevcutBakiye = 0;
    try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        mevcutBakiye = data.balance || 0;
        document.getElementById('navbarBakiye').innerText = `Bakiye: ${mevcutBakiye.toFixed(2)} TL`;
    } catch (err) {
        console.log('Bakiye alınamadı.');
    }

    // Hızlı Tutar Butonları
    tutarButonlari.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tutarButonlari.forEach(b => {
                b.classList.remove('btn-primary', 'text-white');
                b.classList.add('btn-outline-primary');
            });
            e.target.classList.remove('btn-outline-primary');
            e.target.classList.add('btn-primary', 'text-white');
            tutarInput.value = e.target.getAttribute('data-tutar');
        });
    });

    // Manuel giriş
    tutarInput.addEventListener('input', () => {
        tutarButonlari.forEach(b => {
            b.classList.remove('btn-primary', 'text-white');
            b.classList.add('btn-outline-primary');
        });
    });

    // Kart Numarası Formatlama
    kartNoInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // SKT Formatlama
    sktInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // Form Gönderimi — Bakiye Yükle (UC-06)
    odemeFormu.addEventListener('submit', async (e) => {
        e.preventDefault();

        const yuklenecekMiktar = parseFloat(tutarInput.value);
        if (isNaN(yuklenecekMiktar) || yuklenecekMiktar < 10) {
            alert('Lütfen en az 10 TL yükleyiniz.');
            return;
        }

        const btnYazi = document.getElementById('btnOdemeYazi');
        const spinner = document.getElementById('odemeSpinner');
        const btnSubmit = document.getElementById('btnOdemeYap');

        btnYazi.innerText = 'İşleniyor...';
        spinner.classList.remove('d-none');
        btnSubmit.disabled = true;

        try {
            const res = await fetch('http://localhost:3000/api/balance/topup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: yuklenecekMiktar })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Bakiye yüklenemedi.');
                return;
            }

            mevcutBakiye = data.newBalance;
            document.getElementById('navbarBakiye').innerText = `Bakiye: ${mevcutBakiye.toFixed(2)} TL`;

            // Formu sıfırla
            odemeFormu.reset();
            tutarButonlari.forEach(b => {
                b.classList.remove('btn-primary', 'text-white');
                b.classList.add('btn-outline-primary');
            });

            // Başarı mesajı
            const basariMesaji = document.getElementById('odemeBasariMesaji');
            basariMesaji.innerText = `${yuklenecekMiktar.toFixed(2)} TL başarıyla yüklendi! Yeni bakiyeniz: ${mevcutBakiye.toFixed(2)} TL`;
            basariMesaji.classList.remove('d-none');
            setTimeout(() => basariMesaji.classList.add('d-none'), 5000);

        } catch (err) {
            alert('Sunucuya bağlanılamadı.');
        } finally {
            btnYazi.innerText = 'Ödemeyi Tamamla';
            spinner.classList.add('d-none');
            btnSubmit.disabled = false;
        }
    });
});