import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
 apiKey: "AIzaSyDcvJNa7HeG-FlZZkQJjjZaeefFyum6o9k",
 authDomain: "daily-work-tracker-feb29.firebaseapp.com",
 databaseURL: "https://daily-work-tracker-feb29-default-rtdb.firebaseio.com",
 projectId: "daily-work-tracker-feb29",
 storageBucket: "daily-work-tracker-feb29.firebasestorage.app",
 messagingSenderId: "637229671068",
 appId: "1:637229671068:web:45d226b53db93950adc359"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function timeToMinutes(time){
    if(!time) return 0;
    const parts=(time+'').split(':');
    let h=parseInt(parts[0])||0;
    let m=parseInt(parts[1])||0;
    h=Math.min(h,12);
    m=Math.min(m,59);
    return h*60+m;
}

function minutesToTime(totalMinutes){
    const h=Math.floor(totalMinutes/60);
    const m=totalMinutes%60;
    return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}



const nowLocal = new Date();
const today =
nowLocal.getFullYear() + '-' +
String(nowLocal.getMonth()+1).padStart(2,'0') + '-' +
String(nowLocal.getDate()).padStart(2,'0');

function addRow(){

const tr=document.createElement('tr');
tr.innerHTML=`
<td><input class="subject"></td>
<td><input type="text" class="given" placeholder="H:MM"></td>
<td><input type="text" class="done" placeholder="H:MM"></td>
<td><button type="button" onclick="this.closest('tr').remove();calc();">❌</button></td>
`;
document.getElementById('rows').appendChild(tr);
}
window.addRow=addRow;

function tick(){
clock.innerText=new Date().toLocaleString();
}
setInterval(tick,1000);
tick();

async function getStore(){
const snapshot = await get(ref(db,'workTracker'));
return snapshot.exists() ? snapshot.val() : {};
}

function calc(){

let g=0,a=0;

document.querySelectorAll('.given').forEach(x=>g+=timeToMinutes(x.value));
document.querySelectorAll('.done').forEach(x=>a+=timeToMinutes(x.value));

allocated.innerText=minutesToTime(g);
achieved.innerText=minutesToTime(a);

let success=g?((a/g)*100).toFixed(2):0;

rate.innerText=success+'%';

if(success>=85){
todayRemark.innerText='🟢 Excellent';
}else if(success>=70){
todayRemark.innerText='🟡 Good';
}else{
todayRemark.innerText='🔴 Needs Improvement';
}
}

document.addEventListener('input',calc);

function lockInputs(){

    document.querySelectorAll('input').forEach(i=>{
        i.disabled = true;
    });

    document.querySelectorAll('button').forEach(btn=>{

        if(btn.innerText.includes('❌')){
            btn.style.display = 'none';
        }

    });

}
async function saveDay(){

let store=await getStore();

if(store[today] && store[today].locked){
alert('Already saved.');
return;
}

let data=[];

document.querySelectorAll('#rows tr').forEach(r=>{
let i=r.querySelectorAll('input');

data.push({
subject:i[0].value,
given:i[1].value.trim() || "",
achieved:i[2].value.trim() || ""
});
});

// await set(
// ref(db,'workTracker/'+today),
// {locked:true,data:data}
// );

await set(
    ref(db, 'workTracker/' + today),
    {
        locked: true,
        data: data
    }
);

await loadToday();
await loadHistory();


 

 

lockInputs();

document.querySelectorAll('th').forEach(th=>{
    if(th.innerText.trim()==='Action'){
        th.style.display='none';
    }
});

document.querySelectorAll('#rows tr').forEach(row=>{
    row.lastElementChild.style.display='none';
});

saveStatus.innerText='✅ Saved & Locked';

await loadHistory();

await generateMonthReports();
}

window.saveDay = saveDay;

async function loadToday(){

let store = await getStore();

if(!store[today]) return;

document.getElementById('rows').innerHTML = '';

store[today].data.forEach(r=>{

    addRow();

    const lastRow =
    document.querySelector('#rows tr:last-child');

    const inputs =
    lastRow.querySelectorAll('input');

    inputs[0].value = r.subject || '';
    inputs[1].value = r.given || '';
    inputs[2].value = r.achieved || '';

});

if(store[today].locked){

    lockInputs();

    saveStatus.innerText='🔒 Saved Record';

    document.querySelectorAll('th').forEach(th=>{
        if(th.innerText.trim()==='Action'){
            th.style.display='none';
        }
    });

    document.querySelectorAll('#rows tr').forEach(row=>{
        row.lastElementChild.style.display='none';
    });

}

calc();
}

