<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      :style="imageStyle"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a
        v-if="store.backgroundShow && (appearance.backgroundUrl || store.coverType != '3')"
        class="down"
        :href="bgUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        下载壁纸
      </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const appearance = ref({
  theme: "classic",
  backgroundUrl: "",
  backgroundFit: "cover",
  backgroundBlur: 20,
  backgroundDim: 70,
});
const emit = defineEmits(["loadComplete"]);

// 壁纸随机数
const bgRandom = Math.floor(Math.random() * 10 + 1);

const changeBg = (type) => {
  if (appearance.value.backgroundUrl) return;
  if (type == 0) {
    bgUrl.value = `/images/background${bgRandom}.jpg`;
  } else if (type == 1) {
    bgUrl.value = "https://api.dujin.org/bing/1920.php";
  } else if (type == 2) {
    bgUrl.value = "https://api.vvhan.com/api/wallpaper/views";
  } else if (type == 3) {
    bgUrl.value = "https://api.vvhan.com/api/wallpaper/acg";
  }
};

const applyTheme = () => {
  document.documentElement.setAttribute("data-home-theme", appearance.value.theme || "classic");
};

const imageStyle = computed(() => ({
  objectFit: appearance.value.backgroundFit === "contain" ? "contain" : appearance.value.backgroundFit === "center" ? "none" : "cover",
  objectPosition: "center center",
  filter: `blur(${Number(appearance.value.backgroundBlur) || 0}px) brightness(${1 - (Number(appearance.value.backgroundDim) || 0) / 100})`,
}));

const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(() => {
    store.setImgLoadStatus(true);
  }, Math.floor(Math.random() * (600 - 300 + 1)) + 300);
};

const imgAnimationEnd = () => {
  emit("loadComplete");
};

const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  ElMessage({
    message: "壁纸加载失败，已临时切换回默认",
    icon: h(Error, { theme: "filled", fill: "#efefef" }),
  });
  appearance.value.backgroundUrl = "";
  changeBg(0);
};

watch(() => store.coverType, (value) => {
  if (!appearance.value.backgroundUrl) changeBg(value);
});

onMounted(async () => {
  try {
    const response = await fetch("/api/appearance", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      appearance.value = { ...appearance.value, ...(data.appearance || {}) };
    }
  } catch (error) {
    console.warn("主页外观设置暂时无法加载，使用默认设置。", error);
  }
  applyTheme();
  if (appearance.value.backgroundUrl) {
    bgUrl.value = appearance.value.backgroundUrl;
  } else {
    changeBg(store.coverType);
  }
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show { z-index: 1; }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    transition: filter 0.3s, transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }
  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);
    transition: 1.5s;
    &.hidden { opacity: 0; transition: 1.5s; }
  }
  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover { transform: scale(1.05); background-color: #00000060; }
    &:active { transform: scale(1); }
  }
}
</style>

