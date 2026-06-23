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

function timeToMinutes(time) {
    if (!time) return 0;
    const parts = (time + '').split(':');
    let h = parseInt(parts[0]) || 0;
    let m = parseInt(parts[1]) || 0;
    h = Math.min(h, 12);
    m = Math.min(m, 59);
    return h * 60 + m;
}

function minutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}



const nowLocal = new Date();
const today =
    nowLocal.getFullYear() + '-' +
    String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' +
    String(nowLocal.getDate()).padStart(2, '0');

function addRow() {


    const tr = document.createElement('tr');
    tr.innerHTML = `
<td>
    <select class="subject">
   
        <option value="">Select Subject</option>
        <option value="Vocabulary">Vocabulary</option>
        <option value="History">History</option>
        <option value="Geography">Geography</option>
        <option value="English">English</option>
        <option value="Odia">Odia</option>
        <option value="Polity">Polity</option>
        <option value="Economic">Economic</option>
        <option value="Mathematics">Mathematics</option>
        <option value="Reasoning">Reasoning</option>
        <option value="Data Interpretation">Data Interpretation</option>
        <option value="Environment">Environment</option>
        <option value="Current Affairs">Current Affairs</option>
        <option value="Art and Culture">Art and Culture</option>
        <option value="Physics">Physics</option>
        <option value="Chemistry">Chemistry</option>
        <option value="Biology">Biology</option>
        <option value="Static GK">Static Gk</option>
        <option value="Odisha Gk">Odisha Gk</option>
        <option value="Mock Tests">Mock Tests</option>
            
        
    </select>
</td>
<td><input type="text" class="given" placeholder="H:MM"></td>
<td><input type="text" class="done" placeholder="H:MM"></td>
<td>
<button type="button"
onclick="
this.closest('tr').remove();
updateSubjectOptions();
calc();
">
❌
</button>
</td>
`;
    document.getElementById('rows').appendChild(tr);

    const select = tr.querySelector('.subject');
    select.addEventListener('change', updateSubjectOptions);

    updateSubjectOptions();
}
window.addRow = addRow;

function tick() {
    clock.innerText = new Date().toLocaleString();
}
setInterval(tick, 1000);
tick();

async function getStore() {
    const snapshot = await get(ref(db, 'workTracker'));
    return snapshot.exists() ? snapshot.val() : {};
}


async function fillMissingDays() {

    let store = await getStore();

    const now = new Date();

    // First day of current month
    let current = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    // Yesterday
    let yesterday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
    );

    while (current <= yesterday) {

        const key =
            current.getFullYear() + '-' +
            String(current.getMonth() + 1).padStart(2, '0') + '-' +
            String(current.getDate()).padStart(2, '0');

        // Insert only if missing
        if (!store[key]) {

            await set(
                ref(db, 'workTracker/' + key),
                {
                    locked: true,

                    data: [
                        {
                            subject: 'No Work',
                            given: '00:00',
                            achieved: '00:00',
                            completed: true

                        }
                    ]
                }
            );

        }

        current.setDate(current.getDate() + 1);
    }

}

function calc() {

    let g = 0, a = 0;

    document.querySelectorAll('.given').forEach(x => g += timeToMinutes(x.value));
    document.querySelectorAll('.done').forEach(x => a += timeToMinutes(x.value));

    allocated.innerText = minutesToTime(g);
    achieved.innerText = minutesToTime(a);

    let success = g ? ((a / g) * 100).toFixed(2) : 0;

    rate.innerText = success + '%';

    if (success >= 85) {
        todayRemark.innerText = '🟢 Excellent';
    } else if (success >= 70) {
        todayRemark.innerText = '🟡 Good';
    } else {
        todayRemark.innerText = '🔴 Needs Improvement';
    }
}

document.addEventListener('input', calc);

async function saveDay() {

    let store = await getStore();

    let oldData = store[today]?.data || [];

    let data = [];

    document.querySelectorAll('#rows tr').forEach(r => {

        const subject = r.querySelector('.subject').value;
        const given = r.querySelector('.given').value.trim();
        const achieved = r.querySelector('.done').value.trim();

        if (!subject) return;


        let old =
            oldData.find(x => x.subject === subject);


        let completed =
            old?.completed || false;



        if (

            achieved && achieved !== "00:00"

        ) {

            completed = true;

        }



        data.push({

            subject,

            given: given || "00:00",

            achieved: achieved || "00:00",

            completed

        });


    });



    await set(

        ref(db, 'workTracker/' + today),

        {

            locked: false,

            data: data

        }

    );



    await loadToday();

    await loadHistory();
    await generateWeeklyReport();

    await generateMonthReports();




    saveStatus.innerText = '✅ Progress Saved';


}

window.saveDay = saveDay;

