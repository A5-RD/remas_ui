document.addEventListener("DOMContentLoaded", function () {
    // Ensure the fade-in animation is visible
    document.getElementById("simulation-container").classList.add("fade-in");
});

// Handle tab selection
function selectTab(tab) {
    console.log("Selected tab:", tab);
    // Add logic for changing simulation modes
}

// Toggle fullscreen
function toggleFullscreen() {
    let element = document.documentElement;
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
            console.log("Error attempting to enable full-screen mode:", err);
        });
    } else {
        document.exitFullscreen();
    }
}
