<template>
  <main class="admin-page">
    <header><a href="https://ta.whan.ipv64.de/">← 返回主页</a><a href="https://ta.whan.ipv64.de/blog" target="_blank">查看博客 ↗</a></header>
    <section class="panel">
      <template v-if="!authenticated">
        <p class="eyebrow">PRIVATE ADMIN</p><h1>管理后台</h1><p class="hint">登录后管理主页模块、网站链接和心情文章。</p>
        <form @submit.prevent="login"><input v-model="password" type="password" autocomplete="current-password" placeholder="管理员密码" required/><button :disabled="busy">登录</button></form>
      </template>
      <template v-else>
        <div class="heading"><div><p class="eyebrow">PERSONAL WEBSITE</p><h1>内容管理</h1></div><button class="subtle" @click="logout">退出</button></div>
        <nav class="tabs">
          <button v-for="tab in tabs" :key="tab.id" :class="{active:activeTab===tab.id}" @click="activeTab=tab.id">{{ tab.label }}</button>
        </nav>

        <section v-if="activeTab==='modules'" class="manager">
          <div class="section-heading"><div><h2>主页模块</h2><p class="hint">添加文字介绍、图片和可选跳转链接。</p></div><button @click="resetModule">＋ 添加模块</button></div>
          <form class="editor" @submit.prevent="saveModule">
            <label>模块标题<input v-model="moduleDraft.title" maxlength="100" placeholder="例如：我的开发项目" required/></label>
            <label>副标题<input v-model="moduleDraft.subtitle" maxlength="160" placeholder="可选，例如：PROJECTS & IDEAS"/></label>
            <label>文字介绍<textarea v-model="moduleDraft.description" maxlength="5000" rows="5" placeholder="介绍这个模块的内容，可以换行。"/></label>
            <label>图片网址<input v-model="moduleDraft.image_url" maxlength="1000" placeholder="https://example.com/image.jpg"/></label>
            <div v-if="moduleDraft.image_url" class="image-preview"><img :src="moduleDraft.image_url" alt="模块图片预览" @error="imageError=true" @load="imageError=false"/><span v-if="imageError">图片无法加载，请检查网址</span></div>
            <label>模块点击跳转网址<input v-model="moduleDraft.link_url" maxlength="1000" placeholder="可留空，也可填写 https://..."/></label>
            <div class="two-fields"><label>图标/表情<input v-model="moduleDraft.icon" maxlength="40" placeholder="例如：✦ 或 Blog"/></label><label>显示顺序<input v-model.number="moduleDraft.sort_order" type="number"/></label></div>
            <label class="check"><input v-model="moduleDraft.enabled" type="checkbox"/> 在主页显示</label>
            <div class="actions"><button class="save-button" type="submit" :disabled="busy">{{ busy ? "正在保存…" : (moduleDraft.id ? "保存模块修改" : "添加主页模块") }}</button><button type="button" class="subtle" @click="resetModule">清空</button></div>
          </form>
          <h3 class="list-title">已有模块</h3>
          <p v-if="!modules.length" class="hint">还没有模块，使用上方表单添加。</p>
          <div v-for="item in modules" :key="item.id" class="entry"><div><strong>{{ item.title }}</strong><small>{{ item.enabled ? "显示中" : "已隐藏" }} · 顺序 {{ item.sort_order }}</small></div><div class="entry-actions"><button class="subtle" @click="editModule(item)">编辑</button><button class="danger" @click="removeModule(item)">删除</button></div></div>
        </section>

        <section v-else-if="activeTab==='links'" class="manager">
          <div class="section-heading"><div><h2>网站链接</h2><p class="hint">管理主页上的游戏、博客和其他网站入口。</p></div><button @click="resetLink">＋ 添加链接</button></div>
          <form class="editor" @submit.prevent="saveLink">
            <label>链接名称<input v-model="linkDraft.title" maxlength="100" placeholder="例如：我的新项目" required/></label>
            <label>网址<input v-model="linkDraft.url" maxlength="1000" placeholder="https://example.com" required/></label>
            <label>简短说明<input v-model="linkDraft.description" maxlength="300" placeholder="可选"/></label>
            <label>所属模块<select v-model="linkDraft.module_id"><option value="">不归属模块</option><option v-for="m in modules" :key="m.id" :value="String(m.id)">{{ m.title }}</option></select></label>
            <div class="two-fields"><label>图标/表情<input v-model="linkDraft.icon" maxlength="40" placeholder="例如：🎮 或 Fire"/></label><label>显示顺序<input v-model.number="linkDraft.sort_order" type="number"/></label></div>
            <label class="check"><input v-model="linkDraft.enabled" type="checkbox"/> 在主页显示</label>
            <div class="actions"><button class="save-button" type="submit" :disabled="busy">{{ busy ? "正在保存…" : (linkDraft.id ? "保存链接修改" : "添加网站链接") }}</button><button type="button" class="subtle" @click="resetLink">清空</button></div>
          </form>
          <h3 class="list-title">已有链接</h3>
          <p v-if="!links.length" class="hint">还没有链接。</p>
          <div v-for="item in links" :key="item.id" class="entry"><div><strong>{{ item.icon }} {{ item.title }}</strong><small>{{ item.url }} · {{ item.enabled ? "显示中" : "已隐藏" }}</small></div><div class="entry-actions"><button class="subtle" @click="editLink(item)">编辑</button><button class="danger" @click="removeLink(item)">删除</button></div></div>
        </section>

        <section v-else class="manager">
          <h2>心情文章</h2><p class="hint">管理公开博客文章与草稿。</p>
          <form class="editor" @submit.prevent="save">
            <label>文章标题<input v-model="draft.title" maxlength="120" placeholder="给今天的心情起个标题" required/></label>
            <label>发布日期<input v-model="draft.mood_date" type="date" required/></label>
            <label>正文<textarea v-model="draft.content" maxlength="20000" rows="10" placeholder="写下今天的心情、想法或生活片段…" required/></label>
            <label class="check"><input v-model="draft.published" type="checkbox"/> 发布到公开博客（不勾选则保存为草稿）</label>
            <p class="save-hint">勾选发布选项，访客才能在博客页面看到文章。</p>
            <div class="actions"><button class="save-button" type="submit" :disabled="busy">{{ busy ? "正在保存…" : (draft.id ? "保存修改" : "保存文章") }}</button><button type="button" class="subtle" @click="reset">新建文章</button></div>
          </form>
          <h3 class="list-title">文章列表</h3>
          <div v-if="!items.length" class="hint">还没有文章，写下第一篇吧。</div>
          <div v-for="item in items" :key="item.id" class="entry"><div><strong>{{ item.title }}</strong><small>{{ item.mood_date }} · {{ item.published ? "已发布" : "草稿" }}</small></div><div class="entry-actions"><button class="subtle" @click="edit(item)">编辑</button><button class="danger" @click="remove(item)">删除</button></div></div>
        </section>
      </template>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
  </main>
