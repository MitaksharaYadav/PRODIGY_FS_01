const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        messageDiv.textContent = data.message;

        // Optional: Redirect to login page or display success message
        if (response.ok) {
            // Example: Redirect to login page after successful registration
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error registering user:', error);
        messageDiv.textContent = 'Error registering user';
    }
});
