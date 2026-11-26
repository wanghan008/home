<template>
  <!-- 首页介绍 -->
  <div class="message">
    <div class="logo">
      <div class="name">个人主页</div>
      <div class="subtitle">项目 · 作品 · 技术探索</div>
    </div>
    <div class="description cards" @click="changeBox">
      <div class="content">
        <Icon size="16">
          <QuoteLeft />
        </Icon>
        <Transition name="fade" mode="out-in">
          <div :key="descriptionText.hello + descriptionText.text" class="text">
            <p>{{ descriptionText.hello }}</p>
            <p>{{ descriptionText.text }}</p>
          </div>
        </Transition>
        <Icon size="16">
          <QuoteRight />
        </Icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { QuoteLeft, QuoteRight } from "@vicons/fa";
import { Error } from "@icon-park/vue-next";
import { mainStore } from "@/store";

const store = mainStore();

// 首页简介
const descriptionText = reactive({
  hello: import.meta.env.VITE_DESC_HELLO || "你好，欢迎来到我的主页",
  text: import.meta.env.VITE_DESC_TEXT || "这里展示我的项目、作品与技术探索。",
});

// 切换右侧功能区
const changeBox = () => {
  if (store.getInnerWidth >= 721) {
    store.boxOpenState = !store.boxOpenState;
  } else {
    ElMessage({
      message: "当前屏幕宽度不足，暂不能打开内容面板",
      grouping: true,
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
  }
};

// 监听状态变化
watch(
  () => store.boxOpenState,
  (value) => {
    if (value) {
      descriptionText.hello =
        import.meta.env.VITE_DESC_HELLO_OTHER || "欢迎继续浏览";
      descriptionText.text =
        import.meta.env.VITE_DESC_TEXT_OTHER || "你可以通过下方入口查看我的项目与作品。";
    } else {
      descriptionText.hello =
        import.meta.env.VITE_DESC_HELLO || "你好，欢迎来到我的主页";
      descriptionText.text =
        import.meta.env.VITE_DESC_TEXT || "这里展示我的项目、作品与技术探索。";
    }
  },
);
</script>

<style lang="scss" scoped>
.message {
  .logo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    min-height: 120px;
    animation: fade 0.5s;

    .name {
      font-size: clamp(2.8rem, 6vw, 5rem);
      line-height: 1.25;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-shadow: 0 2px 18px #00000050;
    }

    .subtitle {
      margin-top: 12px;
      font-size: 1rem;
      letter-spacing: 0.28em;
      color: rgb(255 255 255 / 78%);
    }
  }

  .description {
    padding: 1rem;
    margin-top: 2rem;
    max-width: 460px;
    animation: fade 0.5s;

    .content {
      display: flex;
      justify-content: space-between;

      .text {
        margin: 0.75rem 1rem;
        line-height: 2rem;
        margin-right: auto;
        transition: opacity 0.2s;

        p:first-of-type {
          font-weight: 600;
          letter-spacing: 0.04em;
        }
      }

      .xicon:nth-of-type(2) {
        align-self: flex-end;
      }
    }

    @media (max-width: 720px) {
      max-width: 100%;
      pointer-events: none;
    }
  }
}
</style>
