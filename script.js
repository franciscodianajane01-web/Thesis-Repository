// ===============================
// MOCK DATABASE (Initial Data)
// ===============================
let theses = [];

// ===============================
// BORROW STATISTICS
// ===============================
let borrowedCount = 0;
let borrowRecords = [];

// ===============================
// SEARCH STATISTICS (Most Searched Topics)
// ===============================
let searchStats = {};

// ===============================
// MOCK THESIS TEXTS FOR PLAGIARISM CHECK
// ===============================
const plagiarismCorpus = [
    {
        title: "Automation of Library Management System",
        department: "BSCS",
        text: "This study focuses on the design and development of an automated library management system that digitizes cataloging, borrowing, and returning of academic resources."
    },
    {
        title: "Crime Pattern Analysis Using Data Mining",
        department: "BSCRIM",
        text: "The research utilizes data mining techniques to identify crime patterns and trends, supporting law enforcement agencies in strategic decision making."
    },
    {
        title: "Blended Learning Approach in Senior High School",
        department: "Highschool",
        text: "This paper evaluates the effectiveness of a blended learning approach integrating online and face to face instruction in senior high school education."
    }
];

// ===============================
// SIDEBAR NAVIGATION
// ===============================
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(li => {
        li.classList.toggle('active', li.getAttribute('data-section') === sectionId);
    });
}

// ===============================
// SEARCH FUNCTION (Repository)
// ===============================
function searchThesis() {
    const input = document.getElementById("searchInput").value.toLowerCase().trim();
    const departmentFilter = document.getElementById("departmentFilter").value;
    const modulesDiv = document.getElementById("departmentModules");
    if (!modulesDiv) return;
    modulesDiv.innerHTML = "";

    if (input === "" && departmentFilter === "") {
        modulesDiv.innerHTML = "<p>Please enter a title, author, or year, or select a department.</p>";
        return;
    }

    if (input !== "") {
        searchStats[input] = (searchStats[input] || 0) + 1;
        updateSearchChart();
    }

    const filtered = theses.filter(t => {
        const matchesInput = t.title.toLowerCase().includes(input) || t.author.toLowerCase().includes(input) || t.year.toLowerCase().includes(input);
        const matchesDepartment = departmentFilter === "" || t.department === departmentFilter;
        return matchesInput && matchesDepartment;
    });

    if (filtered.length === 0) {
        modulesDiv.innerHTML = "<p>No results found.</p>";
        return;
    }

    filtered.forEach(t => {
        const thesisDiv = document.createElement("div");
        thesisDiv.style.background = "white";
        thesisDiv.style.padding = "15px";
        thesisDiv.style.margin = "10px 0";
        thesisDiv.style.borderRadius = "8px";
        thesisDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";

        const thesisIdx = theses.indexOf(t);
        const fileList = getThesisFiles(t);
        const fileButtons = fileList.map((f, fi) => `
            <button onclick="viewFile(${thesisIdx}, ${fi})">View</button>
            <button onclick="downloadFile(${thesisIdx}, ${fi})">Download</button>
        `).join(" ");

        thesisDiv.innerHTML = `
            <strong>${t.title}</strong><br>
            Author: ${t.author}<br>
            Year: ${t.year}<br>
            Department: ${t.department}<br><br>
            ${fileButtons}
        `;
        modulesDiv.appendChild(thesisDiv);
    });
}

// ===============================
// TITLE CHECK
// ===============================
function searchTitle() {
    const input = document.getElementById('thesisTitle').value.toLowerCase().trim();
    const result = document.getElementById('titleResult');
    result.innerHTML = "";

    if (!input) {
        result.textContent = "Please enter a title to search.";
        result.style.color = "black";
        return;
    }

    const matches = theses.filter(t => t.title.toLowerCase().includes(input));
    if (matches.length > 0) {
        result.style.color = "red";
        result.innerHTML = "⚠️ Found similar title(s):<br>";
        matches.forEach(t => {
            const thesisIdx = theses.indexOf(t);
            const fileList = getThesisFiles(t);
            const fileButtons = fileList.map((f, fi) => `
                <button onclick="viewFile(${thesisIdx}, ${fi})">View</button>
                <button onclick="downloadFile(${thesisIdx}, ${fi})">Download</button>
            `).join(" ");
            result.innerHTML += `
                <div style="background:white;padding:10px;margin:5px 0;border-radius:6px;box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <strong>${t.title}</strong><br>
                    Author: ${t.author}<br>
                    Year: ${t.year}<br>
                    Department: ${t.department}<br>
                    ${fileButtons}
                </div>
            `;
        });
    } else {
        result.style.color = "green";
        result.textContent = "✅ No similar titles found in the repository.";
    }
}

