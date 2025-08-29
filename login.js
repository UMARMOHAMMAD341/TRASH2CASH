document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("error-msg");

    // Hardcoded login credentials (for demo)
    const validEmail = "admin@example.com";
    const validPassword = "123456";

    if (email === validEmail && password === validPassword) {
        window.location.href = "index.html"; // Redirect to homepage
    } else {
        errorMsg.textContent = "Invalid email or password.";
    }
});
