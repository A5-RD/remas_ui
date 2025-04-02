document.addEventListener("DOMContentLoaded", function () {
    // Firebase Config & Authentication
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html"; // Redirect if not logged in
        } else {
            loadUserFiles(user.email);
        }
    });

    // Full-Screen Toggle
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    fullscreenBtn.innerHTML = "⛶"; // Fullscreen icon only
    fullscreenBtn.addEventListener("click", function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error entering full-screen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Minimize Right Panel
    const rightPanel = document.getElementById("right-panel");
    const minimizePanelBtn = document.getElementById("minimize-panel");
    minimizePanelBtn.innerHTML = "➖"; // Only a minus symbol

    minimizePanelBtn.addEventListener("click", function () {
        if (rightPanel.classList.contains("minimized")) {
            rightPanel.classList.remove("minimized");
        } else {
            rightPanel.classList.add("minimized");
        }
        adjustLayout();
    });

    // Load Files from Firebase Storage
    function loadUserFiles(email) {
        const storageRef = firebase.storage().ref(`users/${email}/files`);
        const fileList = document.getElementById("file-list");
        fileList.innerHTML = ""; // Clear previous entries

        storageRef.listAll()
            .then(result => {
                result.items.forEach(fileRef => {
                    fileRef.getDownloadURL().then(url => {
                        const li = document.createElement("li");
                        li.textContent = fileRef.name;
                        li.onclick = () => window.open(url, "_blank");
                        fileList.appendChild(li);
                    });
                });
            })
            .catch(error => console.log("Error fetching files:", error));
    }

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

    adjustLayout();
});