// Trigger Enter key search
document.getElementById('thesisTitle')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchTitle();
    }
});

// ===============================
// TITLE SIMILARITY DETECTION
// ===============================
function normalizeText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(word => word.length > 2);
}

function jaccardSimilarity(wordsA, wordsB) {
    if (!wordsA.length || !wordsB.length) return 0;
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    let intersection = 0;
    setA.forEach(word => { if (setB.has(word)) intersection++; });
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function checkTitleSimilarity() {
    const inputEl = document.getElementById("similarTitleInput");
    const resultPara = document.getElementById("plagResult");
    if (!inputEl || !resultPara) return;

    const rawTitle = inputEl.value.trim();
    resultPara.innerHTML = "";
    if (!rawTitle) { resultPara.textContent = "Please enter a thesis title."; return; }
    if (!theses.length) { resultPara.textContent = "There are no theses in the repository yet."; return; }

    const inputWords = normalizeText(rawTitle);
    if (!inputWords.length) { resultPara.textContent = "Please enter a more descriptive title."; return; }

    let bestMatch = null;
    let bestScore = 0;
    theses.forEach(t => {
        const titleWords = normalizeText(t.title || "");
        if (!titleWords.length) return;
        const score = jaccardSimilarity(inputWords, titleWords);
        if (score > bestScore) { bestScore = score; bestMatch = t; }
    });

    if (!bestMatch) {
        resultPara.style.color = "green";
        resultPara.textContent = "No similar titles found in the repository.";
        return;
    }

    const percent = (bestScore * 100).toFixed(2);
    let assessment;
    if (bestScore >= 0.7) { assessment = "High similarity (title is very similar)"; resultPara.style.color = "red"; }
    else if (bestScore >= 0.4) { assessment = "Moderate similarity (consider revising the title)"; resultPara.style.color = "orange"; }
    else { assessment = "Low similarity (title looks unique)"; resultPara.style.color = "green"; }

    resultPara.innerHTML = `
        <strong>Similarity result:</strong><br>
        Highest similarity: ${percent}%<br>
        Assessment: ${assessment}<br><br>
        Closest title in repository:<br>
        <strong>${bestMatch.title}</strong><br>
        Author: ${bestMatch.author}<br>
        Year: ${bestMatch.year}<br>
        Department: ${bestMatch.department}
    `;
}

// ===============================
// FILE VIEW/DOWNLOAD
// ===============================
function getThesisFiles(t) {
    if (Array.isArray(t.files) && t.files.length) return t.files;
    if (t.file && t.file.trim()) return t.file.split(",").map(name => ({ name: name.trim(), data: null }));
    return [];
}

function viewFile(thesisIndex, fileIndex) {
    const thesis = theses[thesisIndex];
    if (!thesis) return;
    const fileList = getThesisFiles(thesis);
    const fileEntry = fileList[fileIndex];
    if (!fileEntry) return;

    if (fileEntry.data) {
        const blob = dataUrlToBlob(fileEntry.data);
        const url = URL.createObjectURL(blob);
        const win = window.open("", "_blank");
        if (!win) return;

        const mime = blob.type || "";
        const tag = mime === "application/pdf" ? "embed" : mime.startsWith("image/") ? "img" : "iframe";
        const attrs = tag === "img" ? `src="${url}" alt="View"` : `src="${url}"`;

        win.document.write(`
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileEntry.name}</title>
            <style>body{margin:0;background:#1a1a1a;display:flex;justify-content:center;align-items:center;min-height:100vh}
            ${tag}{max-width:100%;max-height:100vh;object-fit:contain} embed,iframe{width:100%;height:100vh;border:0}</style></head>
            <body><${tag} ${attrs}></${tag}></body></html>
        `);
        win.document.close();
        setTimeout(() => URL.revokeObjectURL(url), 120000);
    } else { window.open(fileEntry.name, "_blank"); }
}

function downloadFile(thesisIndex, fileIndex) {
    const thesis = theses[thesisIndex];
    if (!thesis) return;
    const fileList = getThesisFiles(thesis);
    const fileEntry = fileList[fileIndex];
    if (!fileEntry) return;

    if (!fileEntry.data) { alert("Re-upload thesis to enable download."); return; }

    const blob = dataUrlToBlob(fileEntry.data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileEntry.name || "thesis-file";
    a.click();
    URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

// ===============================
// UPLOAD SYSTEM
// ===============================
document.getElementById("uploadForm")?.addEventListener("submit", function(e){
    e.preventDefault();
    const titleInput = this.querySelector('input[placeholder="Thesis Title"]');
    const authorInput = this.querySelector('input[placeholder="Author Name"]');
    const yearInput = this.querySelector('input[placeholder="Year"]');
    const department = document.getElementById("uploadDepartment")?.value || "Unassigned";
    const fileInput = this.querySelector('input[type="file"]');

    if (!fileInput.files.length) {
        document.getElementById("uploadMessage").innerText = "Please attach at least one file.";
        return;
    }

    const msgEl = document.getElementById("uploadMessage");
    msgEl.innerText = "Uploading...";

    const readFiles = Array.from(fileInput.files).map(f => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: f.name, data: reader.result });
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(f);
    }));

    Promise.all(readFiles).then(files => {
        theses.push({
            title: titleInput.value,
            author: authorInput.value,
            year: yearInput.value,
            department,
            files
        });
        updateDashboardCount();
        displayDepartments();
        updateDepartmentChart();
        titleInput.value = "";
        authorInput.value = "";
        yearInput.value = "";
        fileInput.value = "";
        document.getElementById("uploadDepartment").value = "";
        msgEl.innerText = "✅ Thesis uploaded successfully!";
    }).catch(() => { msgEl.innerText = "❌ Failed to read file(s)."; });
});

