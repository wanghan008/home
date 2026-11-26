<template>
  <div class="message">
    <div class="logo">
      <img class="logo-img" :src="siteLogo" alt="主页图标" />
    </div>
    <div class="description cards" @click="changeBox">
      <div class="content">
        <Icon size="16"><QuoteLeft /></Icon>
        <Transition name="fade" mode="out-in">
          <div :key="descriptionText.hello + descriptionText.text" class="text">
            <p>{{ descriptionText.hello }}</p>
            <p>{{ descriptionText.text }}</p>
          </div>
        </Transition>
        <Icon size="16"><QuoteRight /></Icon>
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

const siteLogo = import.meta.env.VITE_SITE_MAIN_LOGO || "/images/icon/logo.png";
const descriptionText = reactive({
  hello: import.meta.env.VITE_DESC_HELLO || "欢迎来到我的主页",
  text: import.meta.env.VITE_DESC_TEXT || "这里记录我的开发项目、技术探索与日常分享。",
});

const changeBox = () => {
  if (store.getInnerWidth >= 721) {
    store.boxOpenState = !store.boxOpenState;
  } else {
    ElMessage({
      message: "当前屏幕宽度不足，暂时无法打开项目详情",
      grouping: true,
      icon: h(Error, { theme: "filled", fill: "#efefef" }),
    });
  }
};

watch(
  () => store.boxOpenState,
  (value) => {
    descriptionText.hello = value
      ? import.meta.env.VITE_DESC_HELLO_OTHER || "继续探索"
      : import.meta.env.VITE_DESC_HELLO || "欢迎来到我的主页";
    descriptionText.text = value
      ? import.meta.env.VITE_DESC_TEXT_OTHER || "点击右侧项目入口，了解我正在制作的作品。"
      : import.meta.env.VITE_DESC_TEXT || "这里记录我的开发项目、技术探索与日常分享。";
  },
);
</script>

<style lang="scss" scoped>
.message {
  .logo {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    animation: fade 0.5s;
    max-width: 460px;
    .logo-img {
      border-radius: 24px;
      width: 112px;
      height: 112px;
      object-fit: cover;
      box-shadow: 0 12px 36px #00000035;
      border: 1px solid #ffffff45;
    }
    @media (max-width: 768px) {
      .logo-img { width: 96px; height: 96px; }
    }
  }
  .description {
    padding: 1.25rem;
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
        p:first-child {
          font-weight: 600;
          letter-spacing: 0.04em;
        }
      }
      .xicon:nth-of-type(2) { align-self: flex-end; }
    }
    @media (max-width: 720px) {
      max-width: 100%;
      pointer-events: none;
    }
  }
}
</style>