<style lang="scss">
:root[data-home-theme="tech"] {
  --home-card-bg: linear-gradient(135deg, rgba(31, 91, 160, .42), rgba(91, 48, 150, .25));
  --home-card-border: rgba(102, 190, 255, .48);
  --home-card-text: #eef8ff;
  --home-link-bg: rgba(20, 66, 112, .48);
}
:root[data-home-theme="minimal"] {
  --home-card-bg: rgba(248, 251, 255, .88);
  --home-card-border: rgba(255, 255, 255, .8);
  --home-card-text: #1d2b3a;
  --home-link-bg: rgba(248, 251, 255, .82);
}
:root[data-home-theme="glass"] {
  --home-card-bg: rgba(255, 255, 255, .10);
  --home-card-border: rgba(255, 255, 255, .36);
  --home-card-text: #f5f8ff;
  --home-link-bg: rgba(255, 255, 255, .12);
}
:root[data-home-theme="nature"] {
  --home-card-bg: linear-gradient(135deg, rgba(38, 82, 55, .72), rgba(105, 112, 68, .48));
  --home-card-border: rgba(190, 218, 160, .48);
  --home-card-text: #f5f4df;
  --home-link-bg: rgba(50, 83, 57, .56);
}
:root[data-home-theme="classic"] {
  --home-card-bg: linear-gradient(135deg, #ffffff16, #ffffff08);
  --home-card-border: #ffffff30;
  --home-card-text: inherit;
  --home-link-bg: rgba(255, 255, 255, .08);
}
.homepage-modules .module-card {
  background: var(--home-card-bg, linear-gradient(135deg,#ffffff16,#ffffff08)) !important;
  border-color: var(--home-card-border, #ffffff30) !important;
  color: var(--home-card-text, inherit);
}
.links .link-all .item.cards {
  background: var(--home-link-bg, transparent);
  border: 1px solid var(--home-card-border, transparent);
  color: var(--home-card-text, inherit);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
:root[data-home-theme="minimal"] .homepage-modules .module-copy p,
:root[data-home-theme="minimal"] .homepage-modules .module-subtitle,
:root[data-home-theme="minimal"] .homepage-modules .module-more {
  color: #34475b;
}

:root[data-home-theme="ocean"] { --home-card-bg:linear-gradient(135deg,rgba(4,55,82,.82),rgba(12,111,137,.56));--home-card-border:rgba(104,213,226,.5);--home-card-text:#e9fbff;--home-link-bg:rgba(4,57,83,.72); }
:root[data-home-theme="sunset"] { --home-card-bg:linear-gradient(135deg,rgba(145,59,37,.78),rgba(201,120,55,.58));--home-card-border:rgba(255,196,137,.55);--home-card-text:#fff7ed;--home-link-bg:rgba(135,62,39,.72); }
:root[data-home-theme="sakura"] { --home-card-bg:rgba(255,239,245,.88);--home-card-border:rgba(255,255,255,.9);--home-card-text:#65394b;--home-link-bg:rgba(255,238,245,.88); }
:root[data-home-theme="cyberpunk"] { --home-card-bg:linear-gradient(135deg,rgba(28,12,52,.88),rgba(88,18,88,.72));--home-card-border:rgba(255,57,190,.7);--home-card-text:#fff0ff;--home-link-bg:rgba(28,12,52,.82); }
:root[data-home-theme="aurora"] { --home-card-bg:linear-gradient(135deg,rgba(13,91,87,.78),rgba(68,48,124,.65));--home-card-border:rgba(115,236,206,.58);--home-card-text:#effffb;--home-link-bg:rgba(18,76,91,.72); }
:root[data-home-theme="midnight"] { --home-card-bg:linear-gradient(135deg,rgba(15,17,22,.92),rgba(55,48,36,.82));--home-card-border:rgba(207,177,112,.55);--home-card-text:#f7edcf;--home-link-bg:rgba(17,18,22,.86); }
:root[data-home-theme="lavender"] { --home-card-bg:rgba(239,235,255,.86);--home-card-border:rgba(255,255,255,.9);--home-card-text:#40385d;--home-link-bg:rgba(235,230,255,.86); }
:root[data-home-theme="cream"] { --home-card-bg:rgba(250,241,224,.9);--home-card-border:rgba(255,255,255,.9);--home-card-text:#5d4937;--home-link-bg:rgba(248,237,218,.9); }
:root[data-home-theme="forest"] { --home-card-bg:linear-gradient(135deg,rgba(18,57,43,.88),rgba(63,93,59,.72));--home-card-border:rgba(171,204,139,.52);--home-card-text:#f1f7e9;--home-link-bg:rgba(19,58,43,.82); }
:root[data-home-theme="desert"] { --home-card-bg:linear-gradient(135deg,rgba(126,76,48,.82),rgba(184,132,79,.62));--home-card-border:rgba(245,207,157,.58);--home-card-text:#fff5e7;--home-link-bg:rgba(125,77,49,.78); }
:root[data-home-theme="mono"] { --home-card-bg:rgba(20,20,20,.86);--home-card-border:rgba(255,255,255,.7);--home-card-text:#fff;--home-link-bg:rgba(20,20,20,.84); }
:root[data-home-theme="retro"] { --home-card-bg:linear-gradient(135deg,rgba(73,48,34,.88),rgba(130,88,51,.7));--home-card-border:rgba(220,181,125,.55);--home-card-text:#fff0d5;--home-link-bg:rgba(78,51,35,.82); }
:root[data-home-theme="nordic"] { --home-card-bg:rgba(239,246,250,.9);--home-card-border:rgba(255,255,255,.95);--home-card-text:#344956;--home-link-bg:rgba(235,244,249,.88); }
:root[data-home-theme="rose"] { --home-card-bg:linear-gradient(135deg,rgba(75,25,43,.9),rgba(132,49,72,.76));--home-card-border:rgba(231,157,175,.56);--home-card-text:#fff0f3;--home-link-bg:rgba(77,27,45,.84); }
:root[data-home-theme="emerald"] { --home-card-bg:linear-gradient(135deg,rgba(4,66,55,.9),rgba(25,116,91,.72));--home-card-border:rgba(137,221,190,.56);--home-card-text:#eafff6;--home-link-bg:rgba(5,69,57,.84); }

:root[data-home-theme="sakura"] .homepage-modules .module-copy p,
:root[data-home-theme="sakura"] .homepage-modules .module-subtitle,
:root[data-home-theme="sakura"] .homepage-modules .module-more,
:root[data-home-theme="lavender"] .homepage-modules .module-copy p,
:root[data-home-theme="lavender"] .homepage-modules .module-subtitle,
:root[data-home-theme="lavender"] .homepage-modules .module-more,
:root[data-home-theme="cream"] .homepage-modules .module-copy p,
:root[data-home-theme="cream"] .homepage-modules .module-subtitle,
:root[data-home-theme="cream"] .homepage-modules .module-more,
:root[data-home-theme="nordic"] .homepage-modules .module-copy p,
:root[data-home-theme="nordic"] .homepage-modules .module-subtitle,
:root[data-home-theme="nordic"] .homepage-modules .module-more { color:var(--home-card-text); }

.preview-ocean .preview-content span { background:#07516dba; }
.preview-sunset .preview-content span { background:#9d4b30ba; }
.preview-sakura .preview-content { color:#65394b; }
.preview-sakura .preview-shade,.preview-lavender .preview-shade,.preview-cream .preview-shade,.preview-nordic .preview-shade { background:rgba(255,255,255,.28); }
.preview-cyberpunk .preview-content span { border-color:#ff55c7;background:#301044cc; }
.preview-aurora .preview-content span { background:#155e67bb; }
.preview-midnight .preview-content span { border-color:#c9ad70;background:#17191ecc; }
.preview-lavender .preview-content,.preview-cream .preview-content,.preview-nordic .preview-content { color:#354255; }
.preview-forest .preview-content span,.preview-emerald .preview-content span { background:#164d3cbb; }
.preview-desert .preview-content span,.preview-retro .preview-content span { background:#805331bb; }
.preview-mono .preview-content span { background:#111d; }
.preview-rose .preview-content span { background:#641f38cc; }

</style>