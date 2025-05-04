export const handleLogin = async (e, username, password, setMessage, onLogin, navigate) => {
  e.preventDefault();
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('login-success');
      onLogin();
      navigate('/');
    } else {
      setMessage(data.message || 'login-failure');
    }
  } catch (error) {
    console.error('Login error:', error);
    setMessage('login-error');
  }
};

export const handleRegister = async (e, username, password, confirmPassword, setMessage, navigate) => {
  e.preventDefault();
  if (!username || !password || password !== confirmPassword) {
    setMessage('password-mismatch');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('register-success');
      navigate('/login');
    } else {
      setMessage(data.message || 'register-failure');
    }
  } catch (error) {
    console.error('Registration error:', error);
    setMessage('register-error');
  }
}; 