// ===============================
// DASHBOARD TOTAL UPDATE
// ===============================
function updateDashboardCount() {
    const totalCard = document.querySelector(".card-value");
    if (totalCard) totalCard.innerText = theses.length;
}
function updateBorrowCount() {
    const borrowCard = document.getElementById("borrowedCount");
    if (borrowCard) borrowCard.innerText = borrowedCount;
}



// ===============================
// DISPLAY DEPARTMENTS & THESIS
// ===============================
function displayDepartments() {
    const modulesDiv = document.getElementById("departmentModules");
    if (!modulesDiv) return;
    modulesDiv.innerHTML = "";

    const departments = ["Highschool", "BSCS", "BSCRIM", "BSE", "BSBA", "BSHM"];
    departments.forEach(dept => {
        const deptTheses = theses.filter(t => t.department === dept);
        const deptDiv = document.createElement("div");
        deptDiv.style.flex = "1 1 30%";
        deptDiv.style.background = "#f9f9f9";
        deptDiv.style.padding = "15px";
        deptDiv.style.borderRadius = "8px";
        deptDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
        deptDiv.style.cursor = "pointer";
        deptDiv.innerHTML = `<h3>📁 ${dept}</h3><p>${deptTheses.length} Thesis Uploaded</p>`;
        deptDiv.addEventListener("click", () => showDepartmentTheses(dept));
        modulesDiv.appendChild(deptDiv);
    });
}

function showDepartmentTheses(department) {
    const modulesDiv = document.getElementById("departmentModules");
    if (!modulesDiv) return;
    modulesDiv.innerHTML = "";

    const deptTheses = theses.filter(t => t.department === department);
    if (!deptTheses.length) { modulesDiv.innerHTML = "<p>No theses uploaded in this department.</p>"; return; }

    deptTheses.forEach(t => {
        const thesisDiv = document.createElement("div");
        thesisDiv.style.background = "white";
        thesisDiv.style.padding = "15px";
        thesisDiv.style.margin = "10px 0";
        thesisDiv.style.borderRadius = "8px";
        thesisDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
        const fileList = getThesisFiles(t);
        const fileButtons = fileList.map((f, fi) => `
            <button onclick="viewFile(${theses.indexOf(t)}, ${fi})">View</button>
            <button onclick="downloadFile(${theses.indexOf(t)}, ${fi})">Download</button>
        `).join(" ");
        thesisDiv.innerHTML = `<strong>${t.title}</strong><br>Author: ${t.author}<br>Year: ${t.year}<br>${fileButtons}`;
        modulesDiv.appendChild(thesisDiv);
    });

    const backBtn = document.createElement("button");
    backBtn.innerText = "⬅ Back to Departments";
    backBtn.style.marginTop = "15px";
    backBtn.addEventListener("click", displayDepartments);
    modulesDiv.appendChild(backBtn);
}


