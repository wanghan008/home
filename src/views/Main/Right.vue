<template>
  <div :class="store.mobileOpenState ? 'right' : 'right hidden'">
    <div class="logo" @click="store.mobileFuncState = !store.mobileFuncState">
      <span class="bg">个人</span>
      <span class="sm">主页</span>
    </div>
    <Func />
    <Link />
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
  @media (max-width: 720px) {
    margin-left: 0;
    width: 100%;
    &.hidden { display: none; }
  }
}
</style>
