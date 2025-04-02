document.addEventListener("DOMContentLoaded", function () {
    // Full-Screen Toggle
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    fullscreenBtn.addEventListener("click", function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Minimize Right Panel
    const rightPanel = document.getElementById("right-panel");
    const minimizePanelBtn = document.getElementById("minimize-panel");

    minimizePanelBtn.addEventListener("click", function () {
        if (rightPanel.classList.contains("minimized")) {
            rightPanel.classList.remove("minimized");
        } else {
            rightPanel.classList.add("minimized");
        }
        adjustLayout();
    });

    // Minimize File Explorer
    const fileExplorer = document.getElementById("file-explorer");
    const fileExplorerToggle = document.createElement("button");
    fileExplorerToggle.innerText = "▼"; // Collapse/Expand Icon
    fileExplorerToggle.id = "toggle-file-explorer";
    fileExplorerToggle.onclick = function () {
        if (fileExplorer.classList.contains("minimized")) {
            fileExplorer.classList.remove("minimized");
            fileExplorer.style.height = "300px";
            fileExplorerToggle.innerText = "▼";
        } else {
            fileExplorer.classList.add("minimized");
            fileExplorer.style.height = "40px";
            fileExplorerToggle.innerText = "▲";
        }
    };
    fileExplorer.prepend(fileExplorerToggle);

    // Adjust Layout When Panel is Minimized
    function adjustLayout() {
        if (rightPanel.classList.contains("minimized")) {
            rightPanel.style.width = "0px";
            document.getElementById("simulation-area").style.width = "100vw";
        } else {
            rightPanel.style.width = "300px";
            document.getElementById("simulation-area").style.width = "calc(100vw - 300px)";
        }
    }

    // Load Files into File Explorer
    function loadFiles() {
        const fileList = document.getElementById("file-list");
        fileList.innerHTML = ""; // Clear previous files
        const files = ["file1.txt", "file2.json", "script.py"]; // Example file names

        files.forEach(file => {
            const li = document.createElement("li");
            li.textContent = file;
            li.onclick = () => alert(`Opening ${file}`);
            fileList.appendChild(li);
        });
    }

    loadFiles();
    adjustLayout();
});
