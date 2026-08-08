import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove, runTransaction, update, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Inject comprehensive, smooth, and high-performance layout & interaction styles
const styleTag = document.createElement('style');
styleTag.innerHTML = `
    .message-row-container {
        position: relative;
    }
    .seen-status-indicator {
        font-size: 10px;
        color: #FF8A9A;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        margin-top: 2px;
        user-select: none;
    }
    .message-row-container:hover .seen-status-indicator {
        opacity: 1;
    }
    
    /* Strict Mobile Context Menu Override & Highlight Killers */
    .message-text-bubble, .chat-body-row, .message-row-container {
        -webkit-touch-callout: none !important; 
        -webkit-user-select: none !important;    
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
    }

    /* Responsive Hover Controls for Desktop */
    @media (min-width: 769px) {
        .message-actions-container {
            display: flex !important;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        .chat-body-row:hover .message-actions-container {
            opacity: 1;
        }
        .mobile-bottom-actionsheet {
            display: none !important;
        }
    }

    /* Mobile Interaction Modifiers */
    @media (max-width: 768px) {
        .message-actions-container {
            display: none !important; 
        }
        .seen-status-indicator {
            opacity: 0.6 !important;
        }
    }

    /* Bottom Action Sheet Layout */
    .mobile-bottom-actionsheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
        transform: translateY(100%);
        transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        z-index: 2500;
        padding: 20px;
        box-sizing: border-box;
    }
    .mobile-bottom-actionsheet.open {
        transform: translateY(0);
    }
    .actionsheet-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 2400;
    }
    .actionsheet-overlay.active {
        opacity: 1;
        pointer-events: auto;
    }
    .actionsheet-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        font-size: 15px;
        font-weight: 500;
        color: #333;
        cursor: pointer;
        border-radius: 8px;
    }
    .actionsheet-option:active {
        background: #FFF5F6;
    }

    /* High Fidelity Reactions/Details Modal */
    .custom-modal-backdrop {
        position: fixed;
        top:0; left:0; right:0; bottom:0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    }
    .custom-modal-backdrop.open {
        opacity: 1;
        pointer-events: auto;
    }
    .custom-popup-content {
        background: #ffffff;
        border-radius: 16px;
        width: 90%;
        max-width: 360px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        transform: scale(0.9);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .custom-modal-backdrop.open .custom-popup-content {
        transform: scale(1);
    }

    /* Messenger Typing Indicator Animation */
    .messenger-typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        background: #F0F2F5;
        border-radius: 18px;
        width: fit-content;
        margin-left: 12px;
        margin-bottom: 8px;
    }
    .typing-dot {
        width: 7px;
        height: 7px;
        background: #90949C;
        border-radius: 50%;
        animation: messengerTyping 1.3s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes messengerTyping {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }

    #sticker-grid-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        max-height: 260px;
        overflow-y: auto !important;
        padding: 8px;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }
    textarea#chat-input-field {
        resize: none;
        overflow-y: hidden;
        min-height: 40px;
        max-height: 150px;
        box-sizing: border-box;
    }
    #reply-preview-container {
        position: relative !important;
        padding-right: 35px !important;
    }
    #reply-preview-container .cancel-reply-btn {
        position: absolute !important;
        top: 8px !important;
        right: 12px !important;
        cursor: pointer !important;
        font-weight: bold;
    }
`;
document.head.appendChild(styleTag);

