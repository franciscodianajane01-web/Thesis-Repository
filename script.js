// ===============================
// MOCK DATABASE (Initial Data)
// ===============================
let theses = [];

// ===============================
// SIDEBAR NAVIGATION
// ===============================
function showSection(sectionId) {
    document.querySelectorAll('.content-section')
        .forEach(sec => sec.classList.remove('active'));

    document.getElementById(sectionId)
        .classList.add('active');
}

// ===============================
// SEARCH FUNCTION (Repository)
// ===============================
function searchThesis() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const resultsDiv = document.getElementById("results");

    if (!resultsDiv) return;

    resultsDiv.innerHTML = "";

    const filtered = theses.filter(t =>
        t.title.toLowerCase().includes(input)
    );

    if (filtered.length === 0) {
        resultsDiv.innerHTML = "<p>No results found.</p>";
        return;
    }

    filtered.forEach(t => {
        resultsDiv.innerHTML += `
            <div style="background:white;padding:15px;margin:10px 0;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <strong>${t.title}</strong>
                <p>Author: ${t.author}</p>
                <p>Department: ${t.department}</p>
                <p>Year: ${t.year}</p>
            </div>
        `;
    });
}

// ===============================
// TITLE CHECK
// ===============================
function searchTitle() {
    const input = document.getElementById('thesisTitle').value.toLowerCase().trim();
    const result = document.getElementById('titleResult');

    if (!input) {
        result.textContent = "Please enter a title to search.";
        return;
    }

    const matches = theses.filter(t =>
        t.title.toLowerCase().includes(input)
    );

    if (matches.length > 0) {
        result.innerHTML = `⚠️ Found similar titles:<br> - ${matches.map(t => t.title).join('<br> - ')}`;
        result.style.color = "red";
    } else {
        result.textContent = "✅ No similar titles found.";
        result.style.color = "green";
    }
}

// ===============================
// FILE NAME DISPLAY
// ===============================
const fileInput = document.getElementById('plagFile');
const fileNameSpan = document.getElementById('fileName');

if (fileInput) {
    fileInput.addEventListener('change', function() {
        fileNameSpan.textContent =
            fileInput.files.length > 0 ? fileInput.files[0].name : "No file chosen";
    });
}

// ===============================
// MOCK QR GENERATOR
// ===============================
function generateQR() {
    document.getElementById("qrDisplay").innerHTML =
        "<img src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ThesisBorrowID123'>";
}

// ===============================
// UPLOAD SYSTEM
// ===============================
document.getElementById("uploadForm").addEventListener("submit", function(e){
    e.preventDefault();

    const title = this.querySelector('input[placeholder="Thesis Title"]').value;
    const author = this.querySelector('input[placeholder="Author Name"]').value;
    const year = this.querySelector('input[placeholder="Year"]').value;
    const department = document.getElementById("uploadDepartment")?.value || "Unassigned";

    const fileInput = this.querySelector('input[type="file"]');
    const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : "No File";

    theses.push({
        title,
        author,
        year,
        department,
        file: fileName
    });

    document.getElementById("uploadMessage").innerText =
        "✅ Thesis uploaded successfully!";

    updateDashboardCount();
    displayDepartments();
    updateDepartmentChart();

    this.reset();
});

// ===============================
// DASHBOARD TOTAL UPDATE
// ===============================
function updateDashboardCount() {
    const totalCard = document.querySelector(".card p");
    if (totalCard) {
        totalCard.innerText = theses.length;
    }
}

// ===============================
// DISPLAY DEPARTMENTS
// ===============================
function displayDepartments() {
    const modulesDiv = document.getElementById("departmentModules");
    if (!modulesDiv) return;

    modulesDiv.innerHTML = "";

    const departments = ["Highschool", "BCCS", "BSCRIM", "BSE", "BSBA", "BSHM"];

    departments.forEach(dept => {
        const deptTheses = theses.filter(t => t.department === dept);

        const deptDiv = document.createElement("div");
        deptDiv.style.flex = "1 1 30%";
        deptDiv.style.background = "#f9f9f9";
        deptDiv.style.padding = "15px";
        deptDiv.style.borderRadius = "8px";
        deptDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";

        deptDiv.innerHTML = `<h3>${dept}</h3>`;

        if (deptTheses.length === 0) {
            deptDiv.innerHTML += "<p>No theses uploaded.</p>";
        } else {
            deptTheses.forEach(t => {
                deptDiv.innerHTML += `
                    <div style="margin-bottom:10px;">
                        <strong>${t.title}</strong><br>
                        Author: ${t.author}<br>
                        File: ${t.file}
                    </div>
                `;
            });
        }

        modulesDiv.appendChild(deptDiv);
    });
}

// ===============================
// DYNAMIC CHART
// ===============================
let departmentChart;

function updateDepartmentChart() {

    const departments = ["Highschool", "BCCS", "BSCRIM", "BSE", "BSBA", "BSHM"];

    const counts = departments.map(dep =>
        theses.filter(t => t.department === dep).length
    );

    const ctx = document.getElementById("departmentChart");
    if (!ctx) return;

    if (departmentChart) {
        departmentChart.destroy();
    }

    departmentChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: departments,
            datasets: [{
                label: "Uploaded Theses",
                data: counts,
                backgroundColor: "#2563eb",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ===============================
// INITIAL LOAD
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    updateDashboardCount();
    displayDepartments();
    updateDepartmentChart();
});