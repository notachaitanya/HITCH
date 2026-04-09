//--------------------------------------- FIREBASE SETUP ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

console.log("Firebase connected");

//--------------------------------------- UI ---------------------------
const container = document.getElementById("cardsspace");
const searchInput = document.getElementById("searchbar");

//--------------------------------------- GLOBAL STATE ---------------------------
let allPosts = {};
let currentUser = null;

//--------------------------------------- AUTH ---------------------------
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadPosts();
    } else {
        container.innerHTML = "Please login";
    }
});

//--------------------------------------- LOAD POSTS ---------------------------
function loadPosts() {
    const postsRef = ref(db, "posts");

    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();

        if (data) {
            allPosts = data;
            displayPosts(allPosts);
        } else {
            container.innerHTML = `<div>No posts yet</div>`;
        }
    });
}

//--------------------------------------- DISPLAY POSTS ---------------------------
function displayPosts(data) {

    container.innerHTML = "";

    for (let id in data) {
        const post = data[id];

        //  hide returned posts
        if (post.status === "returned") continue;

        const isOwner = currentUser.uid === post.userId;

        const postDiv = document.createElement("div");
        postDiv.classList.add("card");

        postDiv.innerHTML = `
            <div class="menubutton">⋮</div>

            <div class="menuBox" style="display:none;">
                ${isOwner ? `<button class="deleteButton">Returned</button>` : ""}
            </div>

            <img class="lostimg" src="${post.imageURL}">
            
            <p class="tag">
                <span style="color: yellow;">FOUND AT :</span> ${post.location}
            </p>

            <p class="tag">
                <span style="color: cyan;">CATEGORY :</span> ${post.category}
            </p>

            <a href="messages.html?userId=${post.userId}">
                <img class="lostmessageicon" src="images/message.svg">
            </a>
        `;

        // MENU TOGGLE
        const menuBtn = postDiv.querySelector(".menubutton");
        const menuBox = postDiv.querySelector(".menuBox");

        menuBtn.addEventListener("click", () => {
            menuBox.style.display =
                menuBox.style.display === "flex" ? "none" : "flex";
        });

        // RETURN BUTTON
        const returnBtn = postDiv.querySelector(".deleteButton");

        if (returnBtn) {
            returnBtn.addEventListener("click", () => {
                markAsReturned(id, post);
            });
        }

        container.appendChild(postDiv);
    }
}

//--------------------------------------- RETURN SYSTEM ---------------------------
async function markAsReturned(postId, post) {

    
    if (post.pointsGiven) {
        alert("Already returned");
        return;
    }

    try {
        // 1. Update post status
        const postRef = ref(db, `posts/${postId}`);

        await update(postRef, {
            status: "returned",
            pointsGiven: true
        });

        // 2. Add 100 points
        await addPoints(post.userId);

        // 3. Delete image from storage
        if (post.imagePath) {
            const imgRef = storageRef(storage, post.imagePath);
            await deleteObject(imgRef);
        }

        alert("Marked as returned");

    } catch (error) {
        console.error(error);
        alert("Error updating");
    }
}

//--------------------------------------- ADD POINTS ---------------------------
async function addPoints(userId) {

    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    let currentPoints = 0;

    if (snapshot.exists()) {
        currentPoints = snapshot.val().points || 0;
    }

    await update(userRef, {
        points: currentPoints + 100 
    });
}

//--------------------------------------- SEARCH ---------------------------
searchInput.addEventListener("input", () => {

    const query = searchInput.value.toLowerCase();

    const filteredPosts = {};

    for (let id in allPosts) {
        const post = allPosts[id];

        if (post.status === "returned") continue;

        if (
            post.category.toLowerCase().includes(query) ||
            post.location.toLowerCase().includes(query)
        ) {
            filteredPosts[id] = post;
        }
    }

    if (Object.keys(filteredPosts).length === 0) {
        container.innerHTML = "No matching items";
    } else {
        displayPosts(filteredPosts);
    }
});