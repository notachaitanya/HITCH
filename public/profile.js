let dp=document.getElementById("dp");
dp.style.backgroundImage ="URL('https://i.pinimg.com/474x/4b/f3/b4/4bf3b4ac72260cb72a77d2a4f55967c6.jpg')";



import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as storageRef, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDozQuMnS99TlHjntvEhUq-LScpY2Rl7SA",
  authDomain: "hitch-67dae.firebaseapp.com",
  databaseURL: "https://hitch-67dae-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hitch-67dae",
  storageBucket: "hitch-67dae.firebasestorage.app",
  messagingSenderId: "603171590891",
  appId: "1:603171590891:web:730d74c4b6d3dcf64ca4ae"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

const pointsDisplay = document.getElementById("HitchPointsDisplay");
const returnedItemsCountDisplay = document.getElementById("returnedItemsCountDisplay");
const usernameDisplay = document.getElementById("usernameDisplay");
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadPoints(user.uid);
    } else {
        pointsDisplay.innerText = "Login first";
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snapshot = await get(ref(db, "users/" + user.uid));

        if (snapshot.exists()) {
            const data = snapshot.val();
            usernameDisplay.innerText = data.username;
        } else {
            usernameDisplay.innerText = "No username";
        }
    }
});

function loadPoints(userId) {

    const userRef = ref(db, `users/${userId}`);

    onValue(userRef, (x) => {
        if (x.exists()) {
            const data = x.val();

            const points = data.points || 0;

            pointsDisplay.innerText = points;
            returnedItemsCountDisplay.innerText = points/100;
        } else {
            pointsDisplay.innerText = 0;
        }
    });
}

window.addEventListener("DOMContentLoaded", () => {
    const page = window.location.pathname.split("/").pop();
    const icon = document.getElementById("profileicon");

    if (page === "profilePage.html" && icon) {
        icon.src = "images/profileSelected.svg";
    }
});

//--------------------logout--------------------


const logoutButton = document.getElementById("logoutContainer");

logoutButton.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            alert("Logged out successfully!");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
});