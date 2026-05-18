<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">lp 低代码平台</div>
      <nav>
        <router-link to="/">首页</router-link>
      </nav>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #eee;
  padding: 20px;
}

.sidebar .logo {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #fff;
}

.sidebar nav a {
  display: block;
  color: #aab;
  text-decoration: none;
  padding: 8px 0;
  font-size: 14px;
}

.sidebar nav a:hover,
.sidebar nav a.router-link-active {
  color: #fff;
}

.main {
  flex: 1;
  padding: 24px;
  background: #f5f6fa;
}
</style>
