document.addEventListener("DOMContentLoaded", function () {
    const auth = firebase.auth();
    const storage = firebase.storage();
    const simContainer = document.getElementById("simulation-container");
    const fileList = document.getElementById("file-list");
    const rightPanel = document.getElementById("right-panel");
    const minimizePanelBtn = document.getElementById("minimize-panel");
    const fullscreenBtn = document.getElementById("fullscreen-btn");

    // Hide everything initially
    simContainer.classList.add("hidden");

    // Check if user is authenticated before loading anything
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "index.html";  // Redirect to login
        } else {
            console.log("User authenticated:", user.email);
            simContainer.classList.remove("hidden"); // Show simulation page
            loadUserFiles(user.email); // Load user files
        }
    });

    function loadUserFiles(email) {
        const storageRef = storage.ref(`users/${email}/files`);
        fileList.innerHTML = "<li>Loading files...</li>";

        storageRef.listAll()
            .then((result) => {
                fileList.innerHTML = "";
                if (result.items.length === 0) {
                    fileList.innerHTML = "<li>No files found.</li>";
                } else {
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
        rightPanel.classList.toggle("hidden");
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