const firebaseConfig = {
    apiKey: "AIzaSyCLDSTIj-iK8y-HAR5dwtJNs0KjKlCdeuo",
    authDomain: "keepics-7c48f.firebaseapp.com",
    projectId: "keepics-7c48f",
    storageBucket: "keepics-7c48f.firebasestorage.app",
    messagingSenderId: "869338453647",
    appId: "1:869338453647:web:4d6e5c6abce6712db502fa",
    databaseURL: "https://keepics-7c48f-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); 

const ADMIN_UID = 'nf6DyVHXpbTMxbtpDS9YicgGIYu1';
const DEV_UID = '4dyuS34hliSLb0Ew0wGytuSviTG2';

let replyToMessage = null; 
let activeUserPreferences = ["👍", "❤️", "😂", "🔥", "🥰", "👀"];
let targetPreferenceSlotIndex = null;
let favoriteStickersList = {};
let currentStickerTabMode = "opensource"; 
let lastMessageIdInFeed = null; 
window.forceScrollToBottomOnce = false;

const sheetOverlay = document.createElement('div');
sheetOverlay.className = 'actionsheet-overlay';
const bottomSheet = document.createElement('div');
bottomSheet.className = 'mobile-bottom-actionsheet';
bottomSheet.id = 'mobile-actionsheet-container';
document.body.append(sheetOverlay, bottomSheet);

const modalBackdrop = document.createElement('div');
modalBackdrop.className = 'custom-modal-backdrop';
modalBackdrop.id = 'reaction-modal-backdrop';
modalBackdrop.innerHTML = `
    <div class="custom-popup-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #FFE3E7; padding-bottom:8px;">
            <h4 style="margin:0; color:#FF4D6D; font-size:16px;">Reactions</h4>
            <span style="cursor:pointer; font-weight:bold; font-size:18px; color:#aaa;" onclick="window.closeReactionDetails()">×</span>
        </div>
        <div id="reaction-modal-list" style="max-height:240px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></div>
    </div>
`;
document.body.appendChild(modalBackdrop);

const adminStickerModal = document.createElement('div');
adminStickerModal.className = 'custom-modal-backdrop';
adminStickerModal.id = 'admin-sticker-modal-backdrop';
adminStickerModal.innerHTML = `
    <div class="custom-popup-content" style="max-width: 460px; width: 92%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #FFE3E7; padding-bottom:8px;">
            <h4 style="margin:0; color:#FF4D6D; font-size:15px; display:flex; align-items:center; gap:6px;">
                <svg class="material-icon" viewBox="0 0 24 24" style="width:24px;height:24px;" aria-hidden="true"><path fill="currentColor" d="M14 2H4c-1.1 0-2 .9-2 2v10h2V4h10V2zm4 4H8c-1.1 0-2 .9-2 2v10h2V8h10V6zm2 4h-8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2z"/></svg> Manage User Stickers
            </h4>
            <span style="cursor:pointer; font-weight:bold; font-size:18px; color:#aaa;" onclick="window.closeAdminStickerModal()">×</span>
        </div>
        <div id="admin-sticker-modal-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(85px, 1fr)); gap:12px; max-height:300px; overflow-y:auto; padding:4px;">
            <div style="font-size:12px; color:#888; text-align:center; grid-column:span 3; padding:20px;">Loading stickers pack catalog...</div>
        </div>
    </div>
`;
document.body.appendChild(adminStickerModal);

window.closeMobileActions = function() {
    bottomSheet.classList.remove('open');
    sheetOverlay.classList.remove('active');
};
sheetOverlay.onclick = window.closeMobileActions;

window.closeReactionDetails = function() {
    modalBackdrop.classList.remove('open');
};

window.closeAdminStickerModal = function() {
    adminStickerModal.classList.remove('open');
};

window.closeAllDesktopReactionDrawers = function() {
    document.querySelectorAll('.absolute-reaction-drawer').forEach(el => el.style.display = 'none');
};

window.toggleDesktopReactionContainer = function(e, msgId, authorName, text, isOwnMsg) {
    e.stopPropagation();
    if (window.innerWidth <= 768) {
        window.openMobileActionSheet(msgId, authorName, text, isOwnMsg);
    } else {
        const drawer = document.getElementById(`reaction-drawer-${msgId}`);
        const isCurrentlyOpen = drawer && drawer.style.display === 'flex';
        
        window.closeAllDesktopReactionDrawers();
        
        if (drawer && !isCurrentlyOpen) {
            // Dynamically inject user's latest emoji preferences 
            drawer.innerHTML = activeUserPreferences.map(emo => `
                <span class="react-em" style="font-size: 24px; cursor: pointer; transition: transform 0.2s;" onclick="window.reactToMessage('${msgId}', '${emo}'); window.closeAllDesktopReactionDrawers();">${emo}</span>
            `).join("");
            drawer.style.display = 'flex';
        }
    }
};

let longPressTimer = null;
let isLongPressFired = false;

window.handleTouchStart = function(e) {
    const bubble = e.currentTarget;
    const touch = e.touches[0];
    bubble.dataset.startX = touch.clientX;
    bubble.dataset.startY = touch.clientY;
    bubble.style.transition = 'none'; 
    
    const msgId = bubble.dataset.msgId;
    const authorName = bubble.dataset.authorName;
    const text = bubble.dataset.text;
    const isOwnMsg = bubble.dataset.isOwn === "true";
    
    isLongPressFired = false;

    longPressTimer = setTimeout(() => {
        isLongPressFired = true;
        window.openMobileActionSheet(msgId, authorName, text, isOwnMsg);
        if (window.navigator.vibrate) window.navigator.vibrate(40);
    }, 550);
};

window.handleTouchMove = function(e) {
    const bubble = e.currentTarget;
    const touch = e.touches[0];
    const startX = parseFloat(bubble.dataset.startX || 0);
    const startY = parseFloat(bubble.dataset.startY || 0);
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const isOwnMsg = bubble.dataset.isOwn === "true";

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        clearTimeout(longPressTimer);
        bubble.style.transform = 'translateX(0px)';
        return;
    }

    if (Math.abs(deltaX) > 10) {
        clearTimeout(longPressTimer);
        if (isOwnMsg && deltaX < 0) {
            bubble.style.transform = `translateX(${Math.max(deltaX, -75)}px)`;
        } else if (!isOwnMsg && deltaX > 0) {
            bubble.style.transform = `translateX(${Math.min(deltaX, 75)}px)`;
        }
    }
};

window.handleTouchEnd = function(e, msgId, authorName, text, isOwnMsg) {
    clearTimeout(longPressTimer);
    const bubble = e.currentTarget;
    
    bubble.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
    bubble.style.transform = 'translateX(0px)';
    
    if (isLongPressFired) {
        e.preventDefault();
        return;
    }
    
    const startX = parseFloat(bubble.dataset.startX || 0);
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;
    
    if (isOwnMsg && deltaX < -60) {
        window.setReply(msgId, authorName, text);
        return;
    } else if (!isOwnMsg && deltaX > 60) {
        window.setReply(msgId, authorName, text);
        return;
    }
    
    if (Math.abs(deltaX) < 10) {
        if (e.target.closest('.reaction-badge-container')) return;
        window.openMobileActionSheet(msgId, authorName, text, isOwnMsg);
    }
};

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.message-text-bubble') || e.target.closest('.message-row-container')) {
        e.preventDefault();
    }
}, true);

