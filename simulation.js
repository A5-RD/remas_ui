document.addEventListener("DOMContentLoaded", function () {
    const fileExplorer = document.getElementById("file-explorer");
    const minimizeButton = document.getElementById("minimize-explorer");
    const fileList = document.getElementById("file-list");

    // Minimize/Expand File Explorer
    minimizeButton.addEventListener("click", function () {
        if (fileExplorer.classList.contains("minimized")) {
            fileExplorer.classList.remove("minimized");
            minimizeButton.textContent = "−";
        } else {
            fileExplorer.classList.add("minimized");
            minimizeButton.textContent = "+";
        }
    });

    // Fetch user files from Firebase Storage
    async function loadUserFiles() {
        fileList.innerHTML = "<li>Loading...</li>";

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                fileList.innerHTML = "<li>Please log in.</li>";
                return;
            }

            const storageRef = firebase.storage().ref(`users/${user.uid}/`);
            const files = await storageRef.listAll();

            fileList.innerHTML = "";
            if (files.items.length === 0) {
                fileList.innerHTML = "<li>No files found.</li>";
            } else {
                files.items.forEach(fileRef => {
                    const listItem = document.createElement("li");
                    listItem.textContent = fileRef.name;
                    listItem.addEventListener("click", () => {
                        console.log("Selected file:", fileRef.name);
                        // TODO: Load file into simulation
                    });
                    fileList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error("Error loading files:", error);
            fileList.innerHTML = "<li>Error loading files.</li>";
        }
    }

    // Ensure Firebase Auth is ready before fetching files
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadUserFiles();
        }
    });

    // Fullscreen Toggle
    document.getElementById("fullscreen-btn").addEventListener("click", function () {
        const simContainer = document.getElementById("simulation-container");
        if (!document.fullscreenElement) {
            simContainer.requestFullscreen().catch(err => {
                console.error("Fullscreen error:", err);
            });
        } else {
            document.exitFullscreen();
        }
    });
});
