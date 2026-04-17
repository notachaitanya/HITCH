//-------------------------------- FIREBASE ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    get,
    onValue,
    onChildAdded,
    off,
    update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

//-------------------------------- GLOBAL ---------------------------
let currentUserId = null;
let conversationId = null;
let currentListener = null;
let userCache = {};

const params = new URLSearchParams(window.location.search);
const otherUserFromPost = params.get("userId");

//-------------------------------- GET USERNAME ---------------------------
async function getUsername(uid) {
    if (userCache[uid]) return userCache[uid];
    const snapshot = await get(ref(db, "users/" + uid));
    let name = snapshot.exists() ? snapshot.val().username : "Unknown";
    userCache[uid] = name;
    return name;
}

//-------------------------------- AUTH ---------------------------
onAuthStateChanged(auth, (user) => {
    if (!user) return;
    currentUserId = user.uid;
    setupMessageContainer();
    loadChatList();
    if (otherUserFromPost) startChatFromPost(otherUserFromPost);
});

function setupMessageContainer() {
    const right = document.getElementById("rightPannel");
    let msgBox = document.getElementById("chatMessages");
    if (!msgBox) {
        msgBox = document.createElement("div");
        msgBox.id = "chatMessages";
        msgBox.style.cssText = "flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding: 10px;";
        const inputForm = document.getElementById("chatInputForm");
        right.insertBefore(msgBox, inputForm);
    }
}

//-------------------------------- CREATE / FIND CHAT ---------------------------
async function startChatFromPost(otherUserId) {
    if (currentUserId === otherUserId) return;

    const convoRef = ref(db, "conversations");
    const snapshot = await get(convoRef);
    let foundId = null;

    if (snapshot.exists()) {
        const data = snapshot.val();
        for (let id in data) {
            const users = data[id].users;
            if (users && users[currentUserId] && users[otherUserId]) {
                foundId = id;
                break;
            }
        }
    }

    if (foundId) {
        conversationId = foundId;
        openChatUI(otherUserId);
    } else {
        const newConvoRef = push(convoRef);
        const now = Date.now();
        await set(newConvoRef, {
            users: { [currentUserId]: true, [otherUserId]: true },
            lastTime: now 
        });
        conversationId = newConvoRef.key;
        openChatUI(otherUserId);
    }
}

//-------------------------------- LOAD CHAT LIST---------------------------
async function loadChatList() {
    const chatList = document.getElementById("chatList");
    
   
    onValue(ref(db, "conversations"), async (snapshot) => {
        chatList.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            chatList.innerHTML = "<div style='color:white; margin:20px;'>No chats yet</div>";
            return;
        }

        let convoArray = [];
        for (let id in data) {
            if (data[id].users && data[id].users[currentUserId]) {
                const otherUser = Object.keys(data[id].users).find(uid => uid !== currentUserId);
                convoArray.push({
                    id,
                    otherUser,
                    lastTime: data[id].lastTime || 0
                });
            }
        }

        
        convoArray.sort((a, b) => b.lastTime - a.lastTime);

        for (const chat of convoArray) {
            const div = document.createElement("div");
            div.style.cssText = "padding: 15px; color: white; cursor: pointer; border-bottom: 1px solid gray;";
            const username = await getUsername(chat.otherUser);
            div.innerText = username;
            div.onclick = () => {
                conversationId = chat.id;
                openChatUI(chat.otherUser);
            };
            chatList.appendChild(div);
        }
    });
}

//-------------------------------- OPEN CHAT ---------------------------
async function openChatUI(otherUserId) {
    const header = document.getElementById("chatUploaderUidDisplay");
    header.innerText = await getUsername(otherUserId);
    
    document.getElementById("chatMessages").innerHTML = "";
    listenMessages();
}




//-------------------------------- SEND ---------------------------
document.getElementById("chatInputForm").addEventListener("submit", async (e) => {
    e.preventDefault();
     if(!conversationId){
        showToast("Select a chat first!");
    };


    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;

    const now = Date.now();
    const messageRef = ref(db, `messages/${conversationId}`);
    
    // 1. Push the message
    push(messageRef, {
        senderId: currentUserId,
        text: text,
        timestamp: now
    });

    update(ref(db, `conversations/${conversationId}`), {
        lastTime: now
    });

    input.value = "";
});

//-------------------------------- RECEIVE ---------------------------
function listenMessages() {
    const container = document.getElementById("chatMessages");
    if (!conversationId) return;

    if (currentListener) off(currentListener);

    const messagesRef = ref(db, `messages/${conversationId}`);
    currentListener = messagesRef;

    onChildAdded(messagesRef, (snapshot) => {
        const msg = snapshot.val();
        const div = document.createElement("div");
        div.style.cssText = "margin: 8px; padding: 10px; border-radius: 10px; max-width: 60%; word-break: break-word;";

        if (msg.senderId === currentUserId) {
            div.style.background = "purple";
            div.style.color = "white";
            div.style.marginLeft = "auto";
        } else {
            div.style.background = "#333";
            div.style.color = "white";
            div.style.marginRight = "auto";
        }

        div.innerText = msg.text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    });
}

window.addEventListener("load", () => {
    const icon = document.getElementById("messageicon");

    console.log("ICON:", icon);

    if (icon) {
        icon.src = "images/messageSelected.svg";
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
    }, 2000); // 3 sec
}