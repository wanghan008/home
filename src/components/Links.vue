<template>
  <div v-if="siteLinksList.length" class="links">
    <div class="line">
      <Icon size="20"><Link /></Icon>
      <span class="title">网站列表</span>
    </div>
    <Swiper
      :modules="[Pagination, Mousewheel]"
      :slides-per-view="1"
      :space-between="40"
      :pagination="{ el: '.swiper-pagination', clickable: true, bulletElement: 'div' }"
      :mousewheel="true"
    >
      <SwiperSlide v-for="(site, page) in siteLinksList" :key="page">
        <el-row class="link-all" :gutter="20">
          <el-col v-for="(item, index) in site" :span="8" :key="item.id || item.url || item.link || item.title">
            <div class="item cards" :style="index < 3 ? 'margin-bottom: 20px' : null" @click="jumpLink(item)">
              <Icon v-if="siteIcon[item.icon]" size="26"><component :is="siteIcon[item.icon]" /></Icon>
              <span v-else class="custom-icon">{{ item.icon || "↗" }}</span>
              <span class="name text-hidden">{{ item.name || item.title }}</span>
            </div>
          </el-col>
        </el-row>
      </SwiperSlide>
      <div class="swiper-pagination" />
    </Swiper>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Icon } from "@vicons/utils";
import { Link, Blog, CompactDisc, Cloud, Compass, Book, Fire, LaptopCode } from "@vicons/fa";
import { mainStore } from "@/store";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Mousewheel } from "swiper/modules";
import fallbackLinks from "@/assets/siteLinks.json";

const store = mainStore();
const links = ref(fallbackLinks);
const siteLinksList = computed(() => {
  const result = [];
  for (let i = 0; i < links.value.length; i += 6) result.push(links.value.slice(i, i + 6));
  return result;
});
const siteIcon = { Blog, Cloud, CompactDisc, Compass, Book, Fire, LaptopCode, Link };
const jumpLink = (data) => {
  const target = data.url || data.link;
  if (!target) return;
  if ((data.name || data.title) === "音乐" && store.musicClick) {
    if (typeof $openList === "function") $openList();
  } else {
    window.open(target, "_blank", "noopener,noreferrer");
  }
};
onMounted(async () => {
  try {
    const response = await fetch("/api/homepage", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.links) && data.links.length) {
      links.value = data.links.map(item => ({ ...item, name: item.title, link: item.url }));
    }
  } catch (error) {
    console.warn("主页链接暂时使用本地默认数据。", error);
  }
});
</script>

<style lang="scss" scoped>
.links {
  .line { margin: 2rem 0.25rem 1rem; font-size: 1.1rem; display: flex; align-items: center; animation: fade 0.5s;
    .title { margin-left: 8px; font-size: 1.15rem; text-shadow: 0 0 5px #00000050; }
  }
  .swiper { left: -10px; width: calc(100% + 20px); padding: 5px 10px 0; z-index: 0;
    .swiper-slide { height: 100%; }
    .swiper-pagination { margin-top: 12px; display: flex; flex-direction: row; align-items: center; justify-content: center;
      :deep(.swiper-pagination-bullet) { background-color: #fff; width: 20px; height: 4px; margin: 0 4px; border-radius: 4px; opacity: 0.2; transition: opacity 0.3s;
        &.swiper-pagination-bullet-active, &:hover { opacity: 1; }
      }
    }
  }
  .link-all { height: 220px;
    .item { height: 100px; width: 100%; display: flex; align-items: center; flex-direction: row; justify-content: center; padding: 0 10px; animation: fade 0.5s;
      &:hover { transform: scale(1.02); background: rgb(0 0 0 / 40%); transition: 0.3s; }
      &:active { transform: scale(1); }
      .name { font-size: 1.1rem; margin-left: 8px; }
      .custom-icon { font-size: 24px; line-height: 1; }
      @media (min-width: 720px) and (max-width: 820px) { .name { display: none; } }
      @media (max-width: 720px) { height: 80px; }
      @media (max-width: 460px) { flex-direction: column; .name { font-size: 1rem; margin-left: 0; margin-top: 8px; } }
    }
    @media (max-width: 720px) { height: 180px; }
  }
}
</style>