async function saveAllocatedHour() {

    let store = await getStore();



    let data = [];

    document.querySelectorAll('#rows tr').forEach(r => {

        const subject = r.querySelector('.subject').value;
        const given = r.querySelector('.given').value.trim();

        if (subject) {
            data.push({
                subject,
                given: given || "00:00",
                achieved: "00:00",
                completed: false
            });
        }

    });

    if (data.length === 0) {
        alert("Please add at least one subject.");
        return;
    }

    await set(ref(db, 'workTracker/' + today), {
        locked: false,
        data: data
    });

    await loadToday();

    await loadHistory();

    await generateMonthReports();

    await generateWeeklyReport();




    saveStatus.innerText = '⏱️ Plan Saved';

    document.getElementById('addBtn').disabled = true;
    document.getElementById('saveAllocatedBtn').disabled = true;
}

window.saveAllocatedHour = saveAllocatedHour;



async function loadToday() {

    let store = await getStore();

    if (!store[today]) return;

    document.getElementById('rows').innerHTML = '';

    store[today].data.forEach(r => {

        addRow();

        const lastRow =
            document.querySelector('#rows tr:last-child');

        lastRow.querySelector('.subject').value =
            r.subject || '';

        lastRow.querySelector('.given').value =
            r.given || '';

        lastRow.querySelector('.done').value =
            r.achieved || '';


        if (r.completed) {

            lastRow.querySelector('.subject').disabled = true;

            lastRow.querySelector('.given').disabled = true;

            lastRow.querySelector('.done').disabled = true;

            lastRow.lastElementChild.style.display = 'none';

        }


        updateSubjectOptions();

    });



    document.getElementById('addBtn').disabled = true;
document.getElementById('saveAllocatedBtn').disabled = true;

    document.querySelectorAll('.given,.subject')
        .forEach(x => {

            x.disabled = true;

        });


    saveStatus.innerText = '⏱️ Plan Saved';


    document.querySelectorAll('#rows tr').forEach(row => {
        row.lastElementChild.style.display = 'none';
    });


    const actionHeader =
        document.querySelector('th:last-child');

    if (actionHeader) {

        actionHeader.style.display = 'none';

    }




    calc();
}

function toggleHistory(date) {

    const wrapper = document.getElementById('historyDetailsWrapper');
    const panel = document.getElementById('historyDetails');
    const selected = document.getElementById(`detail-${date}`);

    if (selected) {
        wrapper.style.display = 'block';
        panel.innerHTML = selected.innerHTML;
    } else {
        wrapper.style.display = 'none';
        panel.innerHTML = '';
    }

}
window.toggleHistory = toggleHistory;

