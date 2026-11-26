<template>
  <div :class="store.mobileOpenState ? 'right' : 'right hidden'">
    <div class="logo" @click="store.mobileFuncState = !store.mobileFuncState">
      <span class="bg">个人</span>
      <span class="sm">主页</span>
    </div>
    <Func />
    <Link />
    <section class="journal-board">
      <div class="journal-heading">
        <span class="journal-eyebrow">DAILY NOTES</span>
        <strong>心情日志</strong>
        <span class="journal-description">记录每天的心情、生活片段与灵感</span>
      </div>
      <a class="journal-entry" href="https://ta.whan.ipv64.de/blog">
        <span>进入心情日记</span>
        <span class="journal-arrow">↗</span>
      </a>
    </section>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import Func from "@/views/Func/index.vue";
import Link from "@/components/Links.vue";
const store = mainStore();
</script>

<style lang="scss" scoped>
.right {
  width: 50%;
  margin-left: 0.75rem;
  .logo {
    width: 100%;
    font-family: "HarmonyOS_Regular", sans-serif;
    font-size: 2.1rem;
    font-weight: 600;
    position: fixed;
    top: 6%;
    left: 0;
    text-align: center;
    letter-spacing: 0.12em;
    transition: transform 0.3s;
    animation: fade 0.5s;
    &:active { transform: scale(0.95); }
    @media (min-width: 721px) { display: none; }
    @media (max-height: 720px) {
      width: calc(100% + 6px);
      top: 43.26px;
    }
    @media (max-width: 390px) { width: 391px; }
  }
  .journal-board {
    margin: 1.2rem 0.25rem 0;
    padding: 15px 17px;
    border: 1px solid #ffffff30;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff16, #ffffff08);
    backdrop-filter: blur(10px);
    animation: fade 0.5s;
    .journal-heading {
      display: flex;
      flex-direction: column;
      gap: 5px;
      .journal-eyebrow { font-size: 10px; letter-spacing: .18em; opacity: .58; }
      strong { font-size: 1.08rem; font-weight: 600; }
      .journal-description { font-size: .82rem; opacity: .68; }
    }
    .journal-entry {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #ffffff20;
      color: inherit;
      font-size: .9rem;
      text-decoration: none;
      .journal-arrow { font-size: 1.1rem; opacity: .7; }
      &:hover { opacity: .8; }
    }
  }
  @media (max-width: 720px) {
    margin-left: 0;
    width: 100%;
    &.hidden { display: none; }
    .journal-board { margin-top: 1rem; }
  }
}
</style>