function toggleHistory(date){

const wrapper=document.getElementById('historyDetailsWrapper');
const panel=document.getElementById('historyDetails');
const selected=document.getElementById(`detail-${date}`);

if(selected){
wrapper.style.display='block';
panel.innerHTML=selected.innerHTML;
}else{
wrapper.style.display='none';
panel.innerHTML='';
}

}
window.toggleHistory = toggleHistory;

async function loadHistory(){

let store=await getStore();

historyTables.innerHTML='';



 Object.keys(store)
.sort()
.reverse()
.filter(date => date !== today)
.slice(0,8)
.forEach(date => {

    let alloc = 0;
    let ach = 0;
    let rows = '';

// Object.keys(store)
// .sort()
// .reverse()
// .slice(0,8)
// .forEach(date=>{

// if(date===today) return;

// let alloc=0;
// let ach=0;
// let rows='';

// store[date].data.forEach(r=>{

// alloc += timeToMinutes(r.given);
// ach += timeToMinutes(r.achieved);

// rows += `
// <tr>
// <td>${r.subject}</td>
// <td>${r.given}</td>
// <td>${r.achieved}</td>
// </tr>`;
// });

store[date].data.forEach(r=>{

alloc += timeToMinutes(r.given);
ach += timeToMinutes(r.achieved);

rows += `
<tr>
<td>${r.subject}</td>
<td>${r.given}</td>
<td>${r.achieved}</td>
</tr>`;
});

// Total Row
rows += `
<tr style="font-weight:bold;background:rgba(255,255,255,0.08);">
<td>Total</td>
<td>${minutesToTime(alloc)}</td>
<td>${minutesToTime(ach)}</td>
</tr>`;


 

let success=alloc?((ach/alloc)*100).toFixed(2):0;

let remark='🔴 Needs Improvement';

if(success>=85){
remark='🟢 Excellent';
}else if(success>=70){
remark='🟡 Good';
}

historyTables.innerHTML += `
<div class="historyCard">

<div class="historyHeader"
onclick="toggleHistory('${date}')">
📅 ${date}<br>
${success}%<br>
${remark}
</div>

<div id="detail-${date}" style="display:none">

<table>
<tr>
<th>Subject</th>
<th>Allocated</th>
<th>Achieved</th>
</tr>
${rows}
</table>

<br>



</div>
</div>`;
});
}

async function generateWeeklyReport(){

const now=new Date();

let store=await getStore();
let alloc=0;
let ach=0;

for(let i=7;i>=1;i--){

let d=new Date(now);
d.setDate(now.getDate()-i);

let key =
d.getFullYear() + '-' +
String(d.getMonth()+1).padStart(2,'0') + '-' +
String(d.getDate()).padStart(2,'0');

if(store[key]){
store[key].data.forEach(r=>{
alloc += timeToMinutes(r.given);
ach += timeToMinutes(r.achieved);
});
}
}

let success=alloc?((ach/alloc)*100).toFixed(2):0;

wAlloc.innerText=minutesToTime(alloc);
wAch.innerText=minutesToTime(ach);
wRate.innerText=success+'%';

progressBar.style.width=success+'%';

if(success>=85){
weekStatus.innerText='🟢 Excellent';
weekRemark.innerText='🟢 Excellent';
}else if(success>=70){
weekStatus.innerText='🟡 Good';
weekRemark.innerText='🟡 Good';
}else{
weekStatus.innerText='🔴 Needs Improvement';
weekRemark.innerText='🔴 Needs Improvement';
}

weeklyReport.style.display='block';
}


