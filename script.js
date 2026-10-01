const $ = id => document.getElementById(id);

const defaultState = {
  logo: "",
  appName: "Banco Digital",
  title: "Pix recebido",
  body: "Você recebeu um Pix de R$ 850,00",
  amount: "R$ 850,00",
  sender: "",
  timeMode: "now",
  customTime: "",
  type: "Pix recebido",
  sound: "soft",
  soundOn: true,
  accent: "#ffffff",
  duration: "550",
  position: "top",
  theme: "dark"
};

let state = {...defaultState, ...(JSON.parse(localStorage.getItem("ns-current") || "null") || {})};
let models = JSON.parse(localStorage.getItem("ns-models") || "[]");
let history = JSON.parse(localStorage.getItem("ns-history") || "[]");
let audioCtx;

const fields = ["appName","title","body","amount","sender","timeMode","customTime","type","sound","accent","duration","position","theme"];

function nowTime() {
  return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
}
function displayedTime() {
  return state.timeMode === "custom" && state.customTime ? state.customTime : "Agora";
}
function saveState() {
  localStorage.setItem("ns-current", JSON.stringify(state));
}
function populate() {
  fields.forEach(id => {
    const el = $(id);
    if (el) el.value = state[id] ?? "";
  });
  $("soundToggle").classList.toggle("active", state.soundOn);
  $("customTime").disabled = state.timeMode !== "custom";
  renderLogo();
  updatePreview();
}
function readFields() {
  fields.forEach(id => {
    const el = $(id);
    if (el) state[id] = el.value;
  });
  saveState();
  updatePreview();
}
function renderLogo() {
  const preview = $("logoPreview");
  const p = state.logo ? `<img src="${state.logo}" alt="Logo">` : "<span>◎</span>";
  preview.innerHTML = p;
}
function updatePreview() {
  $("previewApp").textContent = state.appName || "Nome do aplicativo";
  $("previewTitle").textContent = state.title || "Título da notificação";
  $("previewBody").textContent = state.body || "Texto da notificação";
  $("previewClock").textContent = displayedTime();
  $("previewTime").textContent = nowTime();
  $("previewSender").textContent = state.sender ? `De: ${state.sender}` : "";
  const logo = $("previewLogo");
  logo.innerHTML = state.logo ? `<img src="${state.logo}" alt="">` : "◎";
  $("previewNotification").style.borderColor = state.accent;
  $("previewNotification").classList.toggle("light", state.theme === "light");
  $("phoneStage").style.alignItems = "stretch";
  const card = $("previewNotification");
  card.style.marginTop = state.position === "center" ? "145px" : state.position === "bottom" ? "250px" : "26px";
  $("customTime").disabled = state.timeMode !== "custom";
  $("recordPreview").innerHTML = $("previewNotification").outerHTML;
}
function showToast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 1900);
}
function playSound(kind) {
  if (!state.soundOn || kind === "none") return;
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  const freqs = {soft:[740,980], classic:[880,660], cash:[520,1040]};
  const pair = freqs[kind] || freqs.soft;
  o.type = "sine"; o.frequency.value = pair[0]; g.gain.value = .0001;
  o.connect(g); g.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  g.gain.exponentialRampToValueAtTime(.12,t+.015);
  o.frequency.exponentialRampToValueAtTime(pair[1],t+.11);
  g.gain.exponentialRampToValueAtTime(.0001,t+.28);
  o.start(t); o.stop(t+.3);
}
function makeSnapshot() {
  return {...state, createdAt: Date.now()};
}
function fireNotification(fromModel = false) {
  playSound(state.sound);
  const card = $("previewNotification");
  card.classList.remove("show");
  void card.offsetWidth;
  card.classList.add("show");
  setTimeout(() => card.classList.remove("show"), Math.max(3500, Number(state.duration)+2800));
  history.unshift({
    id: Date.now(),
    time: nowTime(),
    appName: state.appName,
    title: state.title,
    amount: state.amount,
    type: state.type
  });
  history = history.slice(0, 30);
  localStorage.setItem("ns-history", JSON.stringify(history));
  renderHistory();
  if (!fromModel) showToast("Notificação simulada disparada 🎬");
}
function saveModel() {
  const name = state.title || state.type || "Novo modelo";
  models.unshift({id:Date.now(), name, data:makeSnapshot()});
  models = models.slice(0, 30);
  localStorage.setItem("ns-models", JSON.stringify(models));
  renderModels();
  showToast("Modelo salvo.");
}
function loadModel(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;
  state = {...defaultState, ...model.data};
  saveState(); populate(); showToast("Modelo carregado.");
}
function deleteModel(id) {
  models = models.filter(m => m.id !== id);
  localStorage.setItem("ns-models", JSON.stringify(models));
  renderModels();
}
function duplicateModel(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;
  models.unshift({id:Date.now(), name:model.name+" (cópia)", data:{...model.data}});
  localStorage.setItem("ns-models", JSON.stringify(models));
  renderModels(); showToast("Modelo duplicado.");
}
function renderModels() {
  $("modelCount").textContent = models.length;
  if (!models.length) {$("modelsList").className="cards-list empty-state"; $("modelsList").textContent="Nenhum modelo salvo ainda."; return;}
  $("modelsList").className="cards-list";
  $("modelsList").innerHTML = models.map(m => {
    const d=m.data||{};
    return `<div class="model-card">
      <div class="model-icon">${d.logo?`<img src="${d.logo}" alt="">`:"◎"}</div>
      <div class="model-main"><strong>${escapeHtml(m.name)}</strong><span>${escapeHtml(d.appName||"")} · ${escapeHtml(d.type||"")}</span></div>
      <div class="model-actions">
        <button class="small-btn" data-load="${m.id}">Usar</button>
        <button class="small-btn" data-dup="${m.id}">Copiar</button>
        <button class="small-btn" data-del="${m.id}">×</button>
      </div>
    </div>`;
  }).join("");
}
function renderHistory() {
  if (!history.length) {$("historyList").className="history-list empty-state"; $("historyList").textContent="Nenhuma notificação simulada ainda."; return;}
  $("historyList").className="history-list";
  $("historyList").innerHTML=history.map(h=>`<div class="history-card">
    <div class="history-main"><strong>${escapeHtml(h.title||"Sem título")}</strong><span>${escapeHtml(h.appName||"")} · ${escapeHtml(h.type||"")}</span></div>
    <div class="history-meta">${escapeHtml(h.amount||"—")}<br>${escapeHtml(h.time)}</div>
  </div>`).join("");
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function setLogo(file) {
  if (!file) return;
  if (!["image/png","image/jpeg","image/webp"].includes(file.type)) return showToast("Use PNG, JPG ou WEBP.");
  const reader=new FileReader();
  reader.onload=e=>{state.logo=e.target.result;saveState();renderLogo();updatePreview();};
  reader.readAsDataURL(file);
}
function enterRecordMode() {
  $("recordOverlay").classList.add("active");
  $("recordOverlay").setAttribute("aria-hidden","false");
  $("recordPreview").innerHTML=$("previewNotification").outerHTML;
}
function exitRecordMode() {
  $("recordOverlay").classList.remove("active");
  $("recordOverlay").setAttribute("aria-hidden","true");
}
function fireRecord() {
  playSound(state.sound);
  const card=$("recordPreview").firstElementChild;
  card.classList.remove("show"); void card.offsetWidth; card.classList.add("show");
  setTimeout(()=>card.classList.remove("show"), Number(state.duration)+3500);
}
function reset() {
  state={...defaultState}; saveState(); populate(); showToast("Campos limpos.");
}

fields.forEach(id => $(id)?.addEventListener("input", readFields));
$("logoInput").addEventListener("change", e=>setLogo(e.target.files[0]));
$("removeLogoBtn").addEventListener("click",()=>{state.logo="";saveState();renderLogo();updatePreview();});
$("soundToggle").addEventListener("click",()=>{state.soundOn=!state.soundOn;$("soundToggle").classList.toggle("active",state.soundOn);saveState();});
$("fireBtn").addEventListener("click",()=>fireNotification());
$("saveBtn").addEventListener("click",saveModel);
$("clearBtn").addEventListener("click",reset);
$("clearHistoryBtn").addEventListener("click",()=>{history=[];localStorage.setItem("ns-history","[]");renderHistory();});
$("recordModeBtn").addEventListener("click",enterRecordMode);
$("navRecordBtn").addEventListener("click",enterRecordMode);
$("exitRecordBtn").addEventListener("click",exitRecordMode);
$("recordFireBtn").addEventListener("click",fireRecord);
$("lockBtn").addEventListener("click",()=>{document.body.classList.toggle("locked");$("lockBtn").textContent=document.body.classList.contains("locked")?"🔓 Desbloquear configurações":"🔒 Bloquear configurações";});
$("closeInstall").addEventListener("click",()=>{$("installHint").hidden=true;localStorage.setItem("ns-install-dismissed","1");});
$("modelsList").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return;
  if(b.dataset.load) loadModel(Number(b.dataset.load));
  if(b.dataset.dup) duplicateModel(Number(b.dataset.dup));
  if(b.dataset.del) deleteModel(Number(b.dataset.del));
});
document.querySelectorAll(".nav-item[data-scroll]").forEach(b=>b.addEventListener("click",()=>{
  document.getElementById(b.dataset.scroll).scrollIntoView({behavior:"smooth"});
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");
}));

if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches === false && /iPhone|iPad|iPod/i.test(navigator.userAgent) && !localStorage.getItem("ns-install-dismissed")) {
  setTimeout(()=>$("installHint").hidden=false,2200);
}
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));

populate(); renderModels(); renderHistory();
