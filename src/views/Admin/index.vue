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
        <p v-if="message" class="message message-top" role="status" aria-live="polite">{{ message }}</p>
        <nav class="tabs">
          <button v-for="tab in tabs" :key="tab.id" :class="{active:activeTab===tab.id}" @click="activeTab=tab.id">{{ tab.label }}</button>
        </nav>
        <input ref="uploadInput" class="hidden-file" type="file" accept="image/*" @change="uploadImage"/>
        <div class="top-actions">
          <button v-if="activeTab==='modules'" class="save-button" type="button" @click="saveModule" :disabled="busy">{{ busy ? "正在保存…" : (moduleDraft.id ? "保存模块修改" : "保存主页模块") }}</button>
          <button v-else-if="activeTab==='links'" class="save-button" type="button" @click="saveLink" :disabled="busy">{{ busy ? "正在保存…" : (linkDraft.id ? "保存链接修改" : "保存网站链接") }}</button>
          <button v-else-if="activeTab==='appearance'" class="save-button" type="button" @click="saveAppearance" :disabled="busy">{{ busy ? "正在保存…" : "保存外观设置" }}</button>
          <button v-else-if="activeTab==='moods'" class="save-button" type="button" @click="save" :disabled="busy">{{ busy ? "正在保存…" : (draft.id ? "保存文章修改" : "保存文章") }}</button>
        </div>

        <section v-if="activeTab==='modules'" class="manager">
          <div class="section-heading"><div><h2>主页模块</h2><p class="hint">添加文字介绍、图片和可选跳转链接。</p></div><button @click="resetModule">＋ 添加模块</button></div>
          <form id="module-form" class="editor" @submit.prevent="saveModule">
            <label>模块标题<input v-model="moduleDraft.title" maxlength="100" placeholder="例如：我的开发项目" required/></label>
            <label>副标题<input v-model="moduleDraft.subtitle" maxlength="160" placeholder="可选，例如：PROJECTS & IDEAS"/></label>
            <label>文字介绍<textarea v-model="moduleDraft.description" maxlength="5000" rows="5" placeholder="介绍这个模块的内容，可以换行。"/></label>
            <label>图片网址<input v-model="moduleDraft.image_url" maxlength="1000" placeholder="https://example.com/image.jpg"/></label>
            <button type="button" class="subtle picker-trigger" @click="openImagePicker('module')">从图片库选择图片</button>
            <div v-if="moduleDraft.image_url" class="image-preview"><img :src="moduleDraft.image_url" alt="模块图片预览" @error="imageError=true" @load="imageError=false"/><span v-if="imageError">图片无法加载，请检查网址</span></div>
            <label>模块点击跳转网址<input v-model="moduleDraft.link_url" maxlength="1000" placeholder="可留空，也可填写 https://..."/></label>
            <div class="two-fields"><label>图标/表情<input v-model="moduleDraft.icon" maxlength="40" placeholder="例如：✦ 或 Blog"/></label><label>显示顺序<input v-model.number="moduleDraft.sort_order" type="number"/></label></div>
            <label class="check"><input v-model="moduleDraft.enabled" type="checkbox"/> 在主页显示</label>
            <div class="actions"><button type="button" class="subtle" @click="resetModule">清空表单</button></div>
          </form>
          <h3 class="list-title">已有模块</h3>
          <p v-if="!modules.length" class="hint">还没有模块，使用上方表单添加。</p>
          <div v-for="item in modules" :key="item.id" class="entry"><div><strong>{{ item.title }}</strong><small>{{ item.enabled ? "显示中" : "已隐藏" }} · 顺序 {{ item.sort_order }}</small></div><div class="entry-actions"><button class="subtle" @click="editModule(item)">编辑</button><button class="danger" @click="removeModule(item)">删除</button></div></div>
        </section>

        <section v-else-if="activeTab==='links'" class="manager">
          <div class="section-heading"><div><h2>网站链接</h2><p class="hint">管理主页上的游戏、博客和其他网站入口。</p></div><button @click="resetLink">＋ 添加链接</button></div>
          <div v-if="linkDraft.id" class="edit-notice">正在编辑链接：{{ linkDraft.title || "未命名链接" }}<button type="button" class="subtle" @click="resetLink">取消编辑</button></div>
          <form id="link-form" class="editor" @submit.prevent="saveLink">
            <label>链接名称<input v-model="linkDraft.title" maxlength="100" placeholder="例如：我的新项目" required/></label>
            <label>网址<input v-model="linkDraft.url" maxlength="1000" placeholder="https://example.com" required/></label>
            <label>简短说明<input v-model="linkDraft.description" maxlength="300" placeholder="可选"/></label>
            <label>所属模块<select v-model="linkDraft.module_id"><option value="">不归属模块</option><option v-for="m in modules" :key="m.id" :value="String(m.id)">{{ m.title }}</option></select></label>
            <div class="two-fields"><label>图标/表情（可选）<input v-model="linkDraft.icon" maxlength="40" placeholder="留空自动获取网站图标；也可填 🎮 或 Fire"/></label><label>显示顺序<input v-model.number="linkDraft.sort_order" type="number"/></label></div>
            <p class="field-hint">图标栏留空时，主页会根据网址自动获取网站图标；也可以填写表情或内置图标名称来手动指定。</p>
            <button type="button" class="subtle picker-trigger" @click="openImagePicker('link')">从图片库选择链接图标</button>
            <div v-if="linkDraft.icon && linkDraft.icon.startsWith('/api/images/')" class="image-preview link-icon-preview"><img :src="linkDraft.icon" alt="网站链接图标预览"/><span>当前使用图片库中的自定义图标</span><button type="button" class="subtle" @click="linkDraft.icon=''">移除图片图标</button></div>
            <p class="field-hint">选择图片后会作为该网站链接的图标；留空则自动获取网站 Favicon。上传新图片请先在「图片库」上传，再回来选择。</p>
            <label class="check"><input v-model="linkDraft.enabled" type="checkbox"/> 在主页显示</label>
            <div class="actions"><button type="button" class="subtle" @click="resetLink">清空表单</button></div>
          </form>
          <h3 class="list-title">已有链接</h3>
          <p v-if="!links.length" class="hint">还没有链接。</p>
          <div v-for="item in links" :key="item.id" class="entry"><div><strong>{{ item.icon }} {{ item.title }}</strong><small>{{ item.url }} · {{ item.enabled ? "显示中" : "已隐藏" }}</small></div><div class="entry-actions"><button class="subtle" @click="editLink(item)">编辑</button><button class="danger" @click="removeLink(item)">删除</button></div></div>
        </section>

        
        <section v-else-if="activeTab==='appearance'" class="manager">
          <h2>主页外观设置</h2>
          <p class="hint">切换主页整体风格，并通过图片网址更换背景。保存后所有访客都会看到相同效果。</p>
          <div class="editor appearance-editor">
            <h3>选择风格</h3>
            <div class="theme-grid">
              <button v-for="theme in themes" :key="theme.id" type="button" :class="{selected:appearanceDraft.theme===theme.id}" @click="appearanceDraft.theme=theme.id">
                <span class="theme-dot" :class="'theme-'+theme.id"></span>
                <strong>{{ theme.label }}</strong>
                <small>{{ theme.description }}</small>
              </button>
            </div>
            <h3>默认背景图片</h3>
            <p class="field-hint">点击缩略图即可选用。图片来自 Unsplash，选择后也可以继续调整模糊度和暗度。</p>
            <div class="background-gallery">
              <button v-for="background in defaultBackgrounds" :key="background.id" type="button"
                :class="{selected:appearanceDraft.backgroundUrl===background.url}"
                @click="selectBackground(background)">
                <img :src="background.url" :alt="background.label" loading="lazy"/>
                <span>{{ background.label }}</span>
                <small v-if="appearanceDraft.backgroundUrl===background.url">✓ 当前选择</small>
              </button>
            </div>
            <label>背景图片网址<input v-model.trim="appearanceDraft.backgroundUrl" type="url" maxlength="1000" placeholder="https://example.com/background.jpg"/></label>
            <p class="field-hint">留空则使用原主页的壁纸轮换。请填写可以直接打开图片的 http/https 图片地址。</p>
            <label>背景显示方式
              <select v-model="appearanceDraft.backgroundFit">
                <option value="cover">铺满屏幕（推荐）</option>
                <option value="contain">完整显示图片</option>
                <option value="center">原尺寸居中</option>
              </select>
            </label>
            <label>背景模糊度：{{ appearanceDraft.backgroundBlur }} px
              <input v-model.number="appearanceDraft.backgroundBlur" type="range" min="0" max="30" step="1"/>
            </label>
            <label>背景暗度：{{ appearanceDraft.backgroundDim }}%
              <input v-model.number="appearanceDraft.backgroundDim" type="range" min="0" max="90" step="1"/>
            </label>
            <h3>效果预览</h3>
            <div class="appearance-preview" :class="'preview-'+appearanceDraft.theme">
              <div class="preview-image" :style="appearancePreviewStyle"></div>
              <div class="preview-shade"></div>
              <div class="preview-content"><strong>个人主页</strong><span>主页内容 · 网站链接</span><small>这是当前外观的预览效果</small></div>
            </div>
            <p class="field-hint">预览仅用于查看大致背景和配色，保存后会应用到完整主页。</p>
            <div class="actions"><button type="button" class="subtle" @click="resetAppearance">恢复默认外观</button></div>
          </div>
        </section>
        <section v-else-if="activeTab==='moods'" class="manager">
          <h2>心情文章</h2><p class="hint">管理公开博客文章与草稿。</p>
          <form id="mood-form" class="editor" @submit.prevent="save">
            <label>文章标题<input v-model="draft.title" maxlength="120" placeholder="给今天的心情起个标题" required/></label>
            <label>发布日期<input v-model="draft.mood_date" type="date" required/></label>
            <label>正文<textarea v-model="draft.content" maxlength="20000" rows="10" placeholder="写下今天的心情、想法或生活片段…" required/></label>
            <button type="button" class="subtle picker-trigger" @click="openImagePicker('mood')">从图片库插入图片</button>
            <p class="field-hint">选择图片后会在正文中插入图片标记，发布后博客页面会显示图片。</p>
            <p class="save-hint">文章保存后自动公开发布，访客可在博客页面查看。</p>
            <div class="actions"><button type="button" class="subtle" @click="reset">新建文章</button></div>
          </form>
          <h3 class="list-title">文章列表</h3>
          <div v-if="!items.length" class="hint">还没有文章，写下第一篇吧。</div>
          <div v-for="item in items" :key="item.id" class="entry"><div><strong>{{ item.title }}</strong><small>{{ item.mood_date }} · {{ item.published ? "已发布" : "草稿" }}</small></div><div class="entry-actions"><button class="subtle" @click="edit(item)">编辑</button><button class="danger" @click="remove(item)">删除</button></div></div>
        </section>
        <section v-else-if="activeTab==='images'" class="manager">
          <div class="section-heading"><div><h2>图片库</h2><p class="hint">图片上传后可在主页模块和心情日志中重复使用。</p></div><button type="button" @click="uploadInput?.click()" :disabled="uploading">{{ uploading ? "正在压缩上传…" : "＋ 上传图片" }}</button></div>
          <p class="field-hint">原始图片超过 20 MB 会提示并拒绝处理。可选择 JPG、PNG、WebP、GIF、AVIF、BMP、SVG 等图片；HEIC/HEIF、TIFF 等格式能否上传取决于当前浏览器是否支持解码。上传时自动转换为 WebP（若浏览器不支持 WebP 编码则使用实际生成的 PNG/JPG），压缩后单张不超过 200 KB，最多 20 张，总容量不超过 4 MB。图片保存在现有 D1 数据库，不使用 R2。</p>
          <p class="save-hint">当前：{{ images.length }} / 20 张 · {{ formatBytes(imageTotalBytes) }} / 4 MB</p>
          <div v-if="!images.length" class="empty-images">图片库还是空的，点击「上传图片」添加第一张。</div>
          <div v-else class="uploaded-gallery">
            <div v-for="item in images" :key="item.id" class="uploaded-image">
              <img :src="'/api/images/'+item.id" :alt="item.name" loading="lazy"/>
              <strong>{{ item.name }}</strong>
              <small>{{ formatBytes(item.size_bytes) }} · {{ item.mime_type }}</small>
              <button type="button" class="danger" @click="removeImage(item)">删除图片</button>
            </div>
          </div>
        </section>
        <div v-if="imagePickerOpen" class="image-picker-backdrop" @click.self="closeImagePicker">
          <section class="image-picker" role="dialog" aria-modal="true" aria-label="选择图片">
            <div class="section-heading"><div><h2>选择图片</h2><p class="hint">选择一张已上传的图片，也可以直接上传新图片</p></div><div class="entry-actions"><button type="button" @click="uploadInput?.click()" :disabled="uploading">{{ uploading ? "正在上传…" : "＋ 上传图片" }}</button><button type="button" class="subtle" @click="closeImagePicker">关闭</button></div></div>
            <p v-if="!images.length" class="hint">图片库为空，请先进入「图片库」上传图片。</p>
            <div v-else class="uploaded-gallery picker-gallery">
              <button v-for="item in images" :key="item.id" type="button" class="uploaded-image picker-image" @click="selectImage(item)">
                <img :src="'/api/images/'+item.id" :alt="item.name" loading="lazy"/>
                <strong>{{ item.name }}</strong><small>{{ formatBytes(item.size_bytes) }}</small>
                <span>选择这张图片</span>
              </button>
            </div>
          </section>
        </div>
      </template>
    </section>
  </main>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from "vue";
