//-------------------------------- FIREBASE ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    get,
    onValue,
    off
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
    let name = "Unknown";

    if (snapshot.exists()) {
        name = snapshot.val().username;
    }

    userCache[uid] = name;
    return name;
}

//-------------------------------- AUTH ---------------------------
onAuthStateChanged(auth, (user) => {
    if (!user) return;

    currentUserId = user.uid;

    setupMessageContainer();
    loadChatList();

    if (otherUserFromPost) {
        startChatFromPost(otherUserFromPost);
    }
});

//-------------------------------- SETUP MESSAGE BOX ---------------------------
function setupMessageContainer() {
    const right = document.getElementById("rightPannel");

    let msgBox = document.getElementById("chatMessages");

    if (!msgBox) {
        msgBox = document.createElement("div");
        msgBox.id = "chatMessages";

        msgBox.style.flex = "1";
        msgBox.style.overflowY = "auto";
        msgBox.style.display = "flex";
        msgBox.style.flexDirection = "column";
        msgBox.style.padding = "10px";

        const inputForm = document.getElementById("chatInputForm");
        right.insertBefore(msgBox, inputForm);
    }
}

//-------------------------------- CREATE / FIND CHAT ---------------------------
async function startChatFromPost(otherUserId) {

    const convoRef = ref(db, "conversations");
    const snapshot = await get(convoRef);

    let found = false;

    if (snapshot.exists()) {
        const data = snapshot.val();

        for (let id in data) {
            const users = data[id].users;

            if (users[currentUserId] && users[otherUserId]) {
                conversationId = id;
                openChatUI(otherUserId);
                found = true;
                break;
            }
        }
    }

    if (!found) {
        const newConvo = push(convoRef);

        await set(newConvo, {
            users: {
                [currentUserId]: true,
                [otherUserId]: true
            }
        });

        conversationId = newConvo.key;
        openChatUI(otherUserId);
    }
}

//-------------------------------- LOAD CHAT LIST ---------------------------
async function loadChatList() {

    const left = document.getElementById("leftPannel");

    onValue(ref(db, "conversations"), async (snapshot) => {

        left.innerHTML = "";

        const data = snapshot.val();

        if (!data) {
            left.innerHTML = "No chats yet";
            return;
        }

        let convoArray = [];

        for (let id in data) {
            const users = data[id].users;

            if (users[currentUserId]) {

                const otherUser = Object.keys(users).find(
                    uid => uid !== currentUserId
                );

                const messagesSnap = await get(ref(db, `messages/${id}`));
                let lastTime = 0;

                if (messagesSnap.exists()) {
                    const msgs = Object.values(messagesSnap.val());
                    lastTime = Math.max(...msgs.map(m => m.timestamp || 0));
                }

                convoArray.push({
                    id,
                    otherUser,
                    lastTime
                });
            }
        }

        convoArray.sort((a, b) => b.lastTime - a.lastTime);

        for (const chat of convoArray) {

            const div = document.createElement("div");

            div.style.padding = "15px";
            div.style.color = "white";
            div.style.cursor = "pointer";
            div.style.borderBottom = "1px solid gray";

            const username = await getUsername(chat.otherUser);
            div.innerText = username;

            div.onclick = () => {
                conversationId = chat.id;
                openChatUI(chat.otherUser);
            };

            left.appendChild(div);
        }
    });
}

//-------------------------------- OPEN CHAT ---------------------------
async function openChatUI(otherUserId) {

    const header = document.getElementById("chatUploaderUidDisplay");

    const username = await getUsername(otherUserId);
    header.innerText = username;

    listenMessages();
}

//-------------------------------- SEND ---------------------------
document.getElementById("chatInputForm").addEventListener("submit", (e) => {
    e.preventDefault();

    if (!conversationId) {
        alert("Open a chat first");
        return;
    }

    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text) return;

    push(ref(db, `messages/${conversationId}`), {
        senderId: currentUserId,
        text: text,
        timestamp: Date.now()
    });

    input.value = "";
});

//-------------------------------- RECEIVE ---------------------------
function listenMessages() {

    const container = document.getElementById("chatMessages");

    if (!conversationId) return;

    if (currentListener) {
        off(currentListener);
    }

    const messagesRef = ref(db, `messages/${conversationId}`);
    currentListener = messagesRef;

    onValue(messagesRef, async (snapshot) => {

        container.innerHTML = "";

        const data = snapshot.val();
        if (!data) return;

        const messages = Object.values(data)
            .sort((a, b) => a.timestamp - b.timestamp);

        for (const msg of messages) {

            const div = document.createElement("div");

            div.style.margin = "8px";
            div.style.padding = "10px";
            div.style.borderRadius = "10px";
            div.style.maxWidth = "60%";

            const senderName = await getUsername(msg.senderId);

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
        }

        container.scrollTop = container.scrollHeight;
    });
}