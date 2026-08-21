import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    getDatabase, ref, push, onValue, remove, runTransaction, update, get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { 
    getStorage, ref as storageRef, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLDSTIj-iK8y-HAR5dwtJNs0KjKlCdeuo",
    authDomain: "keepics-7c48f.firebaseapp.com",
    projectId: "keepics-7c48f",
    storageBucket: "keepics-7c48f.firebasestorage.app",
    messagingSenderId: "869338453647",
    appId: "1:869338453647:web:4d6e5c6abce6712db502fa",
    measurementId: "G-N17QH1743W",
    databaseURL: "https://keepics-7c48f-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); 
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

const activeOpenThreads = new Set();

// Client-side auto compressor engine
export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, quality);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

window.toggleReplySection = function(reviewId) {
    const threadDrawer = document.getElementById(`reply-thread-${reviewId}`);
    if (!threadDrawer) return;

    if (threadDrawer.style.display === "none") {
        threadDrawer.style.display = "block";
        activeOpenThreads.add(reviewId);
    } else {
        threadDrawer.style.display = "none";
        activeOpenThreads.delete(reviewId);
    }
};

window.toggleOptionsMenu = function(id) {
    const menu = document.getElementById(`options-menu-${id}`);
    if (!menu) return;
    
    document.querySelectorAll('.fb-options-dropdown').forEach(el => {
        if (el.id !== `options-menu-${id}`) el.style.display = 'none';
    });

    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};

document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('fb-options-trigger')) {
        document.querySelectorAll('.fb-options-dropdown').forEach(el => el.style.display = 'none');
    }
});

