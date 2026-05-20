document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const alertBox = document.getElementById('alertBox');

    // Alert kutusunu sıfırla
    alertBox.classList.add('d-none');
    alertBox.innerText = '';
    alertBox.classList.remove('alert-success');
    alertBox.classList.add('alert-danger');

    // Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
        showError('Şifreler eşleşmiyor!');
        return;
    }

    // Üniversite e-posta kontrolü
    const validDomains = ['@stu.atlas.edu.tr', '@atlas.edu.tr'];
    const isValidEmail = validDomains.some(domain => email.endsWith(domain));
    if (!isValidEmail) {
        showError('Lütfen geçerli bir üniversite e-posta adresi girin (@stu.atlas.edu.tr veya @atlas.edu.tr).');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fullName,
                email: email,
                password: password,
                role: 'student'
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showError(data.message || 'Kayıt başarısız.');
            return;
        }

        // Başarı mesajı göster
        alertBox.classList.remove('alert-danger', 'd-none');
        alertBox.classList.add('alert-success');
        alertBox.innerText = 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...';

        this.reset();

        // 2 saniye sonra login sayfasına git
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (err) {
        showError('Sunucuya bağlanılamadı. Backend çalışıyor mu?');
    }
});

function showError(message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerText = message;
    alertBox.classList.remove('d-none');
}