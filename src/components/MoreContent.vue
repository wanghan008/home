<template>
  <div class="more-content">
    <div class="intro">
      <div class="eyebrow">关于这里</div>
      <h3>把想法变成作品</h3>
      <p>这里用于展示个人项目、开发中的作品，以及在技术探索过程中的一些成果。</p>
      <p>目前主要关注网页开发、游戏制作和实用工具，希望持续把想法做成可以体验的作品。</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.more-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
  min-height: 180px;

  .intro {
    width: 100%;
    padding: 22px 24px;
    border-radius: 12px;
    background: rgb(0 0 0 / 14%);
    border: 1px solid rgb(255 255 255 / 12%);

    .eyebrow {
      margin-bottom: 10px;
      font-size: 0.85rem;
      letter-spacing: 0.18em;
      opacity: 0.7;
    }

    h3 {
      margin: 0 0 14px;
      font-size: 1.35rem;
      font-weight: 600;
    }

    p {
      margin: 8px 0 0;
      line-height: 1.8;
      font-size: 0.95rem;
      opacity: 0.86;
    }
  }
}
</style>
