import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDozQuMnS99TlHjntvEhUq-LScpY2Rl7SA",
    authDomain: "hitch-67dae.firebaseapp.com",
    projectId: "hitch-67dae",
    storageBucket: "hitch-67dae.firebasestorage.app",
    messagingSenderId: "603171590891",
    appId: "1:603171590891:web:730d74c4b6d3dcf64ca4ae",
    measurementId: "G-SDZ02NSK36"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); 

const logbutton = document.getElementById("logbutton");

logbutton.addEventListener("click", function(e){

e.preventDefault();

let email = document.getElementById("username");
let password = document.getElementById("password");

signInWithEmailAndPassword(auth, email.value, password.value)

.then((userCredential)=>{
window.location.href = "home.html";

})

.catch((error)=>{
alert("Wrong email or password");
console.log(error);
});

});