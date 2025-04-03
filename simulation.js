document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const storage = firebase.storage();
    const simContainer = document.getElementById("simulation-container");
    const fileList = document.getElementById("file-list");
    const rightPanel = document.getElementById("right-panel");
    const minimizePanelBtn = document.getElementById("minimize-panel");
    const fullscreenBtn = document.getElementById("fullscreen-btn");

    // Hide simulation until authentication is confirmed
    simContainer.style.display = "none";

    auth.onAuthStateChanged((user) => {
        if (!user) {
            console.log("No authenticated user. Redirecting to index.html.");
            window.location.href = "index.html";
        } else {
            console.log("User authenticated:", user.email);
            simContainer.style.display = "flex"; // Show simulation page
            loadUserFiles(user.email); // Load user files from Firebase Storage
        }
    });

    function loadUserFiles(email) {
        const storageRef = storage.ref(`users/${email}/files`);
        fileList.innerHTML = "<li>Loading files...</li>";

        storageRef.listAll()
            .then((result) => {
                if (result.items.length === 0) {
                    fileList.innerHTML = "<li>No files found.</li>";
                } else {
                    fileList.innerHTML = "";
                    result.items.forEach((fileRef) => {
                        fileRef.getDownloadURL().then((url) => {
                            const li = document.createElement("li");
                            li.textContent = fileRef.name;
                            li.onclick = () => window.open(url, "_blank");
                            fileList.appendChild(li);
                        });
                    });
                }
            })
            .catch((error) => {
                console.error("Error loading files:", error);
                fileList.innerHTML = "<li>Error loading files.</li>";
            });
    }

    // Minimize Right Panel
    minimizePanelBtn.addEventListener("click", function () {
        rightPanel.style.display = "none";
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener("click", function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
});
