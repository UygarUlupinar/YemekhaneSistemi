document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const alertBox = document.getElementById('loginAlertBox');

    // Alert kutusunu sıfırla
    alertBox.classList.add('d-none');
    alertBox.innerText = '';
    alertBox.classList.remove('alert-success');
    alertBox.classList.add('alert-danger');

    // Basit doğrulama
    if (email === '' || password === '') {
        showLoginError("Lütfen e-posta ve şifrenizi girin.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showLoginError(data.message || "Giriş başarısız.");
            return;
        }

        // Token ve kullanıcı bilgisini kaydet
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Role göre yönlendir
        if (data.user.role === 'admin') {
            window.location.href = 'admin-menu.html';
        } else if (data.user.role === 'staff_worker') {
            window.location.href = 'gorevli.html';
        } else {
            window.location.href = 'menu.html';
        }

    } catch (err) {
        showLoginError("Sunucuya bağlanılamadı. Backend çalışıyor mu?");
    }
});

function showLoginError(message) {
    const alertBox = document.getElementById('loginAlertBox');
    alertBox.innerText = message;
    alertBox.classList.remove('d-none');
}