async function loadHistory() {

    let store = await getStore();

    historyTables.innerHTML = '';



    Object.keys(store)
        .sort()
        .reverse()
        .filter(date => date !== today)
        .slice(0, 8)
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

            store[date].data.forEach(r => {

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




            let success = alloc ? ((ach / alloc) * 100).toFixed(2) : 0;

            let remark = '🔴 Needs Improvement';

            if (success >= 85) {
                remark = '🟢 Excellent';
            } else if (success >= 70) {
                remark = '🟡 Good';
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

async function generateWeeklyReport() {

    const now = new Date();

    let store = await getStore();
    let alloc = 0;
    let ach = 0;

    for (let i = 7; i >= 1; i--) {

        let d = new Date(now);
        d.setDate(now.getDate() - i);

        let key =
            d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');

        if (store[key]) {
            store[key].data.forEach(r => {
                alloc += timeToMinutes(r.given);
                ach += timeToMinutes(r.achieved);
            });
        }
    }
}

async function generateMonthReports() {
    let store = await getStore();

    weekHistory.innerHTML = '';
    monthHistory.innerHTML = '';

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();


    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

    let calendarWeeks = [];
    let firstDate = new Date(year, month, 1);
    let lastDate = new Date(year, month + 1, 0);

    let firstSunday = new Date(firstDate);
    while (firstSunday.getDay() !== 0) {
        firstSunday.setDate(firstSunday.getDate() - 1);
    }

    let weekStart = new Date(firstSunday);

    while (weekStart <= lastDate) {
        let weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        calendarWeeks.push({
            start: new Date(weekStart),
            end: new Date(weekEnd),
            alloc: 0,
            ach: 0
        });

        weekStart.setDate(weekStart.getDate() + 7);
    }


    Object.keys(store).forEach(date => {

        // Parse YYYY-MM-DD safely
        const [y, m, day] = date.split('-').map(Number);
        const d = new Date(y, m - 1, day);

        d.setHours(0, 0, 0, 0);

        calendarWeeks.forEach(w => {

            const start = new Date(w.start);
            const end = new Date(w.end);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (d >= start && d <= end) {

                store[date].data.forEach(r => {

                    w.alloc += timeToMinutes(r.given);
                    w.ach += timeToMinutes(r.achieved);

                });

            }

        });

    });





    let visibleWeeks = [];

    calendarWeeks.forEach((w, index) => {

        if (!w.alloc && !w.ach) return;

        visibleWeeks.push({

            start: new Date(w.start),
            end: new Date(w.end),

            alloc: w.alloc,
            ach: w.ach,

            label: `${monthName} Week ${index + 1}`

        });

    });

    visibleWeeks.sort((a, b) => b.end - a.end);

    visibleWeeks = visibleWeeks.slice(0, 4);

    visibleWeeks.forEach(w => {

        let rate = w.alloc
            ? ((w.ach / w.alloc) * 100).toFixed(2)
            : 0;

        weekHistory.innerHTML += `

<div class="historyCard">

<div class="historyHeader">

📅 ${w.label}

<br>

${w.start.getDate()}
${w.start.toLocaleString('default', { month: 'short' })}

-

${w.end.getDate()}
${w.end.toLocaleString('default', { month: 'short' })}

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

</div>

`;

    });



    for (let m = 1; m <= 12; m++) {
        let target = new Date();
        target.setMonth(target.getMonth() - m);

        let alloc = 0, ach = 0;

        Object.keys(store).forEach(date => {
            let d = new Date(date);
            if (d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear()) {
                store[date].data.forEach(r => {
                    alloc += timeToMinutes(r.given);
                    ach += timeToMinutes(r.achieved);
                });
            }
        });

        if (!alloc && !ach) continue;

        let success = alloc ? ((ach / alloc) * 100).toFixed(2) : 0;
        let remark = '🔴 Needs Improvement';
        if (success >= 85) remark = '🟢 Excellent';
        else if (success >= 70) remark = '🟡 Good';

        monthHistory.innerHTML += `
<div class="monthPremium">

<div class="monthTitle">
📆 ${target.toLocaleString('default', { month: 'long' })} ${target.getFullYear()}
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
async function finalizeYesterday() {


    let store = await getStore();


    let d = new Date();

    d.setDate(d.getDate() - 1);



    let y =

        d.getFullYear()

        + '-' +

        String(d.getMonth() + 1)

            .padStart(2, '0')

        + '-' +

        String(d.getDate())

            .padStart(2, '0');



    if (!store[y]) return;



    let changed = false;



    store[y].data.forEach(r => {


        if (!r.completed) {


            r.completed = true;

            r.achieved = "00:00";


            changed = true;


        }


    });



    if (changed) {


        await set(

            ref(db, 'workTracker/' + y),

            store[y]

        );


    }



}
(async () => {


    await finalizeYesterday();

    await fillMissingDays();


    await loadToday();



    if (rows.children.length === 0) {

        addRow();

    }


    await loadHistory();

    await generateMonthReports();

    await generateWeeklyReport();

})();





document.addEventListener('input', (e) => {

    if (
        !e.target.classList.contains('given') &&
        !e.target.classList.contains('done')
    ) {
        return;
    }

    let digits = e.target.value.replace(/\D/g, '');

    if (digits === '') {
        e.target.value = '';
        calc();
        return;
    }

    // Keep only last 4 digits
    digits = digits.slice(-4);

    let padded = digits.padStart(4, '0');

    let hh = parseInt(padded.slice(0, 2), 10);
    let mm = parseInt(padded.slice(2, 4), 10);

    if (mm > 59) mm = 59;
    if (hh > 12) hh = 12;

    e.target.value =
        String(hh).padStart(2, '0') +
        ':' +
        String(mm).padStart(2, '0');

    calc();

});

document.addEventListener('input', (e) => {

    if (e.target.classList.contains('subject')) {

        let value = e.target.value;

        if (value.length > 0) {
            e.target.value =
                value.charAt(0).toUpperCase() +
                value.slice(1);
        }

    }

});

const subjects = [
    "Vocabulary",
    "History",
    "Geography",
    "English",
    "Odia",
    "Polity",
    "Economic",
    "Mathematics",
    "Reasoning",
    "Data Interpretation",
    "Environment",
    "Current Affairs",
    "Art and Culture",
    "Physics",
    "Chemistry",
    "Biology",
    "Static GK",
    "Odisha Gk",
    "Mock Tests"
];

function updateSubjectOptions() {

    const selects = document.querySelectorAll('.subject');

    const selected = [...selects]
        .map(s => s.value)
        .filter(Boolean);

    selects.forEach(select => {

        const current = select.value;

        select.innerHTML =
            '<option value="">Select Subject</option>';

        subjects.forEach(sub => {

            if (!selected.includes(sub) || sub === current) {

                select.innerHTML +=
                    `<option value="${sub}">${sub}</option>`;

            }

        });

        select.value = current;

    });

}
