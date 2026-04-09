//---------------------------------------firebase setup---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getDatabase, ref as dbRef, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const storage = getStorage(app);
const db = getDatabase(app);
const auth = getAuth(app);

console.log("Firebase connected");

//---------------------------------------ELEMENTS---------------------------
const dragdropsection = document.getElementById("dragdropsection");
const fileInput = document.getElementById("fileInput");
const imagepreview = document.getElementById("image-preview");

const locationInput = document.getElementById("location");
const categoryInput = document.getElementById("category");
const uploadButton = document.getElementById("imageuploadbutton");
const statusText = document.getElementById("statusText");

//---------------------------------------IMAGE PREVIEW---------------------------
fileInput.addEventListener("change", uploadImage);

function uploadImage() {
    let imgURL = URL.createObjectURL(fileInput.files[0]);
    imagepreview.style.backgroundImage = `url(${imgURL})`;
    imagepreview.textContent = "";
}

// drag & drop
dragdropsection.addEventListener("dragover", (e) => {
    e.preventDefault();
});

dragdropsection.addEventListener("drop", (e) => {
    e.preventDefault();
    fileInput.files = e.dataTransfer.files;
    uploadImage();
});

//---------------------------------------UPLOAD BUTTON---------------------------
uploadButton.addEventListener("click", uploadPost);

//---------------------------------------UPLOAD FUNCTION---------------------------
async function uploadPost() {

    const file = fileInput.files[0];
    const locationValue = locationInput.value;
    const categoryValue = categoryInput.value;

   
    if (!file || !locationValue || !categoryValue) {
        statusText.innerText = "Fill all fields";
        statusText.style.color = "red";
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        statusText.innerText = "Login first";
        statusText.style.color = "red";
        return;
    }

    // 🔥 show uploading instantly
    statusText.innerText = "Uploading...";
    statusText.style.color = "white";

    uploadButton.disabled = true;
    uploadButton.innerText = "Uploading...";

    try {
        // upload image
        const storageRef = ref(storage, "images/" + Date.now());
        const snapshot = await uploadBytes(storageRef, file);

        // get URL
        const url = await getDownloadURL(snapshot.ref);

        // save to DB
        await push(dbRef(db, "posts"), {
            imageURL: url,
            location: locationValue,
            category: categoryValue,
            userId: user.uid,
            createdAt: Date.now(),
            status: "active",
            pointsGiven: false
        });

        // success
        statusText.innerText = "Uploaded successfully";
        statusText.style.color = "lightgreen";

        resetForm();

    } catch (error) {
        console.error(error);

        // ❌ error
        statusText.innerText = "Upload failed ❌";
        statusText.style.color = "red";
    }

    // re-enable button
    uploadButton.disabled = false;
    uploadButton.innerText = "Upload";
}

//---------------------------------------RESET FORM---------------------------
function resetForm() {

    fileInput.value = "";

    imagepreview.style.backgroundImage = "";
    imagepreview.innerHTML = `
        <img id="dropsectionicon" src="images/uploadicon.png">
        <p id="dropspacetext">Left click to open fileManager or drag & drop the image</p>
    `;

    locationInput.value = "";
    categoryInput.value = "";
}