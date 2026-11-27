<template>
  <main class="blog-page">
    <header><a href="/">← 返回主页</a><a href="/admin">管理文章</a></header>
    <section class="intro"><span>PERSONAL JOURNAL</span><h1>心情日记</h1><p>记录日常，也记录一路走来的想法。</p></section>
    <p v-if="loading" class="state">正在加载日记…</p>
    <p v-else-if="error" class="state">{{ error }}</p>
    <p v-else-if="!items.length" class="state">这里还没有公开文章，期待第一篇记录。</p>
    <article v-for="item in items" :key="item.id" class="post">
      <time>{{ item.mood_date }}</time><h2>{{ item.title }}</h2><div class="content" v-html="renderContent(item.content)"></div>
    </article>
    <footer>慢慢写，慢慢生活。</footer>
  </main>
</template>
<script setup>
import { ref, onMounted } from "vue";
const items = ref([]), loading = ref(true), error = ref("");
function renderContent(value){
  const escaped=String(value||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  return escaped.replace(/!\[([^\]]*)\]\(\/api\/images\/(\d+)\)/g,'<img src="/api/images/$2" alt="$1" loading="lazy">').replace(/\r?\n/g,"<br>");
}

onMounted(async () => {
  try { const res = await fetch("/api/moods"); const data = await res.json(); if (!res.ok) throw new Error(data.error || "加载失败"); items.value = data.items || []; }
  catch (e) { error.value = e.message || "暂时无法加载日记"; }
  finally { loading.value = false; }
});
</script>
<style scoped>
.blog-page{min-height:100vh;overflow:auto;padding:32px 22px 60px;background:linear-gradient(145deg,#101722,#202b38);color:#eef2f7;font-family:inherit}
header{max-width:760px;margin:auto;display:flex;justify-content:space-between}a{color:#c4d4e8;text-decoration:none}.intro{max-width:760px;margin:80px auto 52px}.intro span{font-size:12px;letter-spacing:.22em;color:#91a7c1}.intro h1{font-size:clamp(36px,8vw,58px);margin:14px 0;font-weight:500}.intro p,.state{color:#aab8c8}.post{max-width:760px;margin:0 auto 22px;padding:28px 30px;border:1px solid #ffffff18;border-radius:16px;background:#ffffff09}.post time{font-size:13px;color:#91a7c1}.post h2{font-size:22px;font-weight:500;margin:12px 0 18px}.content{white-space:normal;line-height:1.9;color:#d8e0e9;overflow-wrap:anywhere}.content :deep(img){display:block;max-width:100%;height:auto;max-height:560px;object-fit:contain;margin:16px auto;border-radius:12px;border:1px solid #ffffff20}.content :deep(br){display:block;content:"";margin-top:4px}.state{max-width:760px;margin:30px auto}footer{max-width:760px;margin:55px auto 0;text-align:center;color:#8292a5;font-size:13px}@media(max-width:600px){.blog-page{padding:24px 16px 44px}.intro{margin:62px auto 38px}.post{padding:22px 18px}}
</style>