</template>
<script setup>
import { ref, reactive, onMounted } from "vue";
const authenticated=ref(false), password=ref(""), busy=ref(false), items=ref([]), modules=ref([]), links=ref([]), message=ref(""), activeTab=ref("modules"), imageError=ref(false);
const tabs=[{id:"modules",label:"主页模块"},{id:"links",label:"网站链接"},{id:"moods",label:"心情文章"}];
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const blank=()=>({id:null,title:"",content:"",mood_date:localDate(),published:false});
const blankModule=()=>({id:null,title:"",subtitle:"",description:"",image_url:"",link_url:"",icon:"",sort_order:modules.value.length+1,enabled:true});
const blankLink=()=>({id:null,module_id:"",title:"",url:"",description:"",icon:"",sort_order:links.value.length+1,enabled:true});
const draft=reactive(blank()), moduleDraft=reactive(blankModule()), linkDraft=reactive(blankLink());
async function api(path,options={}){const res=await fetch(path,{credentials:"same-origin",...options,headers:{"content-type":"application/json",...(options.headers||{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"请求失败");return data;}
async function load(){const [a,b,c]=await Promise.all([api("/api/admin/moods"),api("/api/admin/homepage/modules"),api("/api/admin/homepage/links")]);items.value=a.items||[];modules.value=b.items||[];links.value=c.items||[];}
async function login(){busy.value=true;message.value="";try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:password.value})});password.value="";authenticated.value=true;await load();}catch(e){message.value=e.message;}finally{busy.value=false;}}
async function logout(){try{await api("/api/admin/logout",{method:"POST"});}finally{authenticated.value=false;items.value=[];modules.value=[];links.value=[];reset();resetModule();resetLink();}}
function reset(){Object.assign(draft,blank());}
function edit(item){Object.assign(draft,{...item,published:Boolean(item.published)});window.scrollTo({top:0,behavior:"smooth"});}
async function save(){busy.value=true;message.value="";try{const payload={title:draft.title,content:draft.content,mood_date:draft.mood_date,published:draft.published};await api(draft.id?"/api/admin/moods/"+draft.id:"/api/admin/moods",{method:draft.id?"PUT":"POST",body:JSON.stringify(payload)});message.value="文章保存成功";reset();await load();}catch(e){message.value="保存失败："+e.message;}finally{busy.value=false;}}
async function remove(item){if(!window.confirm("确定删除这篇文章吗？此操作不可恢复。"))return;try{await api("/api/admin/moods/"+item.id,{method:"DELETE"});if(draft.id===item.id)reset();await load();message.value="文章已删除";}catch(e){message.value=e.message;}}
function resetModule(){Object.assign(moduleDraft,blankModule());imageError.value=false;}
function editModule(item){Object.assign(moduleDraft,{...item,enabled:Boolean(item.enabled)});imageError.value=false;window.scrollTo({top:0,behavior:"smooth"});}
async function saveModule(){busy.value=true;message.value="";try{const p={...moduleDraft,enabled:moduleDraft.enabled?1:0};await api(moduleDraft.id?"/api/admin/homepage/modules/"+moduleDraft.id:"/api/admin/homepage/modules",{method:moduleDraft.id?"PUT":"POST",body:JSON.stringify(p)});message.value="主页模块保存成功";resetModule();await load();}catch(e){message.value="保存失败："+e.message;}finally{busy.value=false;}}
async function removeModule(item){if(!window.confirm("删除模块后，原来归属它的链接会保留并变为独立链接。确定删除？"))return;try{await api("/api/admin/homepage/modules/"+item.id,{method:"DELETE"});if(moduleDraft.id===item.id)resetModule();await load();message.value="模块已删除";}catch(e){message.value=e.message;}}
function resetLink(){Object.assign(linkDraft,blankLink());}
function editLink(item){Object.assign(linkDraft,{...item,module_id:item.module_id==null?"":String(item.module_id),enabled:Boolean(item.enabled)});window.scrollTo({top:0,behavior:"smooth"});}
async function saveLink(){busy.value=true;message.value="";try{const p={...linkDraft,module_id:linkDraft.module_id||null,enabled:linkDraft.enabled?1:0};await api(linkDraft.id?"/api/admin/homepage/links/"+linkDraft.id:"/api/admin/homepage/links",{method:linkDraft.id?"PUT":"POST",body:JSON.stringify(p)});message.value="网站链接保存成功";resetLink();await load();}catch(e){message.value="保存失败："+e.message;}finally{busy.value=false;}}
async function removeLink(item){if(!window.confirm("确定删除这个网站链接吗？"))return;try{await api("/api/admin/homepage/links/"+item.id,{method:"DELETE"});if(linkDraft.id===item.id)resetLink();await load();message.value="链接已删除";}catch(e){message.value=e.message;}}
onMounted(async()=>{try{await api("/api/admin/me");authenticated.value=true;await load();}catch(e){authenticated.value=false;}});
</script>
<style scoped>
.admin-page{min-height:100vh;min-height:100dvh;box-sizing:border-box;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;padding:30px 18px calc(60px + env(safe-area-inset-bottom));background:linear-gradient(145deg,#101722,#202b38);color:#eef2f7;font-family:inherit;-webkit-overflow-scrolling:touch}
header{max-width:900px;margin:0 auto 35px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
a{color:#c4d4e8;text-decoration:none}
.panel{max-width:900px;margin:auto;padding:clamp(18px,4vw,42px);border:1px solid #ffffff1c;border-radius:18px;background:#ffffff0b;min-width:0;box-sizing:border-box}
.eyebrow{font-size:12px;letter-spacing:.2em;color:#91a7c1}
.panel h1{font-size:32px;font-weight:500;margin:10px 0}
.panel h2{font-size:22px;font-weight:500;margin:0}
.hint{color:#aab8c8;margin:10px 0 24px}
.panel form{display:flex;flex-direction:column;gap:16px}
.panel input:not([type=checkbox]),.panel textarea,.panel select{width:100%;max-width:100%;box-sizing:border-box;margin-top:8px;padding:13px 14px;border:1px solid #ffffff26;border-radius:9px;background:#0d1520;color:#fff;font:inherit;outline:none}
.panel textarea{resize:vertical;line-height:1.7;min-height:120px}
.panel label{color:#cbd5e1}
.panel button{border:0;border-radius:9px;padding:11px 18px;background:#d6e2f0;color:#182331;font:inherit;cursor:pointer;touch-action:manipulation}
.panel button:disabled{opacity:.6}
.subtle{background:#ffffff16!important;color:#dce6f2!important}
.danger{background:#633c42!important;color:#fff!important}
.heading,.section-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}
.tabs{position:sticky;top:0;z-index:20;display:flex;gap:8px;flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;margin:22px 0 26px;padding:12px 0 14px;border-bottom:1px solid #ffffff20;background:#172331f2;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);scrollbar-width:thin}
.tabs button{flex:0 0 auto;white-space:nowrap;background:#ffffff12;color:#cbd5e1}
.tabs button.active{background:#dce8f5;color:#172536;font-weight:700}
.manager{min-width:0;scroll-margin-top:72px}
.section-heading{margin-bottom:20px}
.section-heading .hint{margin:6px 0 0}
.editor{padding:20px;border:1px solid #ffffff18;border-radius:12px;background:#ffffff08;min-width:0;overflow:visible}
.check{display:flex;align-items:center;gap:9px}
.save-hint{margin:0;color:#b8c8d9;font-size:14px;line-height:1.6}
.actions,.entry-actions{display:flex;gap:10px;align-items:center}
.actions{position:sticky;bottom:0;z-index:15;margin:0 -8px -8px;padding:14px 8px calc(14px + env(safe-area-inset-bottom));background:#172331f2;border-top:1px solid #ffffff20;border-radius:10px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.panel .save-button{min-width:150px;padding:14px 24px;background:#e3edf8;color:#142233;font-weight:700;font-size:16px;box-shadow:0 4px 16px #0003}
.list-title{font-size:19px;font-weight:500;margin:30px 0 12px}
.entry{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 0;border-top:1px solid #ffffff18}
.entry strong,.entry small{display:block;overflow-wrap:anywhere}
.entry small{margin-top:7px;color:#9cabbc}
.message{margin-top:20px;color:#c4d4e8;overflow-wrap:anywhere}
.two-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.image-preview{display:flex;align-items:center;gap:12px;color:#e3b9b9;font-size:13px;min-width:0;flex-wrap:wrap}
.image-preview img{width:150px;max-width:100%;max-height:100px;object-fit:cover;border-radius:8px;border:1px solid #ffffff25}
@media(max-width:560px){
.admin-page{padding:18px 10px calc(38px + env(safe-area-inset-bottom))}
header{margin-bottom:20px;padding:0 5px}
.panel{padding:16px 12px;border-radius:14px}
.panel h1{font-size:27px}
.heading{align-items:flex-start}
.entry{align-items:flex-start;flex-direction:column}
.entry-actions{width:100%}
.entry-actions button{flex:1}
.actions{align-items:stretch;flex-direction:column;bottom:0}
.actions button{width:100%;min-height:46px}
.panel .save-button{padding:15px}
.two-fields{grid-template-columns:1fr}
.section-heading{align-items:flex-start;flex-direction:column}
.tabs{margin-top:16px;gap:6px}
.tabs button{padding:10px 13px}
.editor{padding:14px 11px}
}
</style>
