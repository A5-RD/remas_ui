document.addEventListener("DOMContentLoaded", function () {
    const rightPanel = document.getElementById("right-panel");
    const fileExplorer = document.getElementById("file-explorer");
    const minimizePanelBtn = document.getElementById("minimize-panel");
    const minimizeExplorerBtn = document.getElementById("minimize-explorer");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    let isFullscreen = false;

    // Minimize or restore the right panel
    minimizePanelBtn.addEventListener("click", function () {
        if (rightPanel.classList.contains("minimized")) {
            rightPanel.classList.remove("minimized");
            minimizePanelBtn.textContent = "−"; // Change to minus when expanded
        } else {
            rightPanel.classList.add("minimized");
            minimizePanelBtn.textContent = "+"; // Change to plus when minimized
        }
    });

    // Minimize or restore the file explorer within the panel
    minimizeExplorerBtn.addEventListener("click", function () {
        if (fileExplorer.classList.contains("minimized")) {
            fileExplorer.classList.remove("minimized");
            minimizeExplorerBtn.textContent = "−";
        } else {
            fileExplorer.classList.add("minimized");
            minimizeExplorerBtn.textContent = "+";
        }
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener("click", function () {
        if (!isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
            isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            isFullscreen = false;
        }
    });

    // Resizable Right Panel
    rightPanel.addEventListener("mousedown", function (e) {
        if (e.offsetX < 8) { // Check if mouse is near the left edge of the panel
            e.preventDefault();
            document.addEventListener("mousemove", resizeRightPanel);
            document.addEventListener("mouseup", stopResizing);
        }
    });

    function resizeRightPanel(e) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
            rightPanel.style.width = newWidth + "px";
        }
    }

    function stopResizing() {
        document.removeEventListener("mousemove", resizeRightPanel);
        document.removeEventListener("mouseup", stopResizing);
    }

    // Resizable File Explorer
    fileExplorer.addEventListener("mousedown", function (e) {
        if (e.offsetY < 8) { // Check if mouse is near the top edge of the file explorer
            e.preventDefault();
            document.addEventListener("mousemove", resizeFileExplorer);
            document.addEventListener("mouseup", stopResizingFileExplorer);
        }
    });

    function resizeFileExplorer(e) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= 150 && newHeight <= 600) {
            fileExplorer.style.height = newHeight + "px";
        }
    }

    function stopResizingFileExplorer() {
        document.removeEventListener("mousemove", resizeFileExplorer);
        document.removeEventListener("mouseup", stopResizingFileExplorer);
    }

    // Simulate File Loading Process
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "<p>Loading files...</p>";

    setTimeout(() => {
        fileList.innerHTML = "";
        const files = ["file1.txt", "file2.txt", "file3.txt"];
        files.forEach(file => {
            const li = document.createElement("li");
            li.textContent = file;
            fileList.appendChild(li);
        });
    }, 2000);
});
