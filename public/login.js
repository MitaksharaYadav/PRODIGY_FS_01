const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        messageDiv.textContent = data.message;

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/protected.html';
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        messageDiv.textContent = 'Error logging in user';
    }
});