async function generateMonthReports(){
let store=await getStore();

weekHistory.innerHTML='';
monthHistory.innerHTML='';

const now=new Date();
const month=now.getMonth();
const year=now.getFullYear();


const monthName = new Date(year,month,1).toLocaleString('default',{month:'long'});

let calendarWeeks=[];
let firstDate=new Date(year,month,1);
let lastDate=new Date(year,month+1,0);

let firstSunday=new Date(firstDate);
while(firstSunday.getDay()!==0){
 firstSunday.setDate(firstSunday.getDate()-1);
}

let weekStart=new Date(firstSunday);

while(weekStart<=lastDate){
 let weekEnd=new Date(weekStart);
 weekEnd.setDate(weekStart.getDate()+6);

 calendarWeeks.push({
   start:new Date(weekStart),
   end:new Date(weekEnd),
   alloc:0,
   ach:0
 });

 weekStart.setDate(weekStart.getDate()+7);
}

Object.keys(store).forEach(date=>{
 let d=new Date(date);

 // allow cross-month Sunday-Saturday weeks

 calendarWeeks.forEach(w=>{
   if(d>=w.start && d<=w.end){
      store[date].data.forEach(r=>{
        w.alloc += timeToMinutes(r.given);
        w.ach += timeToMinutes(r.achieved);
      });
   }
 });
});

let weekCount = 0;

calendarWeeks.forEach((w,index)=>{

    if(!w.alloc && !w.ach) return;

    if(weekCount >= 4) return;

    weekCount++;

    let rate=w.alloc
        ? ((w.ach/w.alloc)*100).toFixed(2)
        : 0;

//     weekHistory.innerHTML += `
//     <div class="historyCard">
//     <div class="historyHeader">
//     📅 ${monthName} Week ${index+1}
//     <br>
//     ${w.start.getDate()} ${w.start.toLocaleString('default',{month:'short'})}
//     -
//     ${w.end.getDate()} ${w.end.toLocaleString('default',{month:'short'})}
//     <br><br>
//     ${rate}%
//     </div>
//     </div>`;
// });



weekHistory.innerHTML += `
<div class="historyCard">
<div class="historyHeader">

📅 ${monthName} Week ${index+1}
<br>
${w.start.getDate()} ${w.start.toLocaleString('default',{month:'short'})}
-
${w.end.getDate()} ${w.end.toLocaleString('default',{month:'short'})}

<br><br>

⏱ Total Allocated
<br>
${minutesToTime(w.alloc)}

<br><br>

✅ Total Achieved
<br>
${minutesToTime(w.ach)}

<br><br>

📊 ${rate}%

</div>
</div>`;});



for(let m=1;m<=12;m++){
 let target=new Date();
 target.setMonth(target.getMonth()-m);

 let alloc=0, ach=0;

 Object.keys(store).forEach(date=>{
  let d=new Date(date);
  if(d.getMonth()===target.getMonth() && d.getFullYear()===target.getFullYear()){
    store[date].data.forEach(r=>{
      alloc+=timeToMinutes(r.given);
      ach+=timeToMinutes(r.achieved);
    });
  }
 });

 if(!alloc && !ach) continue;

 let success=alloc?((ach/alloc)*100).toFixed(2):0;
 let remark='🔴 Needs Improvement';
 if(success>=85) remark='🟢 Excellent';
 else if(success>=70) remark='🟡 Good';

 monthHistory.innerHTML += `
<div class="monthPremium">

<div class="monthTitle">
📆 ${target.toLocaleString('default',{month:'long'})} ${target.getFullYear()}
</div>

<div class="monthMetric">
<label>Total Allocated</label>
<span>${minutesToTime(alloc)}</span>
</div>

<div class="monthMetric">
<label>Total Achieved</label>
<span>${minutesToTime(ach)}</span>
</div>

<div class="monthMetric">
<label>Success Rate</label>
<span>${success}%</span>
</div>

<div class="monthRemark">
${remark}
</div>

</div>`;
}
}

(async ()=>{
await loadToday();
if(rows.children.length===0){addRow();}
await loadHistory();

await generateMonthReports();
})();



document.addEventListener('input',(e)=>{

    if(
        !e.target.classList.contains('given') &&
        !e.target.classList.contains('done')
    ){
        return;
    }

    let digits = e.target.value.replace(/\D/g,'');

    if(digits === ''){
        e.target.value = '';
        calc();
        return;
    }

    // Keep only last 4 digits
    digits = digits.slice(-4);

    let padded = digits.padStart(4,'0');

    let hh = parseInt(padded.slice(0,2),10);
    let mm = parseInt(padded.slice(2,4),10);

    if(mm > 59) mm = 59;
    if(hh > 12) hh = 12;

    e.target.value =
        String(hh).padStart(2,'0') +
        ':' +
        String(mm).padStart(2,'0');

    calc();

});

 document.addEventListener('input', (e) => {

  if(e.target.classList.contains('subject')){

    let value = e.target.value;

    if(value.length > 0){
      e.target.value =
      value.charAt(0).toUpperCase() +
      value.slice(1);
    }

  }

});
