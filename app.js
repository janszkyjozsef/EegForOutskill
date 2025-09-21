// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Tabs
document.querySelectorAll('.tab-link').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    document.querySelectorAll('.tab-link').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('show'));
    a.classList.add('active');
    document.getElementById(a.dataset.tab).classList.add('show');
  });
});

// Band classifier
function classify(f){
  if(!isFinite(f) || f<=0) return 'Invalid frequency';
  if(f<0.5) return 'Infraslow';
  if(f<4) return 'Delta (0.5–4 Hz)';
  if(f<8) return 'Theta (4–8 Hz)';
  if(f<13) return 'Alpha (8–13 Hz)';
  if(f<30) return 'Beta (13–30 Hz)';
  if(f<80) return 'Gamma (30–80 Hz)';
  return 'High‑gamma (>80 Hz)';
}
const freq = document.getElementById('freq');
const bandOut = document.getElementById('bandOut');
function updateBand(){ bandOut.textContent = classify(parseFloat(freq.value)); }
freq.addEventListener('input', updateBand); updateBand();

// Wave sandbox
const wave = document.getElementById('wave'); const wctx = wave.getContext('2d');
function drawWave(){
  const f = parseFloat(freq.value)||10;
  const amp = parseFloat(document.getElementById('amp').value)||50;
  const W = wave.width = wave.clientWidth; const H = wave.height = wave.clientHeight;
  wctx.clearRect(0,0,W,H);
  wctx.strokeStyle = '#54d6a1'; wctx.lineWidth=2; wctx.beginPath();
  for(let x=0;x<W;x++){
    const t = x/W;
    const y = H/2 - Math.sin(2*Math.PI*(f*t)) * (amp/100) * (H*0.45);
    if(x===0) wctx.moveTo(x,y); else wctx.lineTo(x,y);
  }
  wctx.stroke();
  wctx.strokeStyle='#242a36'; wctx.beginPath(); wctx.moveTo(0,H/2); wctx.lineTo(W,H/2); wctx.stroke();
}
drawWave();
document.getElementById('amp').addEventListener('input', drawWave);
freq.addEventListener('input', drawWave);

// 10–20 notes
const notes = {
  Fp1:"Frontal pole left — eye‑blink artifacts prominent.",
  Fp2:"Frontal pole right — symmetric to Fp1.",
  F7:"Inferior frontal left — EMG common.",
  F3:"Mid‑frontal left — attention/executive.",
  Fz:"Midline frontal — frontal midline theta.",
  F4:"Mid‑frontal right.",
  F8:"Inferior frontal right.",
  T7:"Temporal left — auditory vicinity.",
  C3:"Central left — sensorimotor hand area.",
  Cz:"Vertex — midline.",
  C4:"Central right — sensorimotor hand area.",
  T8:"Temporal right.",
  P7:"Parietal left — visuospatial.",
  P3:"Parietal left, superior.",
  Pz:"Parietal midline.",
  P4:"Parietal right.",
  P8:"Parietal right, inferior.",
  O1:"Occipital left — alpha strongest with eyes closed.",
  Oz:"Occipital midline.",
  O2:"Occipital right — photic driving during IPS."
};
document.querySelectorAll('#sites .el').forEach(n=>{
  n.addEventListener('click',()=>{
    const id = n.dataset.id;
    document.getElementById('siteInfo').textContent = `**${id}** — ${notes[id]||'No note.'}`;
  });
});

// Wikipedia summary
async function wikiSummary(title){
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title);
  const res = await fetch(url, {headers:{"Accept":"application/json"}});
  if(!res.ok) throw new Error('HTTP '+res.status);
  const j = await res.json();
  return (j.extract || 'No summary') + (j.content_urls?.desktop?.page ? `\n\nMore: ${j.content_urls.desktop.page}` : '');
}
document.getElementById('wikiBtn').addEventListener('click', async ()=>{
  const term = document.getElementById('siteSearch').value.trim() || '10–20 system (EEG)';
  const out = document.getElementById('wikiOut'); out.textContent = 'Loading…';
  try{ out.textContent = await wikiSummary(term); }catch(e){ out.textContent = 'Failed to load.'; }
});
document.getElementById('wgo').addEventListener('click', async ()=>{
  const term = document.getElementById('wq').value.trim() || 'Electroencephalography';
  const out = document.getElementById('wout'); out.textContent = 'Loading…';
  try{ out.textContent = await wikiSummary(term); }catch(e){ out.textContent = 'Failed to load.'; }
});