window.openMobileActionSheet = function(msgId, authorName, text, isOwnMsg) {
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    const isCurrentAdmin = currentUserId && (currentUserId === ADMIN_UID || currentUserId === DEV_UID);
    
    let inlineReactionsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 6px 14px 6px; border-bottom: 1px solid #FFE3E7; margin-bottom: 12px; gap: 4px;">
            ${activeUserPreferences.map(emo => `
                <span style="font-size: 28px; cursor: pointer; transition: transform 0.1s;" 
                      onclick="window.reactToMessage('${msgId}', '${emo}'); window.closeMobileActions();"
                      thistouch="transform:scale(1.25);">${emo}</span>
            `).join("")}
        </div>
    `;

    let optionsHTML = inlineReactionsHTML + `
        <div class="actionsheet-option" onclick="window.setReply('${msgId}', '${authorName}', '${text}'); window.closeMobileActions();">
            <svg class="material-icon" viewBox="0 0 24 24" style="width:24px;height:24px;color:#FF4D6D;" aria-hidden="true"><path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg> Reply Message
        </div>
    `;
    
    if (isOwnMsg || isCurrentAdmin) {
        optionsHTML += `
            <div class="actionsheet-option" style="color: #FF4D6D;" onclick="window.deleteLoungeMessage('${msgId}'); window.closeMobileActions();">
                <svg class="material-icon" viewBox="0 0 24 24" style="width:24px;height:24px;" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> Delete Message
            </div>
        `;
    }
    
    bottomSheet.innerHTML = optionsHTML;
    bottomSheet.classList.add('open');
    sheetOverlay.classList.add('active');
};

window.showReactionDetails = function(msgId) {
    const listContainer = document.getElementById('reaction-modal-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<div style="font-size:13px; color:#666; text-align:center; padding:10px;">Loading details...</div>';
    modalBackdrop.classList.add('open');

    onValue(ref(db, `lounge_chats/${msgId}/reactions`), (snap) => {
        const reactions = snap.val();
        if (!reactions) {
            listContainer.innerHTML = '<div style="font-size:12px; color:#999; text-align:center;">No reactions active.</div>';
            return;
        }
        listContainer.innerHTML = "";
        Object.entries(reactions).forEach(([uid, val]) => {
            const emo = typeof val === 'string' ? val : val.type;
            const name = typeof val === 'string' ? 'Someone' : val.name;
            
            const row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 4px; border-bottom:1px solid #fafafa;";
            row.innerHTML = `
                <span style="font-size:14px; color:#333; font-weight:500;">${name}</span>
                <span style="font-size:18px;">${emo}</span>
            `;
            listContainer.appendChild(row);
        });
    }, { onlyOnce: true });
};

const builtInOpenStickers = [
    "https://openmoji.org/data/color/svg/1F600.svg",
    "https://openmoji.org/data/color/svg/1F60A.svg",
    "https://openmoji.org/data/color/svg/1F60D.svg",
    "https://openmoji.org/data/color/svg/1F92D.svg",
    "https://openmoji.org/data/color/svg/1F408.svg",
    "https://openmoji.org/data/color/svg/1F34E.svg",
    "https://openmoji.org/data/color/svg/1F680.svg",
    "https://openmoji.org/data/color/svg/1F4A5.svg",
    "https://openmoji.org/data/color/svg/1F49F.svg"
];

const emojiCatalogData = {
    "Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"],
    "Gestures": ["👍","👎","👊","✊","🤛","🤜","🤞","✌️","🤟","🤘","👌","🤌","🤏","👈","👉","👆","👇","☝️","✋","🤚","🖐","🖖","👋","🤙","💪","🦾","🖕","✍️","🙏","🤝","👏","🙌"],
    "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","🔮","✨","🌟","⭐️","⚡️","💥","🔥","🌈","☀️","🌤","❄️","💧","💨"]
};

function formatTimelineHeader(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

window.setReply = function(msgId, authorName, text) {
    replyToMessage = { msgId, authorName, text };
    const preview = document.getElementById('reply-preview-container');
    if (preview) {
        document.getElementById('reply-to-name').innerText = `Replying to ${authorName}`;
        document.getElementById('reply-to-text').innerText = text;
        preview.style.display = 'block'; 
    }
    document.getElementById('chat-input-field').focus();
};

window.cancelReply = function() {
    replyToMessage = null;
    const preview = document.getElementById('reply-preview-container');
    if (preview) preview.style.display = 'none';
};

window.toggleReactionDrawer = function(e, msgId) {
    e.stopPropagation();
    window.openMobileActionSheet(msgId, "User", "", false);
};

window.toggleSidebarView = function() {
    const sidebar = document.getElementById('chat-contextual-sidebar');
    if (!sidebar) return;
    if (window.innerWidth <= 768) sidebar.classList.toggle('mobile-open');
    else sidebar.style.display = (sidebar.style.display === 'none' || sidebar.style.display === '') ? 'flex' : 'none';
};

window.openGlobalEmojiPickerForSlot = function(slotIdx) {
    targetPreferenceSlotIndex = slotIdx;
    document.querySelectorAll('.pref-slot-node').forEach(n => n.classList.remove('selected-slot'));
    document.getElementById(`pref-node-${slotIdx}`)?.classList.add('selected-slot');
    document.getElementById('global-emoji-picker').style.display = 'flex';
};

window.openImagePopUpModal = function(base64Src) {
    const modal = document.getElementById('zoom-lightbox');
    const modalImg = document.getElementById('zoom-lightbox-img');
    const downloadBtn = document.getElementById('zoom-lightbox-dl-btn');
    if (!modal || !modalImg) return;
    modalImg.src = base64Src;
    modal.style.display = "flex";
    downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.href = base64Src;
        link.download = `KeePics_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
};

window.closeImagePopUpModal = function() {
    const modal = document.getElementById('zoom-lightbox');
    if (modal) modal.style.display = "none";
};

window.promptChangeChatName = function() {
    const uid = auth.currentUser ? auth.currentUser.uid : null;
    if (uid !== ADMIN_UID && uid !== DEV_UID) return;
    const newName = prompt("Enter new channel name:");
    if (newName && newName.trim() !== "") {
        update(ref(db, 'chat_settings'), { roomName: newName.trim() });
    }
};

