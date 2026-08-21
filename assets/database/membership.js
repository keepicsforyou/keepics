import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/a1e63f151d76e68502b50191e9ef4195";

function injectMembershipStyles() {
    if (document.getElementById('membership-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'membership-modal-styles';
    style.textContent = `
        .member-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.4); display: flex;
            justify-content: center; align-items: center; z-index: 1000;
        }
        .member-modal {
            padding: 30px; text-align: center; max-width: 350px; width: 90%;
            background-image: linear-gradient(to bottom right, #fffef5, #fff7fb, #ffffff);
            box-shadow: #8f8f8f 3px 3px 3px; border-radius: 15px; border: 1px solid #7f8c8d;
            box-sizing: border-box;
        }
        .member-modal h3 { 
            font-family: 'Minecraft', sans-serif; 
            color: #2c3e50; 
            margin-bottom: 15px; 
            font-size: 22px; 
        }
        .member-modal p {
            color: #555;
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 10px;
        }
        .member-modal .fee-tag {
            font-size: 18px;
            font-weight: bold;
            color: #B73B49;
            margin-bottom: 10px;
        }
        .member-modal-btns { display: flex; gap: 15px; justify-content: center; margin-top: 15px; }
        .member-modal-btn {
            padding: 10px 25px; border: none; border-radius: 5px; font-family: 'MC', sans-serif;
            font-weight: bold; cursor: pointer; transition: opacity 0.2s;
        }
        .member-modal-btn.yes { background-color: #ffb0ff; color: white; }
        .member-modal-btn.no { background-color: #d6d6d6; color: white; }
        .member-modal-btn:hover { opacity: 0.9; }
        .member-status-tag {
            display: inline-block;
            padding: 8px 16px;
            background-color: #fff3cd;
            color: #856404;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 15px;
        }
    `;
    document.head.appendChild(style);
}

export function initMembershipSystem() {
    injectMembershipStyles();

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const memberRef = ref(db, `memberships/${user.uid}`);
        
        onValue(memberRef, (snapshot) => {
            const memberData = snapshot.val();
            bindAccountClick(user, memberData);
        });
    });
}

function bindAccountClick(user, memberData) {
    const accountLink = document.getElementById('auth-user-link');
    if (!accountLink) return;

    accountLink.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openMembershipModal(user, memberData);
    };
}

export function openMembershipModal(user, memberData) {
    const existingOverlay = document.getElementById('membership-modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'membership-modal-overlay';
    overlay.className = 'member-modal-overlay';

    let contentHTML = "";

    if (memberData && memberData.isMember === true) {
        const verifiedDate = memberData.verifiedAt || memberData.memberSince || 'N/A';
        const appealedDate = memberData.appliedAt || 'N/A';

        contentHTML = `
            <div class="member-modal">
                <h3>KeePics Member</h3>
                <p>Member since: <strong>${appealedDate}</strong></p>
                <div class="member-modal-btns">
                    <button class="member-modal-btn no" id="close-member-modal">Close</button>
                </div>
            </div>
        `;
    } 
    else if (memberData && memberData.status === "pending") {
        const appealedDate = memberData.appliedAt || 'N/A';

        contentHTML = `
            <div class="member-modal">
                <h3>Become a Member</h3>
                <div class="member-status-tag">Approval Waiting...</div>
                <p>Your application details were submitted and are currently under review.</p>
                <p>Date Appealed: <strong>${appealedDate}</strong></p>
                <div class="member-modal-btns">
                    <button class="member-modal-btn no" id="close-member-modal">Close</button>
                </div>
            </div>
        `;
    } 
    else {
        contentHTML = `
            <div class="member-modal">
                <h3>Become a Member</h3>
                <div class="fee-tag">Membership Fee: ₱8.00</div>
                <p>Becoming a member requires you to pay ₱8. Get access to special discount vouchers (₱3, ₱4, ₱5, ₱6), store points, and keep your physical card as a souvenir!</p>
                <div class="member-modal-btns">
                    <button class="member-modal-btn yes" id="submit-member-request">Apply</button>
                    <button class="member-modal-btn no" id="close-member-modal">Cancel</button>
                </div>
            </div>
        `;
    }

    overlay.innerHTML = contentHTML;
    document.body.appendChild(overlay);

    document.getElementById('close-member-modal')?.addEventListener('click', () => overlay.remove());

    const requestBtn = document.getElementById('submit-member-request');
    if (requestBtn) {
        requestBtn.addEventListener('click', () => sendMembershipDetails(user, overlay));
    }
}

window.openMembershipModal = openMembershipModal;

async function sendMembershipDetails(user, overlay) {
    const submitBtn = document.getElementById('submit-member-request');
    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    const formattedDate = new Date().toLocaleDateString();

    const payload = {
        uid: user.uid,
        email: user.email || 'N/A',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        fee: "₱8.00",
        appliedAt: formattedDate
    };

    try {
        await fetch(FORMSUBMIT_ENDPOINT, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const memberRef = ref(db, `memberships/${user.uid}`);
        await set(memberRef, {
            status: "pending",
            isMember: false,
            appliedAt: formattedDate
        });

        overlay.remove();
    } catch (error) {
        console.error("FormSubmit request failed:", error);
        alert("Failed to send details. Please try again.");
        submitBtn.innerText = "Apply";
        submitBtn.disabled = false;
    }
}

initMembershipSystem();