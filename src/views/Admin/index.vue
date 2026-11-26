<template>
  <main class="admin-page">
    <header><a href="https://ta.whan.ipv64.de/">← 返回主页</a><a href="https://ta.whan.ipv64.de/blog" target="_blank">查看博客 ↗</a></header>
    <section class="panel">
      <template v-if="!authenticated">
        <p class="eyebrow">PRIVATE ADMIN</p><h1>管理员登录</h1><p class="hint">登录后可管理公开文章与草稿。</p>
        <form @submit.prevent="login"><input v-model="password" type="password" autocomplete="current-password" placeholder="管理员密码" required/><button :disabled="busy">登录</button></form>
      </template>
      <template v-else>
        <div class="heading"><div><p class="eyebrow">BLOG MANAGEMENT</p><h1>文章管理</h1></div><button class="subtle" @click="logout">退出</button></div>
        <form class="editor" @submit.prevent="save">
          <label>文章标题<input v-model="draft.title" maxlength="120" placeholder="给今天的心情起个标题" required/></label>
          <label>发布日期<input v-model="draft.mood_date" type="date" required/></label>
          <label>正文<textarea v-model="draft.content" maxlength="20000" rows="10" placeholder="写下今天的心情、想法或生活片段…" required/></label>
          <label class="check"><input v-model="draft.published" type="checkbox"/> 发布到公开博客（不勾选则保存为草稿）</label>
          <p class="save-hint">写完标题和正文后，点击下面的“保存文章”即可保存。勾选发布选项，访客才能在博客页面看到。</p>
          <div class="actions">
            <button class="save-button" type="submit" :disabled="busy">{{ busy ? "正在保存…" : (draft.id ? "保存修改" : "保存文章") }}</button>
            <button type="button" class="subtle" @click="reset">新建文章</button>
          </div>
        </form>
        <h2 class="list-title">文章列表</h2>
        <div v-if="!items.length" class="hint">还没有文章，写下第一篇吧。</div>
        <div v-for="item in items" :key="item.id" class="entry"><div><strong>{{ item.title }}</strong><small>{{ item.mood_date }} · {{ item.published ? "已发布" : "草稿" }}</small></div><div class="entry-actions"><button class="subtle" @click="edit(item)">编辑</button><button class="danger" @click="remove(item)">删除</button></div></div>
      </template>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
  </main>
</template>
<script setup>
import { ref, reactive, onMounted } from "vue";
const authenticated=ref(false), password=ref(""), busy=ref(false), items=ref([]), message=ref("");
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const blank=()=>({id:null,title:"",content:"",mood_date:localDate(),published:false});
const draft=reactive(blank());
async function api(path,options={}){const res=await fetch(path,{credentials:"same-origin",...options,headers:{"content-type":"application/json",...(options.headers||{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"请求失败");return data;}
async function load(){const data=await api("/api/admin/moods");items.value=data.items||[];}
async function login(){busy.value=true;message.value="";try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:password.value})});password.value="";authenticated.value=true;await load();}catch(e){message.value=e.message;}finally{busy.value=false;}}
async function logout(){try{await api("/api/admin/logout",{method:"POST"});}finally{authenticated.value=false;items.value=[];reset();}}
function reset(){Object.assign(draft,blank());}
function edit(item){Object.assign(draft,{...item,published:Boolean(item.published)});window.scrollTo({top:0,behavior:"smooth"});}
async function save(){busy.value=true;message.value="";try{const payload={title:draft.title,content:draft.content,mood_date:draft.mood_date,published:draft.published};await api(draft.id?"/api/admin/moods/"+draft.id:"/api/admin/moods",{method:draft.id?"PUT":"POST",body:JSON.stringify(payload)});message.value="保存成功";reset();await load();}catch(e){message.value="保存失败："+e.message;}finally{busy.value=false;}}
async function remove(item){if(!window.confirm("确定删除这篇文章吗？此操作不可恢复。"))return;try{await api("/api/admin/moods/"+item.id,{method:"DELETE"});if(draft.id===item.id)reset();await load();message.value="已删除";}catch(e){message.value=e.message;}}
onMounted(async()=>{try{await api("/api/admin/me");authenticated.value=true;await load();}catch(e){authenticated.value=false;}});
</script>
<style scoped>
.admin-page{min-height:100vh;overflow:auto;padding:30px 18px 60px;background:linear-gradient(145deg,#101722,#202b38);color:#eef2f7;font-family:inherit}header{max-width:850px;margin:0 auto 35px;display:flex;justify-content:space-between}a{color:#c4d4e8;text-decoration:none}.panel{max-width:850px;margin:auto;padding:clamp(22px,5vw,42px);border:1px solid #ffffff1c;border-radius:18px;background:#ffffff0b}.eyebrow{font-size:12px;letter-spacing:.2em;color:#91a7c1}.panel h1{font-size:32px;font-weight:500;margin:10px 0}.hint{color:#aab8c8;margin:10px 0 24px}.panel form{display:flex;flex-direction:column;gap:18px}.panel input:not([type=checkbox]),.panel textarea{width:100%;margin-top:8px;padding:13px 14px;border:1px solid #ffffff26;border-radius:9px;background:#0d1520;color:#fff;font:inherit;outline:none}.panel textarea{resize:vertical;line-height:1.7}.panel label{color:#cbd5e1}.panel button{border:0;border-radius:9px;padding:11px 20px;background:#d6e2f0;color:#182331;font:inherit;cursor:pointer}.panel button:disabled{opacity:.6}.subtle{background:#ffffff16!important;color:#dce6f2!important}.danger{background:#633c42!important;color:#fff!important}.check{display:flex;align-items:center;gap:9px}.save-hint{margin:0;color:#b8c8d9;font-size:14px;line-height:1.6}.actions,.entry-actions{display:flex;gap:10px;align-items:center}.panel .save-button{min-width:150px;padding:14px 28px;background:#e3edf8;color:#142233;font-weight:700;font-size:16px;box-shadow:0 4px 16px #0003}.list-title{font-size:20px;font-weight:500;margin:38px 0 15px}.entry{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 0;border-top:1px solid #ffffff18}.entry strong,.entry small{display:block}.entry small{margin-top:7px;color:#9cabbc}.message{margin-top:20px;color:#c4d4e8}@media(max-width:560px){.entry{align-items:flex-start;flex-direction:column}.entry-actions{width:100%}.actions{align-items:stretch;flex-direction:column}.actions button{width:100%}.panel .save-button{padding:15px}}
</style>