function injectModalStyles() {
    if (document.getElementById('auth-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-modal-styles';
    style.textContent = `
        .logout-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.4); display: flex;
            justify-content: center; align-items: center; z-index: 1000;
        }
        .logout-modal {
            padding: 30px; text-align: center; max-width: 350px; width: 90%;
            background-image: linear-gradient(to bottom right, #fffef5, #fff7fb, #ffffff);
            box-shadow: #8f8f8f 3px 3px 3px; border-radius: 15px; border: 1px solid #7f8c8d;
            box-sizing: border-box;
        }
        .logout-modal h3 { font-family: 'Minecraft', sans-serif; color: #2c3e50; margin-bottom: 20px; font-size: 22px; }
        .modal-btns-vertical { display: flex; flex-direction: column; gap: 10px; width: 100%; box-sizing: border-box; }
        .modal-btns-horizontal { display: flex; gap: 10px; justify-content: center; width: 100%; box-sizing: border-box; }
        .modal-btn {
            padding: 10px 15px; border: none; border-radius: 5px; font-family: 'MC', sans-serif;
            font-weight: bold; cursor: pointer; transition: opacity 0.2s; box-sizing: border-box;
        }
        .modal-btn.member { width: 100%; background-color: #ffdb7e; color: #14171a; }
        .modal-btn.yes { flex: 1; background-color: #ffb0ff; color: white; }
        .modal-btn.no { flex: 1; background-color: #d6d6d6; color: white; }
        .modal-btn:hover { opacity: 0.9; }
        .fb-timestamp { font-size: 13px; color: #657786; font-weight: normal; }
    `;
    document.head.appendChild(style);
}

export function handleNavbarAuth(authStatusLiId) {
    injectModalStyles();
    const authStatusLi = document.getElementById(authStatusLiId);
    if (!authStatusLi) return;

    const cachedStatus = localStorage.getItem('isLoggedIn');
    const cachedName = localStorage.getItem('displayName');

    if (cachedStatus === 'true') {
        authStatusLi.innerHTML = `<a href="#" id="auth-user-link">${cachedName || 'Account'}</a>`;
        document.getElementById('auth-user-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal(cachedName || 'User');
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('displayName', displayName);

            authStatusLi.innerHTML = `<a href="#" id="auth-user-link">${displayName}</a>`;
            document.getElementById('auth-user-link')?.addEventListener('click', (e) => {
                e.preventDefault();
                showLogoutModal(displayName);
            });
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('displayName');
            const isLoginPage = window.location.pathname.includes('login.html');
            authStatusLi.innerHTML = `<a href="login.html" class="${isLoginPage ? 'active' : ''}">Login</a>`;
        }
    });
} 

async function showLogoutModal(displayName) {
    const currentUser = auth.currentUser;
    let memberData = null;

    if (currentUser) {
        try {
            const memberSnap = await get(ref(db, `memberships/${currentUser.uid}`));
            if (memberSnap.exists()) {
                memberData = memberSnap.val();
            }
        } catch (err) {
            console.error("Error fetching member status:", err);
        }
    }

    let memberBtnText = "Account Status";
    if (memberData?.isMember === true) {
        memberBtnText = "KeePics Member";
    } else if (memberData?.status === "pending") {
        memberBtnText = "Verifying Account...";
    }

    const overlay = document.createElement('div');
    overlay.className = 'logout-modal-overlay';
    overlay.innerHTML = `
        <div class="logout-modal">
            <h3>Sign out, ${displayName}</h3>
            <div class="modal-btns-vertical">
                <button class="modal-btn member" id="confirm-logout-member">${memberBtnText}</button>
                <div class="modal-btns-horizontal">
                    <button class="modal-btn yes" id="confirm-logout-yes">Yes</button>
                    <button class="modal-btn no" id="confirm-logout-no">No</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('confirm-logout-yes').addEventListener('click', () => {
        signOut(auth).then(() => {
            overlay.remove();
            window.location.href = "index.html";
        });
    });

    document.getElementById('confirm-logout-member').addEventListener('click', async () => {
        overlay.remove();
        if (typeof window.openMembershipModal !== 'function') {
            await import('./membership.js');
        }
        if (typeof window.openMembershipModal === 'function' && currentUser) {
            window.openMembershipModal(currentUser, memberData);
        }
    });

    document.getElementById('confirm-logout-no').addEventListener('click', () => {
        overlay.remove();
    });
}

let selectedRating = 5; 

export function initCommentsSystem(containerId) {
    const displayArea = document.getElementById(containerId);
    if (!displayArea) return;

    window.setRating = function(ratingValue) {
        selectedRating = ratingValue;
    };

    window.submitComment = async function(inputId, fileInputId) {
        const inputElement = document.getElementById(inputId);
        const text = inputElement.value.trim();
        const fileInput = document.getElementById(fileInputId);
        
        if (!text) return;
        if (!auth.currentUser) {
            alert("Please log in to leave a review!");
            return;
        }

        const submitBtn = document.getElementById('submit-review-btn');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Publishing...";
        submitBtn.disabled = true;

        try {
            let uploadedImageUrl = null;

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const rawFile = fileInput.files[0];
                const compressedBlob = await compressImage(rawFile);
                
                const fileRef = storageRef(storage, `review_attachments/${auth.currentUser.uid}_${Date.now()}`);
                const snapshot = await uploadBytes(fileRef, compressedBlob);
                uploadedImageUrl = await getDownloadURL(snapshot.ref);
            }

            const ratingsRef = ref(db, 'ratings');
            await push(ratingsRef, {
                authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                authorId: auth.currentUser.uid,
                text: text,
                rating: selectedRating,
                timestamp: Date.now(),
                imageUrl: uploadedImageUrl || null
            });
            
            inputElement.value = "";
            if (fileInput) fileInput.value = "";
        } catch (error) {
            console.error("Error writing review: ", error);
            alert("Something went wrong saving your review.");
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    };

    window.deleteOwnReview = async function(reviewId) {
        if (!confirm("Are you sure you want to permanently delete this review?")) return;
        try {
            await remove(ref(db, `ratings/${reviewId}`));
            activeOpenThreads.delete(reviewId);
        } catch (error) {
            console.error("Error deleting review: ", error);
        }
    };

    window.toggleCloudLike = async function(reviewId) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("You must be logged in to like a review!");
            return;
        }

        const userIdentifierName = currentUser.displayName || currentUser.email.split('@')[0];
        const likeRef = ref(db, `ratings/${reviewId}/likes/${currentUser.uid}`);

        try {
            await runTransaction(likeRef, (currentValue) => {
                if (currentValue === null) {
                    return userIdentifierName;
                } else {
                    return null;
                }
            });
        } catch (error) {
            console.error("Like transaction failed: ", error);
        }
    };

    window.submitDevReply = async function(reviewId) {
        const replyInput = document.getElementById(`reply-input-${reviewId}`);
        const replyText = replyInput.value.trim();
        
        if (!replyText) return;
        if (!auth.currentUser) {
            alert("You must be logged in to reply!");
            return;
        }

        try {
            const repliesRef = ref(db, `ratings/${reviewId}/replies`);
            await push(repliesRef, {
                text: replyText,
                authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                authorId: auth.currentUser.uid,
                timestamp: Date.now()
            });
            replyInput.value = "";
        } catch (error) {
            console.error("Error saving reply: ", error);
            alert("Failed to send reply.");
        }
    };

    window.deleteThreadReply = async function(reviewId, replyId) {
        if (!confirm("Are you sure you want to permanently delete this reply?")) return;
        try {
            await remove(ref(db, `ratings/${reviewId}/replies/${replyId}`));
        } catch (error) {
            console.error("Error deleting thread reply: ", error);
        }
    };

    const ratingsRef = ref(db, 'ratings');
    onAuthStateChanged(auth, (user) => {
        const currentUserId = user ? user.uid : null;
        
        onValue(ratingsRef, (snapshot) => {
            const ratingsArray = [];
            const data = snapshot.val();
            
            if (data) {
                Object.keys(data).forEach((key) => {
                    ratingsArray.push({ id: key, ...data[key] });
                });
                ratingsArray.sort((a, b) => b.timestamp - a.timestamp);
            }
            renderRatingsUI(ratingsArray, displayArea, currentUserId);
        });
    });
}

function renderRatingsUI(allRatings, displayArea, currentUserId) {
    displayArea.innerHTML = "";
    
    if (allRatings.length === 0) {
        displayArea.innerHTML = `<p style="color: #7f8c8d; font-style: italic; text-align: center;">No reviews yet. Be the first to rate us!</p>`;
        return;
    }

    allRatings.forEach(item => {
        const ADMIN_UID = 'nf6DyVHXpbTMxbtpDS9YicgGIYu1';
        const DEV_UID = '4dyuS34hliSLb0Ew0wGytuSviTG2';
        const SERVICES_ADMIN_UID = 'hCys7QbIUrbSdVwZm1eDGY3KBrP2';
        
        const isAdmin = item.authorName === "KeePics." || item.authorId === ADMIN_UID || item.authorId === SERVICES_ADMIN_UID;
        const isDev = item.authorId === DEV_UID;

        const starPath = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
        const starSvg = (filled) => `<svg class="review-star" viewBox="0 0 24 24" style="width:16px;height:16px;display:inline-block;vertical-align:middle;" aria-hidden="true"><path fill="${filled ? '#f1c40f' : '#d5d5d5'}" d="${starPath}"/></svg>`;
        let starsHTML = "";
        if (!(isAdmin || isDev)) {
            for (let si = 0; si < 5; si++) starsHTML += starSvg(si < item.rating);
        }
        const baseBadgeStyle = "font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; font-weight: bold; display: inline-block;";
        
        let badgeHTML = "";
        if (isDev) {
            badgeHTML = `<span class="dev-badge" style="background-color: #ffb800; color: #14171a; ${baseBadgeStyle}">Developer</span>`;
        } else if (isAdmin) {
            badgeHTML = `<span class="admin-badge" style="background-color: #B73B49; color: white; ${baseBadgeStyle}">Admin</span>`;
        }

        const canDeleteMain = currentUserId && (item.authorId === currentUserId || currentUserId === ADMIN_UID || currentUserId === DEV_UID || currentUserId === SERVICES_ADMIN_UID);
        let optionsButtonHTML = "";
        if (canDeleteMain) {
            optionsButtonHTML = `
                <div style="position: relative; display: inline-block; margin-left: auto;">
                    <span class="fb-options-trigger" style="cursor: pointer; color: #657786; font-weight: bold; font-size: 18px; padding: 0 8px;" onclick="toggleOptionsMenu('${item.id}')">···</span>
                    <div id="options-menu-${item.id}" class="fb-options-dropdown" style="display: none; position: absolute; right: 0; top: 20px; background: white; border: 1px solid #ccd6dd; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; z-index: 100; min-width: 100px;">
                        <div style="color: #B73B49; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: bold; text-align: left;" onclick="deleteOwnReview('${item.id}')">Delete</div>
                    </div>
                </div>
            `;
        }

        let existingRepliesHTML = "";
        let replyCount = 0;

        if (item.replies) {
            const replyKeys = Object.keys(item.replies);
            replyCount = replyKeys.length;

            replyKeys.forEach(replyId => {
                const replyItem = item.replies[replyId];
                if (replyItem && replyItem.text) {
                    const replyIsAdmin = replyItem.authorName === "KeePics." || replyItem.authorId === ADMIN_UID;
                    const replyIsDev = replyItem.authorId === DEV_UID;
                    
                    let replyBadgeHTML = "";
                    if (replyIsDev) {
                        replyBadgeHTML = `<span style="background-color: #ffb800; color: #14171a; font-size: 10px; padding: 1px 5px; border-radius: 4px; margin-left: 6px; font-weight: bold; display: inline-block;">Developer</span>`;
                    } else if (replyIsAdmin) {
                        replyBadgeHTML = `<span style="background-color: #B73B49; color: white; font-size: 10px; padding: 1px 5px; border-radius: 4px; margin-left: 6px; font-weight: bold; display: inline-block;">Admin</span>`;
                    }

                    const canDeleteReply = currentUserId && (replyItem.authorId === currentUserId || replyItem.authorId === ADMIN_UID || replyItem.authorId === DEV_UID || currentUserId === SERVICES_ADMIN_UID);
                    const replyDeleteButtonHTML = canDeleteReply 
                        ? ` · <span style="color: #B73B49; cursor: pointer; font-size: 11px;" onclick="deleteThreadReply('${item.id}', '${replyId}')">Delete</span>`
                        : "";

                    existingRepliesHTML += `
                        <div class="dev-reply-box" style="margin: 12px 0 8px 12px; padding: 10px 14px; background: #f5f8fa; border-left: 3px solid #ffb800; border-radius: 4px 12px 12px 4px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px; margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; flex-wrap: wrap;">
                                    <span style="font-weight: bold; font-size: 14px; color: #14171a;">${replyItem.authorName || 'User'}</span>
                                    ${replyBadgeHTML}
                                </div>
                            </div>
                            <div style="font-size: 14px; color: #1c1e21; line-height: 1.4; word-break: break-word;">${replyItem.text}</div>
                            <div style="font-size: 12px; margin-top: 4px; color: #657786;">
                                ${replyDeleteButtonHTML}
                            </div>
                        </div>
                    `;
                }
            });
        }

        let replyFormHTML = "";
        const isCurrentUserAdmin = currentUserId === ADMIN_UID;
        const isCurrentUserDev = currentUserId === DEV_UID;
        const commentBelongsToStaff = isAdmin || isDev;

        if (currentUserId && (isCurrentUserAdmin || isCurrentUserDev || commentBelongsToStaff)) {
            replyFormHTML = `
                <div style="margin: 10px 0 0 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="reply-input-${item.id}" placeholder="Reply to this review..." autocomplete="off" style="flex: 1; min-width: 150px; padding: 6px 12px; border: 1px solid #ccd6dd; border-radius: 9999px; font-size: 13px; outline: none; background: #fff; box-sizing: border-box;">
                    <button onclick="submitDevReply('${item.id}')" style="background: #ffb800; color: #14171a; border: none; padding: 6px 16px; border-radius: 9999px; font-weight: bold; font-size: 13px; cursor: pointer; white-space: nowrap;">Reply</button>
                </div>
            `;
        }

        let replyActionButtonHTML = "";
        const thresholdMet = replyCount >= 2;

        const commentIconSvg = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:3px;" aria-hidden="true"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>';

        if (thresholdMet) {
            replyActionButtonHTML = ` · <span class="reply-toggle-btn" style="color: #657786; cursor: pointer; font-weight: bold; white-space: nowrap;" onclick="toggleReplySection('${item.id}')">${commentIconSvg}View Replies (${replyCount})</span>`;
        } else if (replyCount === 0 && (isCurrentUserAdmin || isCurrentUserDev || commentBelongsToStaff)) {
            replyActionButtonHTML = ` · <span class="reply-toggle-btn" style="color: #657786; cursor: pointer; white-space: nowrap;" onclick="toggleReplySection('${item.id}')">${commentIconSvg}Reply</span>`;
        }

        let conditionalThreadHTML = "";
        const wasPreviouslyOpen = activeOpenThreads.has(item.id);
        
        let displayStyle = "none";
        if (replyCount === 1 || wasPreviouslyOpen) {
            displayStyle = "block";
        }

        conditionalThreadHTML = `
            ${replyCount === 1 ? existingRepliesHTML : ''}
            <div id="reply-thread-${item.id}" style="display: ${displayStyle}; width: 100%;">
                ${replyCount !== 1 ? existingRepliesHTML : ''}
                ${replyFormHTML}
            </div>
        `;

        const attachedImageHTML = item.imageUrl ? `
            <div class="fb-attached-image-container" style="margin-top: 12px; border-radius: 12px; overflow: hidden; max-width: 100%; border: 1px solid #e1e8ed; max-height: 280px; display: flex; background: #f5f8fa;">
                <img src="${item.imageUrl}" alt="User attachment" style="width: 100%; height: auto; object-fit: cover; cursor: zoom-in;" onclick="window.open('${item.imageUrl}', '_blank')">
            </div>
        ` : '';

        displayArea.innerHTML += `
            <div class="fb-comment" id="${item.id}" style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; width: 100%; box-sizing: border-box;">
                <div class="fb-bubble" style="width: 100%; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; width: 100%;">
                        <div style="flex: 1; min-width: 120px;">
                            <div class="fb-author" style="font-weight: bold; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                                ${item.authorName} ${badgeHTML}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                            ${starsHTML ? `<div class="review-stars-display" style="color: #f1c40f; white-space: nowrap;">${starsHTML}</div>` : ''}
                            ${optionsButtonHTML}
                        </div>
                    </div>
                    <div class="fb-text" style="margin-top: 8px; word-break: break-word; line-height: 1.4;">${item.text}</div>
                    ${attachedImageHTML}
                </div>
                <div class="fb-actions" style="margin-top: 5px; font-size: 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px;">
                    ${replyActionButtonHTML}
                </div>
                ${conditionalThreadHTML}
            </div>`;
    });
}
export { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification, db, storage };