const authenticated=ref(false), password=ref(""), busy=ref(false), items=ref([]), modules=ref([]), links=ref([]), message=ref(""), activeTab=ref("modules"), imageError=ref(false);
const images=ref([]), imageTotalBytes=ref(0), uploading=ref(false), uploadInput=ref(null), imagePickerOpen=ref(false), imagePickerTarget=ref("");
const tabs=[{id:"modules",label:"主页模块"},{id:"links",label:"网站链接"},{id:"appearance",label:"主页外观"},{id:"moods",label:"心情文章"},{id:"images",label:"图片库"}];
const themes=[
  {id:"classic",label:"经典原版风",description:"保留当前主页视觉"},
  {id:"tech",label:"科技未来风",description:"蓝紫渐变与科技光感"},
  {id:"minimal",label:"简约清爽风",description:"明亮、干净、轻量"},
  {id:"glass",label:"深色玻璃风",description:"半透明玻璃质感"},
  {id:"nature",label:"自然舒适风",description:"绿色与大地色调"},
  {id:"ocean",label:"深海蓝调风",description:"海军蓝、青蓝与水下氛围"},
  {id:"sunset",label:"落日暖橙风",description:"橘红、金色与黄昏渐变"},
  {id:"sakura",label:"樱花粉色风",description:"柔粉、奶白与温柔氛围"},
  {id:"cyberpunk",label:"赛博霓虹风",description:"黑紫底色与荧光粉青"},
  {id:"aurora",label:"极光幻彩风",description:"青绿、蓝紫的极光色彩"},
  {id:"midnight",label:"午夜黑金风",description:"深黑底色与香槟金点缀"},
  {id:"lavender",label:"薰衣草紫风",description:"淡紫、雾蓝与柔和层次"},
  {id:"cream",label:"奶油米白风",description:"奶油白、浅咖与温暖质感"},
  {id:"forest",label:"森林秘境风",description:"墨绿、苔藓绿与自然气息"},
  {id:"desert",label:"沙漠暖沙风",description:"沙色、陶土与日光质感"},
  {id:"mono",label:"黑白极简风",description:"纯粹黑白与清晰对比"},
  {id:"retro",label:"复古胶片风",description:"棕褐、旧金与怀旧色调"},
  {id:"nordic",label:"北欧浅灰风",description:"雾灰、冰蓝与克制留白"},
  {id:"rose",label:"玫瑰酒红风",description:"酒红、玫瑰与优雅质感"},
  {id:"emerald",label:"翡翠绿风",description:"深翡翠与清透金属感"},
];
const defaultBackgrounds=[
  {id:"mountain",label:"雪山晨光",url:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85"},
  {id:"lake",label:"湖畔群山",url:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85"},
  {id:"ocean",label:"蔚蓝海岸",url:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85"},
  {id:"waves",label:"海浪与海面",url:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1800&q=85"},
  {id:"sunrise",label:"日出云海",url:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1800&q=85"},
  {id:"forest",label:"森林秘境",url:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=85"},
  {id:"night-sky",label:"星空雪山",url:"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=85"},
  {id:"galaxy",label:"梦幻星空",url:"https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1800&q=85"},
  {id:"flowers",label:"春日花园",url:"https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1800&q=85"},
  {id:"green-hills",label:"绿色山谷",url:"https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1800&q=85"},
  {id:"desert",label:"金色沙漠",url:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85"},
  {id:"night",label:"蓝调夜色",url:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85"},
  {id:"alpine",label:"高山湖泊",url:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=85"},
  {id:"plant",label:"清新绿植",url:"https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1800&q=85"},
];
function selectBackground(background){appearanceDraft.backgroundUrl=background.url;}
const defaultAppearance=()=>({theme:"classic",backgroundUrl:"",backgroundFit:"cover",backgroundBlur:20,backgroundDim:70});
const appearanceDraft=reactive(defaultAppearance());
const appearancePreviewStyle=computed(()=>({
  backgroundImage: appearanceDraft.backgroundUrl ? `url("${appearanceDraft.backgroundUrl.replaceAll('"','%22')}")` : "linear-gradient(135deg,#26384d,#101722)",
  backgroundSize: appearanceDraft.backgroundFit==="contain" ? "contain" : appearanceDraft.backgroundFit==="center" ? "auto" : "cover",
  backgroundPosition:"center",
  backgroundRepeat:"no-repeat",
  filter:`blur(${Number(appearanceDraft.backgroundBlur)||0}px) brightness(${1-(Number(appearanceDraft.backgroundDim)||0)/100})`,
}));
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const blank=()=>({id:null,title:"",content:"",mood_date:localDate(),published:true});
const blankModule=()=>({id:null,title:"",subtitle:"",description:"",image_url:"",link_url:"",icon:"",sort_order:modules.value.length+1,enabled:true});
const blankLink=()=>({id:null,module_id:"",title:"",url:"",description:"",icon:"",sort_order:links.value.length+1,enabled:true});
const draft=reactive(blank()), moduleDraft=reactive(blankModule()), linkDraft=reactive(blankLink());
async function api(path,options={}){const res=await fetch(path,{credentials:"same-origin",...options,headers:{"content-type":"application/json",...(options.headers||{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"请求失败");return data;}
function imageFormat(file){
  const known={"image/jpeg":"JPEG","image/png":"PNG","image/webp":"WebP","image/gif":"GIF","image/avif":"AVIF","image/heic":"HEIC","image/heif":"HEIF","image/bmp":"BMP","image/tiff":"TIFF","image/svg+xml":"SVG"};
  const ext=(file.name||"").split(".").pop()?.toUpperCase();
  return known[file.type] || (file.type ? file.type : (ext ? ext+"（根据扩展名判断）" : "未知格式"));
}
async function loadImageSource(file){
  if(typeof createImageBitmap==="function"){
    try{return await createImageBitmap(file);}catch{}
  }
  const objectUrl=URL.createObjectURL(file);
  try{
    const image=await new Promise((resolve,reject)=>{
      const element=new Image();
      element.onload=()=>resolve(element);
      element.onerror=()=>reject(new Error("浏览器无法解码该原图。"));
      element.src=objectUrl;
    });
    image.close=()=>URL.revokeObjectURL(objectUrl);
    return image;
  }catch(error){URL.revokeObjectURL(objectUrl);throw error;}
}
async function uploadImage(event){
  const input=event.target, file=input.files?.[0];
  if(!file)return;
  const originalFormat=imageFormat(file);
  const maxOriginalSize=20*1024*1024;
  if(file.size>maxOriginalSize){
    message.value=`✕ 原图过大：${file.name}；识别格式：${originalFormat}；大小：${formatBytes(file.size)}。限制为单张原图不超过 20 MB。`;
    input.value="";
    return;
  }
  uploading.value=true;message.value=`正在读取并转换：${file.name}（原图格式：${originalFormat}）…`;
  let bitmap=null;
  try{
    try{bitmap=await loadImageSource(file);}
    catch{throw new Error(`无法读取原图“${file.name}”。浏览器识别格式：${originalFormat}。这通常表示当前浏览器不支持解码该格式（常见于部分 HEIC/HEIF、TIFF 图片）。请先转换为 JPG、PNG 或 WebP 后重试。`);}
    const canvas=document.createElement("canvas");
    let width=bitmap.width,height=bitmap.height;
    if(!width||!height)throw new Error(`原图尺寸无效；原图格式：${originalFormat}。`);
    const scale=Math.min(1,1600/Math.max(width,height));
    width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext("2d");
    if(!context)throw new Error("浏览器无法创建图片压缩画布。");
    context.drawImage(bitmap,0,0,width,height);
    let blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.82));
    if(!blob)throw new Error(`浏览器无法编码压缩图片；原图格式：${originalFormat}。`);
    for(let attempt=0;blob.size>200*1024&&attempt<8;attempt++){
      width=Math.max(1,Math.round(width*0.85));height=Math.max(1,Math.round(height*0.85));
      canvas.width=width;canvas.height=height;context.clearRect(0,0,width,height);context.drawImage(bitmap,0,0,width,height);
      blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",Math.max(0.5,0.78-attempt*0.04)));
      if(!blob)throw new Error(`图片压缩失败；原图格式：${originalFormat}。`);
    }
    bitmap.close?.();bitmap=null;
    const outputType=blob.type;
    const outputExtensions={"image/webp":"webp","image/png":"png","image/jpeg":"jpg"};
    const outputExtension=outputExtensions[outputType];
    if(!outputExtension)throw new Error(`格式转换结果异常：原图为 ${originalFormat}，浏览器实际输出为“${outputType||"未知"}”。仅接受转换后的 WebP、PNG 或 JPEG。`);
    if(blob.size>200*1024)throw new Error(`压缩后仍超过 200 KB（${formatBytes(blob.size)}）；原图格式：${originalFormat}，转换格式：${outputType}。请换一张尺寸较小的图片。`);
    const form=new FormData();
    const baseName=(file.name||"image").replace(/\.[^.]+$/,"").slice(0,80)||"image";
    const imageName=baseName+"."+outputExtension;
    form.append("image",new File([blob],imageName,{type:outputType}));
    const response=await fetch("/api/admin/images",{method:"POST",credentials:"same-origin",body:form});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(`服务器拒绝保存：原图格式 ${originalFormat}，转换后格式 ${outputType}；${result.error||"未知服务器错误"}`);
    await loadImages();message.value=`✓ 上传成功：${file.name}（${originalFormat}）→ ${outputType}，已压缩为 ${formatBytes(blob.size)}。`;
  }catch(e){message.value="✕ 图片上传失败："+(e.message||"请重试");}
  finally{bitmap?.close?.();uploading.value=false;input.value="";}
}
async function loadImages(){
  const result=await api("/api/admin/images");images.value=result.items||[];imageTotalBytes.value=Number(result.totalBytes||0);
}
function formatBytes(value){const n=Number(value)||0;return n<1024?n+" B":(n/1024).toFixed(1)+" KB";}
async function removeImage(item){
  if(!window.confirm("删除这张图片后，引用它的主页模块或文章中的图片也会无法显示。确定删除？"))return;
  try{await api("/api/admin/images/"+item.id,{method:"DELETE"});await loadImages();message.value="图片已删除";}catch(e){message.value="删除失败："+e.message;}
}
function openImagePicker(target){imagePickerTarget.value=target;imagePickerOpen.value=true;loadImages().catch(e=>message.value=e.message);}
function closeImagePicker(){imagePickerOpen.value=false;imagePickerTarget.value="";}
function selectImage(item){
  if(imagePickerTarget.value==="module")moduleDraft.image_url="/api/images/"+item.id;
  else if(imagePickerTarget.value==="mood")draft.content+=(draft.content?"\n\n":"")+"![图片](/api/images/"+item.id+")";
  else if(imagePickerTarget.value==="link")linkDraft.icon="/api/images/"+item.id;
  closeImagePicker();
  message.value="已插入图片："+item.name;
}

async function load(){const [a,b,c,d,e]=await Promise.all([api("/api/admin/moods"),api("/api/admin/homepage/modules"),api("/api/admin/homepage/links"),api("/api/admin/appearance"),api("/api/admin/images")]);items.value=a.items||[];modules.value=b.items||[];links.value=c.items||[];images.value=e.items||[];imageTotalBytes.value=Number(e.totalBytes||0);Object.assign(appearanceDraft,defaultAppearance(),d.appearance||{});}
async function login(){busy.value=true;message.value="";try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:password.value})});password.value="";authenticated.value=true;await load();}catch(e){message.value=e.message;}finally{busy.value=false;}}
async function logout(){try{await api("/api/admin/logout",{method:"POST"});}finally{authenticated.value=false;items.value=[];modules.value=[];links.value=[];reset();resetModule();resetLink();}}
function reset(){Object.assign(draft,blank());}
function resetAppearance(){Object.assign(appearanceDraft,defaultAppearance());}
async function saveAppearance(){
  busy.value=true;message.value="正在保存主页外观…";
  try{
    const payload={...appearanceDraft,backgroundBlur:Number(appearanceDraft.backgroundBlur),backgroundDim:Number(appearanceDraft.backgroundDim)};
    const result=await api("/api/admin/appearance",{method:"PUT",body:JSON.stringify(payload)});
    Object.assign(appearanceDraft,result.appearance||payload);
    message.value="✓ 主页外观保存成功，刷新主页即可查看";
  }catch(e){message.value="✕ 外观保存失败："+e.message;}
  finally{busy.value=false;}
}
function edit(item){Object.assign(draft,{...item,published:Boolean(item.published)});window.scrollTo({top:0,behavior:"smooth"});}
async function save(){busy.value=true;message.value="正在保存文章…";try{const payload={title:draft.title,content:draft.content,mood_date:draft.mood_date,published:true};await api(draft.id?"/api/admin/moods/"+draft.id:"/api/admin/moods",{method:draft.id?"PUT":"POST",body:JSON.stringify(payload)});message.value="✓ 文章保存成功";reset();try{await load();}catch(e){message.value="✓ 文章已保存，但列表刷新失败："+e.message;}}catch(e){message.value="✕ 保存失败："+e.message;}finally{busy.value=false;}}
async function remove(item){if(!window.confirm("确定删除这篇文章吗？此操作不可恢复。"))return;try{await api("/api/admin/moods/"+item.id,{method:"DELETE"});if(draft.id===item.id)reset();await load();message.value="文章已删除";}catch(e){message.value=e.message;}}
function resetModule(){Object.assign(moduleDraft,blankModule());imageError.value=false;}
function editModule(item){Object.assign(moduleDraft,{...item,enabled:Boolean(item.enabled)});imageError.value=false;window.scrollTo({top:0,behavior:"smooth"});}
async function saveModule(){busy.value=true;message.value="正在保存主页模块…";try{const p={...moduleDraft,enabled:moduleDraft.enabled?1:0};await api(moduleDraft.id?"/api/admin/homepage/modules/"+moduleDraft.id:"/api/admin/homepage/modules",{method:moduleDraft.id?"PUT":"POST",body:JSON.stringify(p)});message.value="✓ 主页模块保存成功";resetModule();try{await load();}catch(e){message.value="✓ 主页模块已保存，但列表刷新失败："+e.message;}}catch(e){message.value="✕ 保存失败："+e.message;}finally{busy.value=false;}}
async function removeModule(item){if(!window.confirm("删除模块后，原来归属它的链接会保留并变为独立链接。确定删除？"))return;try{await api("/api/admin/homepage/modules/"+item.id,{method:"DELETE"});if(moduleDraft.id===item.id)resetModule();await load();message.value="模块已删除";}catch(e){message.value=e.message;}}
function resetLink(){Object.assign(linkDraft,blankLink());}
function editLink(item){Object.assign(linkDraft,{...item,module_id:item.module_id==null?"":String(item.module_id),enabled:Boolean(item.enabled)});document.getElementById("link-form")?.scrollIntoView({behavior:"smooth",block:"start"});}
async function saveLink(){busy.value=true;message.value="正在保存网站链接…";try{const p={...linkDraft,module_id:linkDraft.module_id||null,enabled:linkDraft.enabled?1:0};await api(linkDraft.id?"/api/admin/homepage/links/"+linkDraft.id:"/api/admin/homepage/links",{method:linkDraft.id?"PUT":"POST",body:JSON.stringify(p)});message.value="✓ 网站链接保存成功";resetLink();try{await load();}catch(e){message.value="✓ 网站链接已保存，但列表刷新失败："+e.message;}}catch(e){message.value="✕ 保存失败："+e.message;}finally{busy.value=false;}}
async function removeLink(item){if(!window.confirm("确定删除这个网站链接吗？"))return;try{await api("/api/admin/homepage/links/"+item.id,{method:"DELETE"});if(linkDraft.id===item.id)resetLink();await load();message.value="链接已删除";}catch(e){message.value=e.message;}}
onMounted(async()=>{try{await api("/api/admin/me");authenticated.value=true;await load();}catch(e){authenticated.value=false;}});
</script>
<style scoped>
.admin-page{position:fixed;inset:0;width:100%;height:100vh;height:100dvh;min-height:0;box-sizing:border-box;overflow-y:scroll;overflow-x:hidden;overscroll-behavior-y:contain;touch-action:pan-y pinch-zoom; -webkit-overflow-scrolling:touch;padding:30px 18px calc(60px + env(safe-area-inset-bottom));background:linear-gradient(145deg,#101722,#202b38);color:#eef2f7;font-family:inherit}
header{max-width:900px;margin:0 auto 35px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
a{color:#c4d4e8;text-decoration:none}
.panel{max-width:900px;margin:auto;padding:clamp(18px,4vw,42px);border:1px solid #ffffff1c;border-radius:18px;background:#ffffff0b;min-width:0;box-sizing:border-box}
.eyebrow{font-size:12px;letter-spacing:.2em;color:#91a7c1}
.panel h1{font-size:32px;font-weight:500;margin:10px 0}
.panel h2{font-size:22px;font-weight:500;margin:0}
.hint{color:#aab8c8;margin:10px 0 24px}
.panel form{display:flex;flex-direction:column;gap:16px}
.panel input:not([type=checkbox]):not([type=range]),.panel textarea,.panel select{width:100%;max-width:100%;box-sizing:border-box;margin-top:8px;padding:13px 14px;border:1px solid #ffffff26;border-radius:9px;background:#0d1520;color:#fff;font:inherit;outline:none}
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
.top-actions{position:sticky;top:58px;z-index:19;display:flex;justify-content:flex-end;padding:10px 0 14px;background:#172331f2;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #ffffff20}
.top-actions .save-button{min-width:190px;padding:13px 22px;background:#e3edf8;color:#142233;font-weight:700;font-size:16px;box-shadow:0 4px 16px #0003}
.manager{min-width:0;scroll-margin-top:125px}
.section-heading{margin-bottom:20px}
.section-heading .hint{margin:6px 0 0}
.editor{padding:20px;border:1px solid #ffffff18;border-radius:12px;background:#ffffff08;min-width:0;overflow:visible;scroll-margin-top:145px}
.edit-notice{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 12px;padding:12px 14px;border:1px solid #9db8d655;border-radius:10px;background:#8aa6c21a;color:#e3edf8;flex-wrap:wrap}
.check{display:flex;align-items:center;gap:9px}
.save-hint{margin:0;color:#b8c8d9;font-size:14px;line-height:1.6}
.actions,.entry-actions{display:flex;gap:10px;align-items:center}
.actions{display:flex;justify-content:flex-end;margin:0 -8px -8px;padding:14px 8px;border-top:1px solid #ffffff20;border-radius:10px}
.panel .save-button{min-width:150px;padding:14px 24px;background:#e3edf8;color:#142233;font-weight:700;font-size:16px;box-shadow:0 4px 16px #0003}
.list-title{font-size:19px;font-weight:500;margin:30px 0 12px}
.entry{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 0;border-top:1px solid #ffffff18}
.entry strong,.entry small{display:block;overflow-wrap:anywhere}
.entry small{margin-top:7px;color:#9cabbc}
.message{margin-top:20px;color:#c4d4e8;overflow-wrap:anywhere}
.message-top{position:sticky;top:0;z-index:18;margin:0;padding:12px 14px;border:1px solid #ffffff24;border-radius:10px;background:#243447f5;box-shadow:0 4px 16px #0003;font-weight:600;line-height:1.5}
.two-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.image-preview{display:flex;align-items:center;gap:12px;color:#e3b9b9;font-size:13px;min-width:0;flex-wrap:wrap}
.image-preview img{width:150px;max-width:100%;max-height:100px;object-fit:cover;border-radius:8px;border:1px solid #ffffff25}
.hidden-file{display:none}
.picker-trigger{align-self:flex-start}
.empty-images{padding:28px 16px;border:1px dashed #ffffff35;border-radius:12px;color:#aab8c8;text-align:center}
.uploaded-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
.uploaded-image{display:flex;min-width:0;flex-direction:column;gap:7px;padding:9px;border:1px solid #ffffff20;border-radius:10px;background:#ffffff09;color:#e6edf5}
.uploaded-image img{width:100%;height:130px;object-fit:cover;border-radius:7px;background:#101722}
.uploaded-image strong,.uploaded-image small{overflow-wrap:anywhere}
.uploaded-image strong{font-size:13px}
.uploaded-image small{font-size:11px;color:#9eafc2}
.uploaded-image button{margin-top:auto}
.image-picker-backdrop{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:18px;background:#050a10c9;backdrop-filter:blur(8px)}
.image-picker{width:min(760px,100%);max-height:min(82vh,760px);overflow:auto;padding:20px;border:1px solid #ffffff30;border-radius:16px;background:#172331;color:#eef2f7;box-shadow:0 20px 70px #0009}
.picker-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}
.picker-image{width:100%;text-align:left;cursor:pointer}
.picker-image span{font-size:12px;color:#b8d4f3}

.appearance-editor{display:flex;flex-direction:column;gap:16px}
.appearance-editor h3{font-size:17px;font-weight:600;margin:8px 0 0}
.field-hint{margin:-8px 0 4px;color:#9eafc2;font-size:13px;line-height:1.6}
.theme-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.theme-grid button{display:grid;grid-template-columns:24px 1fr;grid-template-rows:auto auto;align-items:center;text-align:left;gap:3px 9px;padding:13px;background:#ffffff0b;color:#e6edf5;border:1px solid #ffffff20}
.theme-grid button.selected{border-color:#a9c9ee;background:#8baed32b;box-shadow:0 0 0 1px #a9c9ee55}
.theme-grid button strong{font-size:14px}
.theme-grid button small{grid-column:2;color:#aab8c8;font-size:12px;font-weight:400}
.theme-dot{grid-row:1 / span 2;width:22px;height:22px;border-radius:50%;background:#64748b}
.theme-tech{background:linear-gradient(135deg,#2796ec,#7546d9)}
.theme-minimal{background:linear-gradient(135deg,#fff,#b8c8d8)}
.theme-glass{background:linear-gradient(135deg,#1c2938,#aab9ca)}
.theme-nature{background:linear-gradient(135deg,#456b45,#c0a56a)}
.theme-classic{background:linear-gradient(135deg,#25384e,#66778a)}
.theme-ocean{background:linear-gradient(135deg,#063b59,#26a6b8)}
.theme-sunset{background:linear-gradient(135deg,#ef6a3a,#f4c16b)}
.theme-sakura{background:linear-gradient(135deg,#ef9ab7,#fff0f4)}
.theme-cyberpunk{background:linear-gradient(135deg,#17102e,#fa3eae)}
.theme-aurora{background:linear-gradient(135deg,#16a89b,#7654c8)}
.theme-midnight{background:linear-gradient(135deg,#111318,#c5a45b)}
.theme-lavender{background:linear-gradient(135deg,#9d8bc8,#d8d4f2)}
.theme-cream{background:linear-gradient(135deg,#f4e8d2,#b99b76)}
.theme-forest{background:linear-gradient(135deg,#183d32,#91a66b)}
.theme-desert{background:linear-gradient(135deg,#c47d4c,#eed1a0)}
.theme-mono{background:linear-gradient(135deg,#111,#eee)}
.theme-retro{background:linear-gradient(135deg,#68452f,#d2a66b)}
.theme-nordic{background:linear-gradient(135deg,#c5d5df,#f5f7f8)}
.theme-rose{background:linear-gradient(135deg,#572235,#c77a8b)}
.theme-emerald{background:linear-gradient(135deg,#075e50,#9bc8a8)}
.appearance-editor input[type=range]{width:100%;margin:12px 0 0;accent-color:#a9c9ee}
.background-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.background-gallery button{position:relative;display:flex;flex-direction:column;gap:7px;min-width:0;padding:7px;background:#ffffff0b;color:#e8eef6;border:1px solid #ffffff22;text-align:left;overflow:hidden}
.background-gallery button.selected{border-color:#a9c9ee;box-shadow:0 0 0 2px #a9c9ee66;background:#8baed326}
.background-gallery img{display:block;width:100%;height:100px;object-fit:cover;border-radius:6px;background:#25384e}
.background-gallery span{font-size:13px;font-weight:600}
.background-gallery small{font-size:11px;color:#a9c9ee}
.appearance-preview{position:relative;min-height:170px;border-radius:13px;overflow:hidden;background-color:#172536;border:1px solid #ffffff35}
.preview-image{position:absolute;inset:-22px;background-color:#172536}
.preview-shade{position:absolute;inset:0;background:rgba(0,0,0,.18)}
.preview-content{position:relative;z-index:1;display:flex;flex-direction:column;gap:9px;align-items:flex-start;padding:28px;color:#fff}
.preview-content strong{font-size:22px}
.preview-content span{padding:10px 14px;border:1px solid #ffffff45;border-radius:9px;background:#ffffff20;backdrop-filter:blur(10px)}
.preview-content small{opacity:.8}
.preview-minimal .preview-content{color:#172b3c}
.preview-minimal .preview-shade{background:rgba(255,255,255,.18)}
.preview-tech .preview-content span{border-color:#75c8ff;background:#183f6a99}
.preview-nature .preview-content span{background:#31563eaa}
@media(max-width:900px){.theme-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.background-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.uploaded-gallery,.picker-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){
.admin-page{padding:18px 10px calc(38px + env(safe-area-inset-bottom))}
header{margin-bottom:20px;padding:0 5px}
.panel{padding:16px 12px;border-radius:14px}
.panel h1{font-size:27px}
.heading{align-items:flex-start}
.entry{align-items:flex-start;flex-direction:column}
.entry-actions{width:100%}
.entry-actions button{flex:1}
.top-actions{top:54px;padding:9px 0 12px}
.top-actions .save-button{width:100%;min-height:48px}
.actions{align-items:stretch;flex-direction:column}
.actions button{width:100%;min-height:44px}
.two-fields{grid-template-columns:1fr}.theme-grid{grid-template-columns:1fr 1fr}.background-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.background-gallery img{height:90px}.uploaded-gallery,.picker-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.image-picker{padding:14px;max-height:86vh}
.section-heading{align-items:flex-start;flex-direction:column}
.tabs{margin-top:16px;gap:6px}
.tabs button{padding:10px 13px}
.editor{padding:14px 11px}
}
</style>
