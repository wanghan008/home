<template>
  <div class="more-content">
    <section class="journal-section">
      <div class="section-heading">
        <span class="eyebrow">日常记录</span>
        <h2>心情日志</h2>
        <p>记录每天的心情、生活片段与灵感。</p>
      </div>
      <a class="journal-card" href="https://ta.whan.ipv64.de/blog">
        <span class="journal-copy">
          <strong>打开心情日记</strong>
          <small>查看已发布的文章与每日记录</small>
        </span>
        <span class="project-arrow">↗</span>
      </a>
    </section>

    <section class="games-section">
      <div class="section-heading">
        <span class="eyebrow">游戏创作</span>
        <h2>游戏项目</h2>
        <p>正在开发与持续更新的游戏作品。</p>
      </div>
      <div class="project-list">
        <a class="project-card" href="https://fish.studygame.ipv64.de/" target="_blank" rel="noopener noreferrer">
          <span class="project-index">01</span>
          <span class="project-copy">
            <strong>捕鱼游戏</strong>
            <small>在线体验 · 网页游戏与云端存档</small>
          </span>
          <span class="project-arrow">↗</span>
        </a>
        <a class="project-card" href="https://han.studygame.ipv64.de/" target="_blank" rel="noopener noreferrer">
          <span class="project-index">02</span>
          <span class="project-copy">
            <strong>雷霆战机</strong>
            <small>在线体验 · 科幻风格飞行射击游戏</small>
          </span>
          <span class="project-arrow">↗</span>
        </a>
      </div>
    </section>

    <div class="more-note">
      <span>持续更新</span>
      <span>开发记录 · 技术实验 · 游戏创作</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.more-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  padding: 1.5rem 0;
  .journal-section { margin-bottom: 2.2rem; }
  .games-section { margin-top: 0; }
  .section-heading {
    margin-bottom: 1.1rem;
    .eyebrow { font-size: 0.8rem; letter-spacing: 0.16em; opacity: 0.65; }
    h2 { margin-top: 0.65rem; font-size: clamp(1.35rem, 2vw, 1.8rem); font-weight: 600; letter-spacing: 0.04em; }
    p { margin-top: 0.6rem; font-size: 0.92rem; opacity: 0.72; }
  }
  .journal-card, .project-card {
    display: flex;
    align-items: center;
    min-height: 72px;
    padding: 0.85rem 1rem;
    border: 1px solid #ffffff20;
    border-radius: 10px;
    background: #ffffff0d;
    transition: background 0.25s, transform 0.25s, border-color 0.25s;
    &:hover { background: #ffffff1c; border-color: #ffffff50; transform: translateX(4px); text-decoration: none; }
  }
  .journal-card {
    min-height: 82px;
    border-color: #ffffff35;
    background: #ffffff12;
  }
  .journal-copy, .project-copy { display: flex; flex-direction: column; gap: 0.35rem; }
  .journal-copy strong { font-size: 1.02rem; font-weight: 600; }
  .journal-copy small, .project-copy small { font-size: 0.82rem; opacity: 0.65; }
  .project-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .project-card {
    .project-index { width: 42px; font-size: 0.8rem; letter-spacing: 0.08em; opacity: 0.55; }
    .project-copy strong { font-size: 0.98rem; font-weight: 600; }
  }
  .project-arrow { margin-left: auto; font-size: 1.15rem; opacity: 0.65; }
  .more-note { display: flex; justify-content: space-between; gap: 0.75rem; margin-top: 1.3rem; font-size: 0.78rem; opacity: 0.6; }
  @media (max-width: 720px) {
    padding: 1rem 0;
    .journal-section { margin-bottom: 1.7rem; }
    .journal-card, .project-card { min-height: 64px; }
  }
}
</style>
