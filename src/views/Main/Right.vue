<template>
  <div :class="store.mobileOpenState ? 'right' : 'right hidden'">
    <div class="logo" @click="store.mobileFuncState = !store.mobileFuncState">
      <span class="bg">个人</span>
      <span class="sm">主页</span>
    </div>
    <Func />
    <Link />
    <section v-if="modules.length" class="homepage-modules">
      <div class="module-section-title">主页内容</div>
      <article v-for="module in modules" :key="module.id" class="module-card" :class="{ clickable: module.link_url }" @click="openModule(module)">
        <img v-if="module.image_url" class="module-image" :src="module.image_url" :alt="module.title" loading="lazy" />
        <div class="module-copy">
          <span v-if="module.subtitle" class="module-subtitle">{{ module.subtitle }}</span>
          <strong><span v-if="module.icon" class="module-icon">{{ module.icon }}</span>{{ module.title }}</strong>
          <p v-if="module.description">{{ module.description }}</p>
          <span v-if="module.link_url" class="module-more">查看详情 ↗</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { mainStore } from "@/store";
import Func from "@/views/Func/index.vue";
import Link from "@/components/Links.vue";
const store = mainStore();
const modules = ref([]);
function openModule(module) {
  if (module.link_url) window.open(module.link_url, "_blank", "noopener,noreferrer");
}
onMounted(async () => {
  try {
    const response = await fetch("/api/homepage", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    modules.value = Array.isArray(data.modules) ? data.modules : [];
  } catch (error) {
    console.warn("主页模块暂时无法加载。", error);
  }
});
</script>

<style lang="scss" scoped>
.right {
  width: 50%;
  margin-left: 0.75rem;
  .logo {
    width: 100%; font-family: "HarmonyOS_Regular", sans-serif; font-size: 2.1rem; font-weight: 600;
    position: fixed; top: 6%; left: 0; text-align: center; letter-spacing: 0.12em;
    transition: transform 0.3s; animation: fade 0.5s;
    &:active { transform: scale(0.95); }
    @media (min-width: 721px) { display: none; }
    @media (max-height: 720px) { width: calc(100% + 6px); top: 43.26px; }
    @media (max-width: 390px) { width: 391px; }
  }
  .homepage-modules { margin: 1.2rem 0.25rem 1.5rem; display: flex; flex-direction: column; gap: 12px; animation: fade 0.5s; }
  .module-section-title { font-size: 1.08rem; margin: 0 0 2px 4px; text-shadow: 0 0 5px #00000050; }
  .module-card { overflow: hidden; border: 1px solid #ffffff30; border-radius: 12px; background: linear-gradient(135deg,#ffffff16,#ffffff08); backdrop-filter: blur(10px); }
  .module-card.clickable { cursor: pointer; transition: transform .2s, background .2s; &:hover { transform: translateY(-2px); background: #ffffff20; } }
  .module-image { display: block; width: 100%; max-height: 190px; object-fit: cover; }
  .module-copy { padding: 15px 17px; }
  .module-subtitle { display: block; margin-bottom: 5px; font-size: 10px; letter-spacing: .16em; opacity: .58; }
  .module-copy strong { display: block; font-size: 1.08rem; font-weight: 600; }
  .module-icon { margin-right: 7px; }
  .module-copy p { margin: 8px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: .86rem; line-height: 1.7; opacity: .76; }
  .module-more { display: inline-block; margin-top: 10px; font-size: .85rem; opacity: .8; }
  @media (max-width: 720px) { margin-left: 0; width: 100%; &.hidden { display: none; } .homepage-modules { margin-top: 1rem; } }
}
</style>