// ===============================
// INITIALIZATION ON PAGE LOAD
// ===============================
window.addEventListener("DOMContentLoaded", () => {
    displayDepartments();
    updateDashboardCount();
    updateBorrowCount();
    updateDepartmentChart();
});

// ===============================
// DYNAMIC CHARTS
// ===============================
let departmentChart, searchChart;

function updateDepartmentChart() {
    const ctx = document.getElementById("departmentChart");
    if (!ctx) return;

    const departments = ["Highschool", "BSCS", "BSCRIM", "BSE", "BSBA", "BSHM"];
    const counts = departments.map(dep => theses.filter(t => t.department === dep).length);

    if (departmentChart) departmentChart.destroy();
    departmentChart = new Chart(ctx, {
        type: "bar",
        data: { labels: departments, datasets: [{ label: "Uploaded Theses", data: counts, backgroundColor: "#2563eb", borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function updateSearchChart() {
    const ctx = document.getElementById("searchChart");
    if (!ctx) return;
    const entries = Object.entries(searchStats);
    if (!entries.length) { if (searchChart) { searchChart.destroy(); searchChart=null; } ctx.getContext("2d").clearRect(0,0,ctx.width,ctx.height); return; }

    const sorted = entries.sort((a,b)=>b[1]-a[1]).slice(0,8);
    const labels = sorted.map(([term])=>term);
    const data = sorted.map(([,count])=>count);
    const colors = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#22c55e","#6366f1"];

    if (searchChart) searchChart.destroy();
    searchChart = new Chart(ctx, { type:"pie", data:{labels,datasets:[{label:"Search Count", data, backgroundColor: colors}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, position:"bottom"}}} });
}

// ===============================
// BORROW BOOK & GENERATE QR
// ===============================
function borrowBook() {
    const borrower = document.getElementById("borrowerName").value.trim();
    const title = document.getElementById("qrTitleInput").value.trim();
    const borrowedDate = document.getElementById("borrowDate").value || new Date().toLocaleDateString();
    const returnDate = document.getElementById("returnDate").value;

    if (!borrower || !title || !returnDate) {
        alert("Please fill in all fields including return date.");
        return;
    }

    const thesis = theses.find(t => t.title === title);
    if (!thesis) {
        alert("Thesis not found in the repository.");
        return;
    }

    const borrowID = "BR-" + Date.now(); // unique borrow ID
    const record = {
        id: borrowID,
        borrower,
        title,
        borrowedDate,
        returnDate,
        status: "Borrowed"
    };

    borrowRecords.push(record);
    borrowedCount++;
    updateBorrowCount();

    generateBorrowQR(record);
    alert(`✅ ${thesis.title} borrowed by ${borrower}`);
}

// ===============================
// GENERATE QR
// ===============================
function generateBorrowQR(record) {
    const qrDiv = document.getElementById("qrDisplay");
    qrDiv.innerHTML = ""; // clear previous

    const qrData = JSON.stringify(record);
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    qrDiv.innerHTML = `
        <div class="qr-card" style="text-align:center; padding:20px; border:1px solid #ccc; display:inline-block; border-radius:10px;">
            <h3>${record.title}</h3>
            <p><strong>Borrower:</strong> ${record.borrower}</p>
            <p><strong>Borrowed Date:</strong> ${record.borrowedDate}</p>
            <p><strong>Return Date:</strong> ${record.returnDate}</p>
            <img src="${qrURL}" alt="QR Code" style="width:300px; height:300px; margin-top:10px;">
            <p>Status: ${record.status}</p>
        </div>
    `;
}

// ===============================
// PRINT QR (includes QR image)
// ===============================
function printQR() {
    const qrDiv = document.getElementById("qrDisplay");
    if (!qrDiv || !qrDiv.innerHTML.trim()) {
        alert("Generate a QR code first.");
        return;
    }

    const cardHTML = qrDiv.innerHTML; // grab the QR card HTML
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
        <head>
            <title>Print QR</title>
            <style>
                body { font-family: Arial, sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; }
                .qr-card { text-align:center; padding:20px; border:1px solid #ccc; border-radius:10px; }
                img { width:300px; height:300px; margin-top:10px; }
                h3 { margin-bottom:10px; }
            </style>
        </head>
        <body>
            ${cardHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}