// SIMULATE: synth + CSV + spectrum
const sigCanvas = document.getElementById('sig'); const sctx = sigCanvas.getContext('2d');
const fftCanvas = document.getElementById('fft'); const fctx = fftCanvas.getContext('2d');

function hann(n,i){ return 0.5*(1-Math.cos(2*Math.PI*i/(n-1))); }
function dftMag(x, fs){
  const N = Math.min(1024, x.length);
  const X = new Float32Array(N/2);
  for(let k=0;k<N/2;k++){
    let re=0, im=0;
    for(let n=0;n<N;n++){
      const w = hann(N,n);
      const ang = -2*Math.PI*k*n/N;
      re += w * x[n] * Math.cos(ang);
      im += w * x[n] * Math.sin(ang);
    }
    X[k] = Math.sqrt(re*re+im*im);
  }
  const freqs = new Float32Array(N/2);
  for(let k=0;k<N/2;k++) freqs[k] = k*fs/N;
  return {freqs, mag:X};
}

function drawSignal(x){
  const W = sigCanvas.width = sigCanvas.clientWidth; const H = sigCanvas.height = sigCanvas.clientHeight;
  sctx.clearRect(0,0,W,H);
  sctx.strokeStyle='#54d6a1'; sctx.lineWidth=2; sctx.beginPath();
  for(let i=0;i<x.length;i++){
    const px = i/(x.length-1)*W;
    const py = H/2 - x[i]/100 * (H*0.8);
    if(i===0) sctx.moveTo(px,py); else sctx.lineTo(px,py);
  }
  sctx.stroke();
  sctx.strokeStyle='#242a36'; sctx.beginPath(); sctx.moveTo(0,H/2); sctx.lineTo(W,H/2); sctx.stroke();
}

function drawSpectrum(freqs, mag){
  const W = fftCanvas.width = fftCanvas.clientWidth; const H = fftCanvas.height = fftCanvas.clientHeight;
  fctx.clearRect(0,0,W,H);
  const maxF = 80; // show up to 80 Hz
  const maxMag = Math.max(1, ...mag);
  fctx.strokeStyle='#89b4fa'; fctx.beginPath();
  for(let i=0;i<freqs.length;i++){
    if(freqs[i]>maxF) break;
    const x = (freqs[i]/maxF)*W;
    const y = H - (mag[i]/maxMag)*H;
    if(i===0) fctx.moveTo(x,y); else fctx.lineTo(x,y);
  }
  fctx.stroke();
  // grid lines
  fctx.strokeStyle='#242a36';
  for(let f=10; f<=80; f+=10){
    const x = (f/maxF)*W;
    fctx.beginPath(); fctx.moveTo(x,0); fctx.lineTo(x,H); fctx.stroke();
  }
}

let lastSignal = null, lastFs = 256;

function synth(){
  const fs = parseFloat(document.getElementById('fs').value)||256;
  const secs = parseFloat(document.getElementById('secs').value)||4;
  const aAmp = parseFloat(document.getElementById('aAmp').value)||0;
  const bAmp = parseFloat(document.getElementById('bAmp').value)||0;
  const nAmp = parseFloat(document.getElementById('nAmp').value)||0;
  const blink = document.getElementById('blink').value==='on';

  const N = Math.max(16, Math.floor(fs*secs));
  const x = new Float32Array(N);
  for(let n=0;n<N;n++){
    const t = n/fs;
    let y = aAmp*Math.sin(2*Math.PI*10*t) + bAmp*Math.sin(2*Math.PI*20*t);
    // noise (Gaussian via Box–Muller)
    const u = Math.random(); const v = Math.random();
    const gauss = Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
    y += gauss*nAmp;
    // blink as slow triangular wave burst
    if(blink && (n%Math.floor(fs*1.2) < fs*0.3)){
      const phase = (n%Math.floor(fs*0.3))/ (fs*0.3);
      y += 200*(1-Math.abs(2*phase-1));
    }
    x[n] = y;
  }
  lastSignal = x; lastFs = fs;
  drawSignal(x);
  return x;
}

document.getElementById('gen').addEventListener('click', synth);
document.getElementById('dlCSV').addEventListener('click', ()=>{
  if(!lastSignal) synth();
  let csv = "uV\n" + Array.from(lastSignal).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download="signal.csv"; a.click();
  URL.revokeObjectURL(a.href);
});

