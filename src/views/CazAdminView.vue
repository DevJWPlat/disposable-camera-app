<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'
import CazAdminGallery from '@/components/admin/CazAdminGallery.vue'

const router=useRouter()
const loading=ref(true), loggingIn=ref(false), refreshing=ref(false)
const username=ref(eventConfig.adminUsername || 'cazanddan'), password=ref(''), showPassword=ref(false), error=ref(''), admin=ref(null), stats=ref(null), photos=ref([]), stage=ref('dashboard')
const displayParticipants=ref(0), displayPhotos=ref(0)
const galleryShare=ref({enabled:false,shareUrl:null}), sharingSaving=ref(false), copied=ref(false)
const galleryUnlockAt=new Date(eventConfig.galleryUnlockAt)
const testingUnlockEnabled = false
const galleryUnlocked=computed(()=>testingUnlockEnabled || Date.now()>=galleryUnlockAt.getTime())
const unlockLabel='11 October 2026 at 9:00am'
async function api(path,options={}){const response=await fetch(`${API_BASE_URL}${path}`,{credentials:'include',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){if(response.status===401)admin.value=null;throw new Error(data?.error||`Request failed (${response.status})`)}return data}
async function restore(){try{const data=await api('/api/admin/me');admin.value=data.admin;await refresh()}catch{admin.value=null}finally{loading.value=false}}
async function login(){loggingIn.value=true;error.value='';try{const data=await api('/api/admin/login',{method:'POST',body:JSON.stringify({email:username.value,password:password.value})});admin.value=data.admin;password.value='';await refresh()}catch(err){error.value=err.message}finally{loggingIn.value=false}}
async function logout(){try{await api('/api/admin/logout',{method:'POST',body:'{}'})}catch{}admin.value=null;stats.value=null;photos.value=[];stage.value='dashboard'}
function animateCount(target, output){
  const end=Math.max(0,Number(target)||0)
  output.value=0
  if(!end)return
  const started=performance.now()
  const duration=650
  const tick=(now)=>{
    const progress=Math.min(1,(now-started)/duration)
    output.value=Math.round(end*(1-Math.pow(1-progress,3)))
    if(progress<1)requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
async function refresh(){if(!admin.value)return;refreshing.value=true;try{const [s,p,share]=await Promise.all([api('/api/admin/stats'),api('/api/admin/photos'),api('/api/admin/gallery-share')]);stats.value=s;photos.value=p.photos||[];galleryShare.value={enabled:Boolean(share.enabled),shareUrl:share.shareUrl||null};animateCount(s.sessions,displayParticipants);animateCount(s.photos,displayPhotos)}catch(err){error.value=err.message}finally{refreshing.value=false}}
async function setGuestSharing(enabled){if(!galleryUnlocked.value||sharingSaving.value)return;sharingSaving.value=true;copied.value=false;error.value='';try{const share=await api('/api/admin/gallery-share',{method:'POST',body:JSON.stringify({enabled})});galleryShare.value={enabled:Boolean(share.enabled),shareUrl:share.shareUrl||null}}catch(err){error.value=err.message}finally{sharingSaving.value=false}}
async function copyShareLink(){if(!galleryShare.value.shareUrl)return;try{await navigator.clipboard.writeText(galleryShare.value.shareUrl)}catch{const input=document.createElement('textarea');input.value=galleryShare.value.shareUrl;document.body.appendChild(input);input.select();document.execCommand('copy');input.remove()}copied.value=true;window.setTimeout(()=>{copied.value=false},1800)}
onMounted(restore)
</script>

<template>
  <main class="admin">
    <div v-if="loading" class="loading">Loading…</div>
    <section v-else-if="!admin" class="login-shell">
      <button class="login-hero" type="button" @click="router.push('/')"><img :src="eventConfig.heroImage" alt="Caz and Dan"></button>
      <div class="login-copy"><p>PRIVATE ADMIN</p><h1>CAZ &amp; DAN</h1><span>10.10.26</span></div>
      <form @submit.prevent="login"><label>USERNAME<input v-model.trim="username" autocomplete="username"></label><label>PASSWORD<div class="password-field"><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"><button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword=!showPassword"><i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i></button></div></label><p v-if="error" class="error">{{ error }}</p><button class="login-button" :disabled="loggingIn">{{ loggingIn?'SIGNING IN…':'LOGIN' }}</button></form>
    </section>

    <template v-else>
      <header class="admin-bar"><div><small>CAZ &amp; DAN</small><strong>Admin</strong></div><button @click="logout">Log out</button></header>
      <section v-if="stage==='dashboard'" class="dashboard">
        <div class="dashboard-head"><div><p>10.10.26</p><h1>Overview</h1></div><button :disabled="refreshing" @click="refresh">{{ refreshing?'Refreshing…':'Refresh' }}</button></div>
        <section class="storage-notice" aria-label="Photo storage notice">
          <i class="fa-regular fa-clock" aria-hidden="true"></i>
          <div>
            <strong>Photo storage</strong>
            <span>All images will be deleted on 10 December 2026. If you want or need to extend this, speak to Jonny.</span>
          </div>
        </section>
        <div class="stats"><article><span>PARTICIPANTS</span><strong>{{ displayParticipants }}</strong></article><article><span>PHOTOS TAKEN</span><strong>{{ displayPhotos }}</strong></article></div>
        <button class="gallery-card" :class="{ unlocked:galleryUnlocked }" :disabled="!galleryUnlocked" @click="galleryUnlocked && (stage='gallery')"><div><span>PHOTO GALLERY</span><strong>{{ galleryUnlocked ? 'Gallery open' : 'Gallery locked' }}</strong><small>{{ galleryUnlocked?`${stats?.photos??0} photographs`:`Available ${unlockLabel}` }}</small></div><span v-if="galleryUnlocked" class="gallery-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span><span v-else class="gallery-lock-icon" aria-hidden="true"><i class="fa-solid fa-lock"></i></span></button>
        <section class="guest-share-card" :class="{ locked:!galleryUnlocked, enabled:galleryShare.enabled }">
          <div class="guest-share-copy">
            <span>GUEST GALLERY</span>
            <strong>Unlock gallery for guests</strong>
            <small>Turn this on if you would like a link that you can share with your guests so they can view all photos too.</small>
          </div>
          <div class="guest-share-control">
            <i v-if="!galleryUnlocked" class="fa-solid fa-lock" aria-hidden="true"></i>
            <button v-else class="share-toggle" :class="{ on:galleryShare.enabled }" type="button" role="switch" :aria-checked="galleryShare.enabled" :disabled="sharingSaving" @click="setGuestSharing(!galleryShare.enabled)"><span></span><b>{{ galleryShare.enabled ? 'ON' : 'OFF' }}</b></button>
          </div>
          <div v-if="galleryUnlocked && galleryShare.enabled && galleryShare.shareUrl" class="share-link-row">
            <input :value="galleryShare.shareUrl" readonly aria-label="Guest gallery share link" />
            <button type="button" @click="copyShareLink"><i class="fa-regular fa-copy" aria-hidden="true"></i>{{ copied ? 'Copied' : 'Copy link' }}</button>
          </div>
          <p v-if="!galleryUnlocked" class="share-locked-note">Available once the main gallery opens.</p>
        </section>
      </section>
      <section v-else class="gallery-stage"><div class="gallery-nav"><button @click="stage='dashboard'">← Overview</button></div><CazAdminGallery :photos="photos" /></section>
    </template>
  </main>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');
.admin{min-height:100svh;background:#f7f5ef;color:#111}.loading{min-height:100svh;display:grid;place-items:center}.login-shell{width:min(100%,430px);min-height:100svh;margin:auto;background:#faf9f4;padding:30px 24px}.login-hero{display:block;width:72%;margin:0 auto;border:0;border-radius:8px;overflow:hidden;padding:0;background:transparent;cursor:pointer}.login-hero img{display:block;width:100%;aspect-ratio:1;object-fit:cover}.login-copy{text-align:center;margin:24px 0}.login-copy p{margin:0 0 8px;font-size:10px;letter-spacing:.22em}.login-copy h1{margin:0;font:400 42px Georgia,serif}.login-copy span{display:block;margin-top:6px;letter-spacing:.22em}.login-shell form{display:grid;gap:15px}.login-shell label{display:grid;gap:6px;font-size:9px;font-weight:700;letter-spacing:.17em}.login-shell input{width:100%;min-height:48px;border:1px solid #c9c6be;border-radius:6px;background:#fff;padding:0 44px 0 13px;font:inherit}.password-field{position:relative}.password-toggle{position:absolute;top:50%;right:6px;transform:translateY(-50%);display:grid;width:36px;height:36px;place-items:center;padding:0!important;border:0!important;background:transparent!important;color:#111!important;cursor:pointer}.password-toggle i{font-size:15px}.login-button{min-height:54px;border:0;border-radius:6px;background:#111;color:#fff;font:600 13px Montserrat,sans-serif;letter-spacing:.18em}.error{margin:0;color:#993a3a;font-size:12px}.admin-bar{display:flex;align-items:center;justify-content:space-between;padding:18px clamp(18px,4vw,40px);border-bottom:1px solid #d5d2ca;background:#f7f5ef}.admin-bar div{display:flex;flex-direction:column}.admin-bar small{font-size:9px;letter-spacing:.2em}.admin-bar strong{font:400 24px Georgia,serif}.admin-bar button,.dashboard button,.gallery-nav button{border:1px solid #c9c6be;border-radius:6px;background:#fff;color:#111;padding:10px 14px}.dashboard{width:min(100% - 32px,1080px);margin:0 auto;padding:46px 0 70px}.dashboard-head{display:flex;align-items:end;justify-content:space-between}.dashboard-head p{margin:0;font-size:10px;letter-spacing:.22em}.dashboard-head h1{margin:7px 0 0;font:400 52px Georgia,serif}.storage-notice{display:flex;align-items:flex-start;gap:13px;margin-top:24px;border:1px solid #d2cfc7;border-radius:10px;background:#efede7;padding:18px 20px;color:#111}.storage-notice>i{margin-top:2px;font-size:18px}.storage-notice>div{display:grid;gap:4px}.storage-notice strong{font-size:10px;letter-spacing:.18em;text-transform:uppercase}.storage-notice span{color:#716f69;font-size:13px;line-height:1.5}.stats{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:30px}.stats article{min-height:180px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #d2cfc7;border-radius:10px;background:#f7f5ef;padding:24px}.stats span{font-size:10px;letter-spacing:.18em}.stats strong{font:400 68px Georgia,serif}.gallery-card{width:100%;margin-top:20px;display:flex;align-items:center;justify-content:space-between;text-align:left!important;padding:24px!important;background:#111!important;color:#fff!important;border-color:#111!important;box-shadow:none!important}.gallery-card div{display:grid;gap:5px}.gallery-card span{font-size:9px;letter-spacing:.2em}.gallery-card strong{font:400 28px Georgia,serif}.gallery-card small{display:block;margin:0;color:#716f69;font:400 13px/1.4 Montserrat,sans-serif;letter-spacing:0}.gallery-arrow{display:grid;width:44px;height:44px;place-items:center;color:inherit;flex:0 0 auto}.gallery-arrow i{font-size:25px;line-height:1}.gallery-lock-icon i{font-size:38px!important;line-height:1}.gallery-card.unlocked{background:#111!important;color:#fff!important;border-color:#111!important}.gallery-card.unlocked small{color:#fff!important}.gallery-card:disabled{background:#f2f0ea!important;color:#8b877f!important;border-color:#d2cfc7!important;opacity:1}.gallery-card:disabled small{color:#8b877f!important}.gallery-lock-icon{display:grid;width:44px;height:44px;place-items:center;color:#8b877f;flex:0 0 auto}.gallery-lock-icon i{font-size:25px!important;line-height:1}.gallery-nav{background:#f7f5ef;padding:14px 24px;border-bottom:1px solid #d8d5cd}
.guest-share-card{margin-top:14px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:18px;border:1px solid #d2cfc7;border-radius:10px;background:#fff;padding:22px 24px}.guest-share-card.locked{background:#f2f0ea;color:#8b877f}.guest-share-copy{display:grid;gap:5px}.guest-share-copy>span{font-size:9px;font-weight:700;letter-spacing:.2em}.guest-share-copy>strong{font:400 25px Georgia,serif}.guest-share-copy>small{max-width:680px;color:#716f69;font:400 13px/1.5 Montserrat,sans-serif;letter-spacing:0}.guest-share-control{display:flex;align-items:center;justify-content:flex-end;min-width:96px}.guest-share-control>i{font-size:25px;color:#8b877f}.share-toggle{display:flex!important;min-width:88px!important;min-height:42px!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;border:1px solid #c9c6be!important;border-radius:999px!important;background:#f0eee8!important;padding:5px 10px 5px 5px!important;color:#716f69!important}.share-toggle>span{width:30px;height:30px;border-radius:50%;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.14);transition:transform .18s ease}.share-toggle b{font-size:10px;letter-spacing:.12em}.share-toggle.on{background:#111!important;color:#fff!important;border-color:#111!important}.share-toggle.on>span{transform:translateX(46px)}.share-toggle.on b{transform:translateX(-34px)}.share-link-row{grid-column:1/-1;display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:2px;padding-top:16px;border-top:1px solid #e2dfd8}.share-link-row input{width:100%;min-width:0;min-height:46px;border:1px solid #d2cfc7;border-radius:6px;background:#f7f5ef;color:#111;padding:0 12px;font-size:12px}.share-link-row button{display:flex!important;align-items:center!important;gap:8px!important;white-space:nowrap;background:#111!important;color:#fff!important;border-color:#111!important}.share-locked-note{grid-column:1/-1;margin:0;color:#8b877f;font-size:11px}
@media(max-width:620px){.guest-share-card{grid-template-columns:1fr;padding:20px}.guest-share-control{justify-content:flex-start}.share-link-row{grid-template-columns:1fr}.share-link-row button{justify-content:center!important;width:100%}.stats{grid-template-columns:1fr}.stats article{min-height:140px}.dashboard-head h1{font-size:42px}.login-hero{width:78%}}
</style>