function renderGlobalEmojiPickerGrid(categoryKey) {
    const container = document.getElementById('emoji-picker-grid-container');
    if (!container) return;
    container.innerHTML = "";
    (emojiCatalogData[categoryKey] || []).forEach(emo => {
        const item = document.createElement('span');
        item.className = "react-em";
        item.style.textAlign = "center";
        item.innerText = emo;
        item.onclick = async () => {
            if (targetPreferenceSlotIndex === null || !auth.currentUser) return;
            activeUserPreferences[targetPreferenceSlotIndex] = emo;
            const node = document.getElementById(`pref-node-${targetPreferenceSlotIndex}`);
            if (node) node.innerText = emo;
            await set(ref(db, `user_emoji_preferences/${auth.currentUser.uid}/${targetPreferenceSlotIndex}`), emo);
            document.getElementById('global-emoji-picker').style.display = 'none';
            targetPreferenceSlotIndex = null;
        };
        container.appendChild(item);
    });
}

function compressImage(base64Str, maxBytes, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > 800 || height > 800) {
            if (width > height) { height = Math.round((height * 800) / width); width = 800; }
            else { width = Math.round((width * 800) / height); height = 800; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.8;
        let res = canvas.toDataURL('image/jpeg', quality);
        while ((res.length * 0.75) > maxBytes && quality > 0.1) {
            quality -= 0.1;
            res = canvas.toDataURL('image/jpeg', quality);
        }
        callback(res);
    };
}

