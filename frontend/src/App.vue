<template>
  <div id="app">
    <nav class="navbar">
      <div class="container">
        <h1>📧 临时邮箱接码工具</h1>
        <div class="nav-links">
          <router-link to="/">首页</router-link>
          <router-link to="/config">配置</router-link>
          <router-link to="/status">状态</router-link>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.navbar .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar h1 {
  font-size: 1.5rem;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #764ba2;
}

.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn:active {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #6c757d;
}

.btn-success {
  background: #28a745;
}

.btn-danger {
  background: #dc3545;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.input-group input,
.input-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.input-group input:focus,
.input-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #667eea;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .navbar .container {
    flex-direction: column;
    gap: 1rem;
  }

  .main-content {
    padding: 0 1rem;
  }

  .card {
    padding: 1.5rem;
  }
}
</style>
