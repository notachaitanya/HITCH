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
//compression of image 
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                
                // max width 800px
                const maxWidth = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                
                // 0.7 = 70% quality, good balance
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, "image/jpeg", 0.7);
            };
        };
    });
}
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

    
    statusText.innerText = "Uploading...";
    statusText.style.color = "white";

    uploadButton.disabled = true;
    uploadButton.innerText = "Uploading...";

    try {
    const compressedFile = await compressImage(file);
    const storageRef = ref(storage, "images/" + Date.now());
    const snapshot = await uploadBytes(storageRef, compressedFile);
    const url = await getDownloadURL(snapshot.ref);

    await push(dbRef(db, "posts"), {
        imageURL: url,
        location: locationValue,
        category: categoryValue,
        userId: user.uid,
        createdAt: Date.now(),
        status: "active",
        pointsGiven: false
    });

    statusText.innerText = "Uploaded successfully";
    showToast("Uploaded successfully");
    statusText.style.color = "lightgreen";
    resetForm();

} catch (error) {
    console.error(error);
    statusText.innerText = "Upload failed ❌";
    statusText.style.color = "red";
}


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

window.addEventListener("DOMContentLoaded", () => {
    const page = window.location.pathname.split("/").pop();
    const icon = document.getElementById("uploadicon");

    if (page === "uploadPage.html" && icon) {
        icon.src = "images/plusSelected.svg";
    }
});

function showToast(message) {
    const toast = document.getElementById("toast");
    const overlay = document.getElementById("overlay");

    toast.innerText = message;

    toast.classList.add("active");
    overlay.classList.add("active");

    setTimeout(() => {
        toast.classList.remove("active");
        overlay.classList.remove("active");
    }, 2000); // 1.2 sec
}