export function initLoungeChatSystem(roomTitleId, renameTriggerId, messagesAreaId, inputFieldId, sendBtnId, fileInputId, imagePreviewId, avatarImgId, avatarInputId) {
    const roomTitleEl = document.getElementById(roomTitleId);
    const renameTriggerEl = document.getElementById(renameTriggerId);
    const messagesArea = document.getElementById(messagesAreaId);
    const inputField = document.getElementById(inputFieldId);
    const sendBtn = document.getElementById(sendBtnId);
    const fileInput = document.getElementById(fileInputId);
    const imagePreview = document.getElementById(imagePreviewId);
    const avatarImgEl = document.getElementById(avatarImgId);
    const avatarInputEl = document.getElementById(avatarInputId);

    let attachedImageBase64 = null;
    let typingDebounceTimeout = null;

    const updateSendButtonState = () => {
        if (!sendBtn || !inputField) return;
        const textValue = inputField.value.trim();
        if (!textValue && !attachedImageBase64) {
            sendBtn.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; background:#FFF5F6; border-radius:50%; width:36px; height:36px; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.04); transition: transform 0.1s active;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF4D6D" width="22px" height="22px">
                        <path d="M0 0h24v24H0V0z" fill="none"/>
                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    </svg>
                </div>`;
            sendBtn.setAttribute('data-mode', 'like');
        } else {
            sendBtn.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; background:#FF4D6D; border-radius:50%; width:36px; height:36px; cursor:pointer; box-shadow:0 2px 6px rgba(255,77,109,0.35);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" width="20px" height="20px">
                        <path d="M0 0h24v24H0V0z" fill="none"/>
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </div>`;
            sendBtn.setAttribute('data-mode', 'send');
        }
    };

    const pickerHeader = document.getElementById('emoji-picker-categories-header');
    if (pickerHeader) {
        Object.keys(emojiCatalogData).forEach((cat, idx) => {
            const btn = document.createElement('button');
            btn.className = `drawer-tab-btn ${idx === 0 ? 'active' : ''}`;
            btn.innerText = cat === "Smileys" ? "😀" : cat === "Gestures" ? "👍" : "❤️";
            btn.onclick = () => {
                document.querySelectorAll('.emoji-picker-tabs .drawer-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderGlobalEmojiPickerGrid(cat);
            };
            pickerHeader.appendChild(btn);
        });
        renderGlobalEmojiPickerGrid("Smileys");
    }

    inputField?.addEventListener('input', () => {
        inputField.style.height = 'auto';
        inputField.style.height = inputField.scrollHeight + 'px';
        updateSendButtonState();

        if (auth.currentUser) {
            set(ref(db, `presence/typing/${auth.currentUser.uid}`), auth.currentUser.displayName || auth.currentUser.email.split('@')[0]);
            
            clearTimeout(typingDebounceTimeout);
            typingDebounceTimeout = setTimeout(() => {
                remove(ref(db, `presence/typing/${auth.currentUser.uid}`));
            }, 1800);
        }
    });

    inputField?.addEventListener('blur', () => {
        if (auth.currentUser) remove(ref(db, `presence/typing/${auth.currentUser.uid}`));
    });

    onValue(ref(db, 'presence/typing'), (snapshot) => {
        const typingUsers = snapshot.val() || {};
        let existingIndicator = document.getElementById('messenger-typing-container');
        if (existingIndicator) existingIndicator.remove();

        const externalTypingList = Object.entries(typingUsers).filter(([uid]) => uid !== (auth.currentUser ? auth.currentUser.uid : ''));
        
        if (externalTypingList.length > 0) {
            const typingContainer = document.createElement('div');
            typingContainer.id = 'messenger-typing-container';
            typingContainer.style.width = '100%';
            
            const firstUser = externalTypingList[0][1];
            const descriptiveLabel = externalTypingList.length > 1 ? 'Multiple users are typing...' : `${firstUser} is typing`;

            typingContainer.innerHTML = `
                <div style="font-size: 11px; color:#888; margin-left: 16px; margin-bottom: 2px;">${descriptiveLabel}</div>
                <div class="messenger-typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            messagesArea.appendChild(typingContainer);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    });

    const stkTrigger = document.getElementById('sticker-drawer-trigger-btn');
    const stkDrawer = document.getElementById('sticker-drawer');
    const stkGrid = document.getElementById('sticker-grid-container');
    const customStkInput = document.getElementById('custom-sticker-upload-input');

    const renderStickerFeed = () => {
        if (!stkGrid) return;
        stkGrid.innerHTML = "";

        if (currentStickerTabMode === "opensource") {
            builtInOpenStickers.forEach(src => {
                createStickerItemNode(src, false);
            });
        } else if (currentStickerTabMode === "favs") {
            const favKeys = Object.keys(favoriteStickersList);
            if (favKeys.length === 0) {
                stkGrid.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:20px;color:#FF8A9A;font-size:12px;">No pinned stickers yet.</div>`;
                return;
            }
            favKeys.forEach(k => createStickerItemNode(favoriteStickersList[k], true, k));
        } else if (currentStickerTabMode === "custom") {
            if (!auth.currentUser) return;
            onValue(ref(db, `user_custom_media/${auth.currentUser.uid}/stickers`), (snap) => {
                stkGrid.innerHTML = "";
                const data = snap.val();
                if (!data) {
                    stkGrid.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:20px;color:#FF8A9A;font-size:12px;">Create custom stickers above.</div>`;
                    return;
                }
                Object.entries(data).forEach(([dbKey, src]) => {
                    createStickerItemNode(src, false, dbKey, true);
                });
            }, { onlyOnce: true });
        }
    };

    function createStickerItemNode(src, isAlreadyFav, dbKey = null, isUserOwnedCustom = false) {
        const item = document.createElement('div');
        item.className = "drawer-media-item";
        item.innerHTML = `<img src="${src}" style="width:100%; height:auto; display:block; object-fit:contain;">`;
        
        const star = document.createElement('div');
        star.className = "fav-star-indicator";
        star.innerHTML = isAlreadyFav
            ? '<svg viewBox="0 0 24 24" style="width:16px;height:16px;display:block;" aria-hidden="true"><path fill="#FFD700" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>'
            : '<svg viewBox="0 0 24 24" style="width:16px;height:16px;display:block;" aria-hidden="true"><path fill="none" stroke="#888" stroke-width="1.8" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
        star.onclick = async (e) => {
            e.stopPropagation();
            if (!auth.currentUser) return;
            if (isAlreadyFav && dbKey) {
                await remove(ref(db, `user_favorite_stickers/${auth.currentUser.uid}/${dbKey}`));
            } else {
                await push(ref(db, `user_favorite_stickers/${auth.currentUser.uid}`), src);
            }
            renderStickerFeed();
        };
        item.appendChild(star);

        if (isUserOwnedCustom && dbKey) {
            const trash = document.createElement('div');
            trash.className = "stk-delete-indicator";
            trash.innerHTML = `<svg class="material-icon" viewBox="0 0 24 24" style="width:15px;height:15px;margin-top:3px;" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
            trash.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm("Remove this sticker permanently from your packs inventory?")) return;
                await remove(ref(db, `user_custom_media/${auth.currentUser.uid}/stickers/${dbKey}`));
                renderStickerFeed();
            };
            item.appendChild(trash);
        }
        
        item.onclick = () => { sendCustomMedia(src); stkDrawer.style.display = 'none'; };
        stkGrid.appendChild(item);
    }

    window.switchStickerTab = function(mode) {
        currentStickerTabMode = mode;
        document.getElementById('stk-tab-opensource')?.classList.toggle('active', mode === 'opensource');
        document.getElementById('stk-tab-favs')?.classList.toggle('active', mode === 'favs');
        document.getElementById('stk-tab-custom')?.classList.toggle('active', mode === 'custom');
        renderStickerFeed();
    };

    customStkInput?.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file || !auth.currentUser) return;
        const r = new FileReader();
        r.onload = (evt) => {
            compressImage(evt.target.result, 150 * 1024, async (compressedStk) => {
                await push(ref(db, `user_custom_media/${auth.currentUser.uid}/stickers`), compressedStk);
                window.switchStickerTab('custom');
            });
        };
        r.readAsDataURL(file);
    });

    stkTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        const display = stkDrawer.style.display;
        document.querySelectorAll('.sticker-drawer-popup, .global-emoji-picker-drawer').forEach(d => d.style.display = 'none');
        stkDrawer.style.display = (display === 'flex') ? 'none' : 'flex';
        if (stkDrawer.style.display === 'flex') window.switchStickerTab('opensource');
    });

    const sendCustomMedia = async (url) => {
        if (!auth.currentUser) return;
        const payload = {
            authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            authorId: auth.currentUser.uid,
            text: "",
            image: url,
            timestamp: Date.now()
        };
        if (replyToMessage) payload.replyTo = replyToMessage;
        window.forceScrollToBottomOnce = true;
        await push(ref(db, 'lounge_chats'), payload);
        if (replyToMessage) window.cancelReply();
    };

    avatarInputEl?.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            compressImage(evt.target.result, 100 * 1024, (compressedAvatar) => {
                update(ref(db, 'chat_settings'), { roomAvatar: compressedAvatar });
            });
        };
        reader.readAsDataURL(file);
    });

    onValue(ref(db, 'chat_settings/roomName'), (snapshot) => {
        if (roomTitleEl) roomTitleEl.innerText = snapshot.val() || "Lounge Room";
    });

    onValue(ref(db, 'chat_settings/roomAvatar'), (snapshot) => {
        if (snapshot.val() && avatarImgEl) avatarImgEl.src = snapshot.val();
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            compressImage(event.target.result, 350 * 1024, (finalBase64) => {
                attachedImageBase64 = finalBase64;
                if (imagePreview) {
                    imagePreview.innerHTML = `
                        <div style="position: relative; display: inline-block; margin: 10px 15px;">
                            <img src="${attachedImageBase64}" style="max-height: 70px; border-radius: 8px; border: 1px solid #FFE3E7;">
                            <span id="clear-img-preview" style="position: absolute; top: -6px; right: -6px; background: #FF4D6D; color: white; border-radius: 50%; width: 18px; height: 18px; text-align: center; font-size: 11px; font-weight: bold; cursor: pointer; line-height: 16px;">×</span>
                        </div>`;
                    document.getElementById('clear-img-preview').onclick = () => { 
                        attachedImageBase64 = null; 
                        imagePreview.innerHTML = ""; 
                        fileInput.value = ""; 
                        updateSendButtonState();
                    };
                }
                updateSendButtonState();
            });
        };
        reader.readAsDataURL(file);
    });

    const triggerMessageDispatch = async () => {
        let text = inputField.value.trim();
        const isLikeMode = sendBtn?.getAttribute('data-mode') === 'like';
        
        if (isLikeMode && !text && !attachedImageBase64) {
            text = "👍";
        }

        if (!text && !attachedImageBase64) return;
        if (auth.currentUser) remove(ref(db, `presence/typing/${auth.currentUser.uid}`));
        
        const payload = {
            authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            authorId: auth.currentUser.uid,
            text: text,
            image: attachedImageBase64 || null,
            timestamp: Date.now()
        }; 
        if (replyToMessage) payload.replyTo = replyToMessage;
        try {
            window.forceScrollToBottomOnce = true; 
            await push(ref(db, 'lounge_chats'), payload);
            inputField.value = ''; 
            inputField.style.height = 'auto';
            attachedImageBase64 = null;       
            if (imagePreview) imagePreview.innerHTML = ''; 
            if (replyToMessage) window.cancelReply(); 
            updateSendButtonState();
        } catch (e) { console.error(e); }
    };

    sendBtn?.addEventListener('click', triggerMessageDispatch);
    inputField?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); triggerMessageDispatch(); }
    });

    window.deleteLoungeMessage = async function(msgId) {
        if (!confirm("Remove this chat message layout?")) return;
        await remove(ref(db, `lounge_chats/${msgId}`));
    };

    window.reactToMessage = async function(msgId, reactionType) {
        if (!auth.currentUser) return;
        const userName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
        await runTransaction(ref(db, `lounge_chats/${msgId}/reactions/${auth.currentUser.uid}`), val => {
            if (val && (val === reactionType || val.type === reactionType)) return null;
            return { type: reactionType, name: userName };
        });
    };

    window.adminDownloadUserSticker = function(base64Src) {
        const link = document.createElement("a");
        link.href = base64Src;
        link.download = `UserSticker_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    onAuthStateChanged(auth, (user) => {
        const currentUserId = user ? user.uid : null;
        const isCurrentAdmin = currentUserId && (currentUserId === ADMIN_UID || currentUserId === DEV_UID);
        
        if (document.getElementById('admin-exclusive-dashboard')) {
            document.getElementById('admin-exclusive-dashboard').style.display = isCurrentAdmin ? "block" : "none";
        }
        if (renameTriggerEl) renameTriggerEl.style.display = isCurrentAdmin ? "inline-block" : "none";

        const sidebar = document.getElementById('chat-contextual-sidebar');
        if (sidebar && isCurrentAdmin && !document.getElementById('admin-manage-stickers-btn')) {
            const manageStickersBtn = document.createElement('div');
            manageStickersBtn.id = 'admin-manage-stickers-btn';
            manageStickersBtn.style.cssText = 'margin: 15px 14px 5px 14px; padding: 12px; background: #FF4D6D; color: white; border-radius: 8px; text-align: center; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; box-shadow: 0 2px 6px rgba(255, 77, 109, 0.2); transition: background 0.2s;';
            manageStickersBtn.innerHTML = `<svg class="material-icon" viewBox="0 0 24 24" style="width:18px;height:18px;" aria-hidden="true"><path fill="currentColor" d="M14 2H4c-1.1 0-2 .9-2 2v10h2V4h10V2zm4 4H8c-1.1 0-2 .9-2 2v10h2V8h10V6zm2 4h-8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2z"/></svg> Manage User Stickers`;
            
            sidebar.appendChild(manageStickersBtn);
            
            manageStickersBtn.onclick = () => {
                adminStickerModal.classList.add('open');
            };
            
            onValue(ref(db, 'user_custom_media'), (snap) => {
                const gridContainer = document.getElementById('admin-sticker-modal-grid');
                if (!gridContainer) return;
                gridContainer.innerHTML = "";
                const allUsersData = snap.val();
                if (!allUsersData) {
                    gridContainer.innerHTML = '<div style="font-size:12px; color:#888; text-align:center; grid-column: 1/-1; padding:20px;">No custom stickers uploaded yet.</div>';
                    return;
                }
                
                let totalCount = 0;
                Object.entries(allUsersData).forEach(([userId, userMedia]) => {
                    if (userMedia && userMedia.stickers) {
                        Object.entries(userMedia.stickers).forEach(([stkKey, src]) => {
                            totalCount++;
                            const cell = document.createElement('div');
                            cell.style.cssText = 'position:relative; border:1px solid #FFE3E7; border-radius:8px; padding:8px 8px 14px 8px; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';
                            cell.innerHTML = `
                                <img src="${src}" style="width:100%; height:auto; max-height:50px; object-fit:contain; display:block; margin-bottom:4px;">
                                <div style="position:absolute; top:-6px; right:-6px; background:#FF4D6D; color:white; border-radius:50%; width:18px; height:18px; text-align:center; font-size:11px; cursor:pointer; line-height:18px; font-weight:bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" onclick="window.adminDeleteUserSticker('${userId}', '${stkKey}')">×</div>
                                <div style="position:absolute; bottom:-5px; right:-5px; background:#444; color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.25);" onclick="window.adminDownloadUserSticker('${src}')">
                                    <svg class="material-icon" viewBox="0 0 24 24" style="width:12px;height:12px;" aria-hidden="true"><path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>
                                </div>
                            `;
                            gridContainer.appendChild(cell);
                        });
                    }
                });
                if (totalCount === 0) {
                    gridContainer.innerHTML = '<div style="font-size:12px; color:#888; text-align:center; grid-column: 1/-1; padding:20px;">No custom stickers uploaded yet.</div>';
                }
            });

            window.adminDeleteUserSticker = async function(userId, stkKey) {
                if (confirm("Admin Action: Permanently delete this user's uploaded custom sticker?")) {
                    await remove(ref(db, `user_custom_media/${userId}/stickers/${stkKey}`));
                }
            };
        }

        if (user) {
            onValue(ref(db, `user_emoji_preferences/${user.uid}`), (snap) => {
                const prefs = snap.val();
                if (prefs) {
                    for (let i = 0; i < 6; i++) {
                        if (prefs[i]) activeUserPreferences[i] = prefs[i];
                        const node = document.getElementById(`pref-node-${i}`);
                        if (node) node.innerText = activeUserPreferences[i];
                    }
                }
            });

            onValue(ref(db, `user_favorite_stickers/${user.uid}`), (snap) => {
                favoriteStickersList = snap.val() || {};
                if (stkDrawer.style.display === 'flex' && currentStickerTabMode === "favs") renderStickerFeed();
            });
        }

        onValue(ref(db, 'lounge_chats'), (snapshot) => {
            const previousScrollTop = messagesArea.scrollTop;
            const previousScrollHeight = messagesArea.scrollHeight;
            const containerClientHeight = messagesArea.clientHeight;
            const wasNearBottom = (previousScrollHeight - previousScrollTop - containerClientHeight) < 150;

            messagesArea.innerHTML = "";
            const mediaDeckArea = document.getElementById('media-deck-gallery');
            if (mediaDeckArea) mediaDeckArea.innerHTML = "";
            
            const data = snapshot.val();
            if (!data) return;

            const msgList = Object.keys(data).map(id => ({ msgId: id, ...data[id] })).sort((a,b) => a.timestamp - b.timestamp);
            
            const incomingLastMessageId = msgList.length > 0 ? msgList[msgList.length - 1].msgId : null;
            const isNewMessageAdded = incomingLastMessageId !== lastMessageIdInFeed;
            lastMessageIdInFeed = incomingLastMessageId;

            msgList.forEach((item, index) => {
                const msgId = item.msgId;
                const isOwnMsg = currentUserId && item.authorId === currentUserId;
                const timeString = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const prevItem = index > 0 ? msgList[index - 1] : null;
                const nextItem = index < msgList.length - 1 ? msgList[index + 1] : null;

                const isFirstInStreak = !prevItem || prevItem.authorId !== item.authorId || (item.timestamp - prevItem.timestamp > 2 * 60 * 1000);
                const isLastInStreak = !nextItem || nextItem.authorId !== item.authorId || (nextItem.timestamp - item.timestamp > 2 * 60 * 1000);

                if (!prevItem || (item.timestamp - prevItem.timestamp > 15 * 60 * 1000)) {
                    messagesArea.innerHTML += `<div style="width: 100%; text-align: center; margin: 16px 0 8px 0; font-size: 11px; font-weight: 700; color: #FF8A9A;">${formatTimelineHeader(item.timestamp)}</div>`;
                }

                if (item.image && mediaDeckArea) {
                    const deckItem = document.createElement('div');
                    deckItem.className = "media-deck-item";
                    deckItem.innerHTML = `<img src="${item.image}">`;
                    deckItem.onclick = () => window.openImagePopUpModal(item.image);
                    mediaDeckArea.insertBefore(deckItem, mediaDeckArea.firstChild);
                }

                const counts = {};
                Object.values(item.reactions || {}).forEach(reactVal => { 
                    const emo = typeof reactVal === 'string' ? reactVal : reactVal.type;
                    counts[emo] = (counts[emo] || 0) + 1; 
                });
                let rSummary = Object.keys(counts).map(emo => `<span>${emo}</span>`).join("");

                const imgHTML = item.image ? `<div style="margin-top: 6px; border-radius: 8px; overflow: hidden; max-width: 240px; cursor: pointer;"><img src="${item.image}" style="width: 100%; height: auto; display: block;" onclick="window.openImagePopUpModal('${item.image}')"></div>` : "";

                let bubbleRadius = isOwnMsg ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
                if (!isFirstInStreak && !isLastInStreak) bubbleRadius = isOwnMsg ? '18px 4px 4px 18px' : '4px 18px 18px 4px';
                else if (!isFirstInStreak && isLastInStreak) bubbleRadius = isOwnMsg ? '18px 4px 18px 18px' : '4px 18px 18px 18px';
                else if (isFirstInStreak && !isLastInStreak) bubbleRadius = isOwnMsg ? '18px 18px 4px 18px' : '18px 18px 18px 4px';

                const safeName = (item.authorName || '').replace(/'/g, "\\'");
                const safeText = (item.text || '').replace(/'/g, "\\'").replace(/\n/g, " ");

                // Integrated Desktop Reaction Handler directly into Action Menu structure
                const actionMenuHTML = `
                    <div class="message-actions-container" style="position: relative;">
                        <div class="msg-action-btn desktop-react-btn" onclick="window.toggleDesktopReactionContainer(event, '${msgId}', '${safeName}', '${safeText}', ${isOwnMsg})">
                            <svg class="material-icon" viewBox="0 0 24 24" style="width:18px;height:18px;" aria-hidden="true"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                        </div>
                        <div class="msg-action-btn" onclick="window.setReply('${msgId}', '${safeName}', '${safeText}')">
                            <svg class="material-icon" viewBox="0 0 24 24" style="width:18px;height:18px;transform: scaleX(-1);" aria-hidden="true"><path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                        </div>
                        ${(isOwnMsg || isCurrentAdmin) ? `<div class="msg-action-btn" onclick="deleteLoungeMessage('${msgId}')"><svg class="material-icon" viewBox="0 0 24 24" style="width:18px;height:18px;" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></div>` : ''}
                        
                        <div class="absolute-reaction-drawer" id="reaction-drawer-${msgId}" style="${isOwnMsg ? 'right: 0;' : 'left: 0;'} bottom: 38px; gap: 8px;"></div>
                    </div>
                `;

                const replyIndicatorHTML = item.replyTo ? `
                    <div style="font-size: 11px; color: #FF8A9A; margin-bottom: 5px; display: flex; flex-direction: column; gap: 2px; max-width: 100%; box-sizing: border-box; min-width: 0; text-align: left; opacity: 0.85; border-left: 2px solid #FF8A9A; padding-left: 6px; margin-left: 4px;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <svg class="material-icon" viewBox="0 0 24 24" style="width:12px;height:12px;transform: scaleX(-1); flex-shrink: 0;" aria-hidden="true"><path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                            <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; min-width: 0; max-width: 100%;">Replied to <strong>${item.replyTo.authorName}</strong></span>
                        </div>
                        <div style="font-style: italic; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%; color: #666; font-size: 10.5px; padding-top: 1px;">"${item.replyTo.text || '[Sticker/Image]'}"</div>
                    </div>
                ` : '';

                messagesArea.innerHTML += `
                    <div class="message-row-container" style="align-items: ${isOwnMsg ? 'flex-end' : 'flex-start'}; padding-bottom: ${isLastInStreak ? '12px' : '2px'}; margin-top: ${isFirstInStreak ? '6px' : '0px'};">
                        ${(!isOwnMsg && isFirstInStreak) ? `<div style="font-size: 12px; color: #FF4D6D; margin-left: 12px; margin-bottom: 4px; font-weight: 500; text-align: left;"><strong>${item.authorName}</strong></div>` : ''}
                        <div style="display: flex; flex-direction: column; align-items: ${isOwnMsg ? 'flex-end' : 'flex-start'}; max-width: 70%; min-width: 0; position:relative;">
                            ${replyIndicatorHTML}
                            <div class="chat-body-row ${isOwnMsg ? 'own' : ''}" style="display: flex; align-items: center; width: 100%; gap: 4px;">
                                <div class="message-text-bubble" data-msg-id="${msgId}" data-author-name="${safeName}" data-text="${safeText}" data-is-own="${isOwnMsg}" ontouchstart="window.handleTouchStart(event)" ontouchmove="window.handleTouchMove(event)" ontouchend="window.handleTouchEnd(event, '${msgId}', '${safeName}', '${safeText}', ${isOwnMsg})" style="position: relative; padding: 8px 12px; border-radius: ${bubbleRadius}; background: ${isOwnMsg ? '#FF4D6D' : '#ffffff'}; color: ${isOwnMsg ? '#ffffff' : '#050505'}; border: ${isOwnMsg ? 'none' : '1px solid #FFE3E7'}; word-break: break-word; box-sizing: border-box; width: auto; max-width: 100%; min-width: 0; text-align: left; will-change: transform; cursor: pointer;">
                                    ${item.text ? `<div style="font-size: 14.5px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;">${item.text}</div>` : ''}${imgHTML}
                                    ${rSummary ? `<div class="reaction-badge-container" style="${isOwnMsg ? 'left: -10px;' : 'right: -10px;'} cursor: pointer;" onclick="window.showReactionDetails('${msgId}')">${rSummary}</div>` : ''}
                                </div>
                                ${actionMenuHTML}
                            </div>
                            <div class="seen-status-indicator" style="text-align: ${isOwnMsg ? 'right' : 'left'}; width: 100%;">✓ Seen</div>
                        </div>
                        ${(!isOwnMsg && isLastInStreak) ? `<span style="font-size: 11px; color: #FF8A9A; margin-left: 12px; margin-top: 4px; text-align: left;">${timeString}</span>` : ''}
                    </div>`;
            });

            if (window.forceScrollToBottomOnce || (isNewMessageAdded && wasNearBottom)) {
                setTimeout(() => { messagesArea.scrollTop = messagesArea.scrollHeight; }, 40);
                window.forceScrollToBottomOnce = false;
            } else {
                messagesArea.scrollTop = previousScrollTop;
            }
        });
    });

    updateSendButtonState();
}

// Global Document Closure overrides preventing stale popup states
document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-emoji-picker') && !e.target.closest('.pref-slot-node')) {
        const p = document.getElementById('global-emoji-picker'); if (p) p.style.display = 'none';
        document.querySelectorAll('.pref-slot-node').forEach(n => n.classList.remove('selected-slot'));
    }
    if (!e.target.closest('#sticker-drawer') && !e.target.closest('#sticker-drawer-trigger-btn') && !e.target.closest('#custom-sticker-upload-input') && !e.target.closest('.stk-delete-indicator')) {
        const sd = document.getElementById('sticker-drawer'); if (sd) sd.style.display = 'none';
    }
    if (!e.target.closest('.absolute-reaction-drawer') && !e.target.closest('.desktop-react-btn')) {
        if (window.closeAllDesktopReactionDrawers) window.closeAllDesktopReactionDrawers();
    }
});

window.clearAllChatHistory = async function() {
    if (!confirm("Are you completely sure you want to permanently delete all chatlogs? This action cannot be undone.")) return;
    try { 
        await remove(ref(db, 'lounge_chats')); 
    } catch (e) { 
        alert("Action rejected."); 
    }
};

export { auth, db };