function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const arr = [];
  for(const line of lines){
    const parts = line.split(/,|;|\s+/).filter(Boolean);
    const val = parseFloat(parts.length>1? parts[1]: parts[0]);
    if(isFinite(val)) arr.push(val);
  }
  return new Float32Array(arr);
}

document.getElementById('file').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const txt = await f.text();
  lastSignal = parseCSV(txt);
  drawSignal(lastSignal);
});

document.getElementById('spec').addEventListener('click', ()=>{
  if(!lastSignal){ synth(); }
  const {freqs, mag} = dftMag(lastSignal, lastFs);
  drawSpectrum(freqs, mag);
});

// Quiz (15 items)
const quiz = [
  {q:"Which band is 8–13 Hz?", a:["Theta","Alpha","Beta","Gamma"], k:1, why:"Alpha rhythm is 8–13 Hz; posterior dominant with eyes closed."},
  {q:"Eye blinks are most visible at…", a:["Fp1/Fp2","O1/O2","C3/C4","P3/P4"], k:0, why:"Corneo‑retinal dipole projects to frontal poles."},
  {q:"Line noise is usually at…", a:["0.5–4 Hz","4–8 Hz","50/60 Hz",">80 Hz"], k:2, why:"Mains frequency contaminates around 50/60 Hz."},
  {q:"3 Hz generalized spike‑and‑wave is classic for…", a:["Absence epilepsy","Focal temporal epilepsy","Artifact","ECG"], k:0, why:"Typical absence seizures show ~3 Hz S&W."},
  {q:"Mu rhythm is blocked by…", a:["Eye closure","Hand movement","Photic stimulation","Sleep"], k:1, why:"Contralateral motor activity suppresses mu."},
  {q:"Sleep spindles (12–15 Hz) indicate…", a:["N1","N2","N3","REM"], k:1, why:"Spindles and K‑complexes are N2 markers."},
  {q:"Beta is classically enhanced by…", a:["Benzodiazepines","Hypoglycemia","Migraine","Hyponatremia"], k:0, why:"Benzodiazepines increase beta power."},
  {q:"Focal delta during wakefulness often suggests…", a:["Structural lesion","Hyperventilation","Normal variant","Blink artifact"], k:0, why:"Focal slowing is pathological."},
  {q:"Photoparoxysmal response is…", a:["Normal occipital driving","Generalized epileptiform response","Muscle artifact","ECG"], k:1, why:"PPR is abnormal generalized response to IPS."},
  {q:"Cz is located at the…", a:["Left central","Right central","Midline vertex","Occipital midline"], k:2, why:"'z' denotes midline."},
  {q:"Notch filter is used for…", a:["Suppress 50/60 Hz noise","Enhance alpha","Remove DC drift","Detect spikes"], k:0, why:"It targets mains interference."},
  {q:"Electrode pop looks like…", a:["Periodic low‑amp spikes","Sudden high‑amp transients","High‑freq fuzz","Slow drifts"], k:1, why:"Bad contact yields sudden jumps."},
  {q:"K‑complex is typical of…", a:["Wake","N1","N2","REM"], k:2, why:"K‑complexes are N2 features."},
  {q:"Bipolar montage emphasizes…", a:["Local differences","Global activity","ECG","EMG"], k:0, why:"Bipolar derivations take differences of neighbors."},
  {q:"Occipital alpha attenuates with…", a:["Eyes open","Eyes closed","Hyperventilation","Sleep"], k:0, why:"Opening eyes blocks PDR."}
];
let qi=0, score=0;
function showQ(){
  const it = quiz[qi];
  const box = document.getElementById('qBox');
  box.textContent = `Q${qi+1}/${quiz.length}: ${it.q}\nA) ${it.a[0]}\nB) ${it.a[1]}\nC) ${it.a[2]}\nD) ${it.a[3]}`;
  document.getElementById('qStatus').textContent = `Score: ${score}`;
}
function answer(idx){
  const it = quiz[qi];
  const ok = (idx===it.k); if(ok) score++;
  document.getElementById('qStatus').innerHTML = (ok?'<span class="ok">Correct.</span> ':'<span class="bad">Wrong.</span> ') + it.why + ` • Score: ${score}`;
}
document.getElementById('ansA').onclick=()=>answer(0);
document.getElementById('ansB').onclick=()=>answer(1);
document.getElementById('ansC').onclick=()=>answer(2);
document.getElementById('ansD').onclick=()=>answer(3);
document.getElementById('nextQ').onclick=()=>{ qi=(qi+1)%quiz.length; showQ(); };
showQ();

// Register service worker (optional offline)
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
