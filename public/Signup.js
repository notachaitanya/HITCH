//--------------------------- firebase setup ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import { 
    getDatabase, 
    ref, 
    set 
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDozQuMnS99TlHjntvEhUq-LScpY2Rl7SA",
    authDomain: "hitch-67dae.firebaseapp.com",
    projectId: "hitch-67dae",
    storageBucket: "hitch-67dae.firebasestorage.app",
    messagingSenderId: "603171590891",
    appId: "1:603171590891:web:730d74c4b6d3dcf64ca4ae",
    measurementId: "G-SDZ02NSK36",
    databaseURL: "https://hitch-67dae-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Init
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

//--------------------------- inputs ---------------------------
const Semail = document.getElementById("Signup-username");
const Spass = document.getElementById("Signup-password");
const usernameInput = document.getElementById("username");

const submit = document.getElementById("SignupButton");

//--------------------------- signup logic ---------------------------
submit.addEventListener("click", function(e) {
    e.preventDefault();

    const email = Semail.value.trim();
    const password = Spass.value.trim();
    const username = usernameInput.value.trim();

    // VALIDATION 1: email domain
    if (!email.endsWith("@klh.edu.in")) {
        alert("Only @klh.edu.in emails are allowed!");
        return;
    }
    if(password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
    }

    //  VALIDATION 2: username empty check
    if (username === "") {
        alert("Username cannot be empty!");
        return;
    }

    // CREATE USER
    createUserWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
    const user = userCredential.user;


    set(ref(db, "users/" + user.uid), {
        username: username,
        email: email
    })
    .then(() => {
        alert("Signup successful! Please login.");
        window.location.href = "index.html";
    })
    .catch((error) => {
        console.error("DB Error:", error);
    });

})
.catch((error) => {
    console.error("Auth Error:", error);

    if (error.code === "auth/weak-password") {
        alert("Password must be at least 6 characters!");
    } else if (error.code === "auth/email-already-in-use") {
        alert("Email already registered!");
    } else {
        alert(error.message);
    }
});
});