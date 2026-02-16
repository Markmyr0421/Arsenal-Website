// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================
// REPLACE WITH YOUR FIREBASE CONFIG (See Firebase_Setup_Instructions.md)
const firebaseConfig = {
    apiKey: "AIzaSyBH8fbKcOnI1ejfZsRUYzC40qW6Z89ypx8",
    authDomain: "mark-myr-arsenal-website.firebaseapp.com",
    databaseURL: "https://mark-myr-arsenal-website-default-rtdb.firebaseio.com",
    projectId: "mark-myr-arsenal-website",
    storageBucket: "mark-myr-arsenal-website.firebasestorage.app",
    messagingSenderId: "500235602140",
    appId: "1:500235602140:web:ddbce428f498e21bd84c19",
    measurementId: "G-9VR65JWHR8"
  };

// Initialize Firebase
let database, pendingRef, approvedRef, rejectedRef, analytics;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
    } else {
        console.log('ℹ️ Firebase already initialized');
    }
    database = firebase.database();
    console.log('✅ Firebase database connected');

    // Initialize Firebase Analytics
    if (typeof firebase.analytics === 'function') {
        analytics = firebase.analytics();
        console.log('✅ Firebase Analytics initialized');
        // Log page view
        analytics.logEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    } else {
        console.warn('⚠️ Firebase Analytics not available (SDK not loaded)');
    }

    // Database references
    pendingRef = database.ref('pendingSubmissions');
    approvedRef = database.ref('approvedSubmissions');
    rejectedRef = database.ref('rejectedSubmissions');
    console.log('✅ Database references created');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('Firebase connection failed! Check console for details.');
}

// Category names for display
const CATEGORY_NAMES = {
    '1': 'Player Types & Roles',
    '2': 'Skills & Moves',
    '3': 'Match Situations',
    '4': 'Fouls & Physical Play',
    '5': 'Fans & Culture',
    '6': 'Tactics & Strategy',
    '7': 'Miscellaneous / General Slang'
};

// ============================================
// FORM SUBMISSION
// ============================================
async function submitNewSlang(formData) {
    try {
        const { slangTerm, category, meaning, example, demoUrl, submitterName } = formData;
        
        // Check if term already exists in approved submissions
        const approvedSnapshot = await approvedRef.once('value');
        const approvedData = approvedSnapshot.val();
        
        if (approvedData) {
            const normalizedInput = normalizeSlangTerm(slangTerm);
            for (let submission of Object.values(approvedData)) {
                if (normalizeSlangTerm(submission.slangTerm) === normalizedInput) {
                    throw new Error('DUPLICATE');
                }
            }
        }
        
        // Check if term already exists in pending submissions
        const pendingSnapshot = await pendingRef.once('value');
        const pendingData = pendingSnapshot.val();
        
        if (pendingData) {
            const normalizedInput = normalizeSlangTerm(slangTerm);
            for (let submission of Object.values(pendingData)) {
                if (normalizeSlangTerm(submission.slangTerm) === normalizedInput) {
                    throw new Error('DUPLICATE_PENDING');
                }
            }
        }
        
        // Check if term was previously rejected
        const rejectedSnapshot = await rejectedRef.once('value');
        const rejectedData = rejectedSnapshot.val();
        let previouslyRejected = null;
        
        if (rejectedData) {
            Object.values(rejectedData).forEach(submission => {
                if (submission.slangTerm.toLowerCase() === slangTerm.toLowerCase()) {
                    previouslyRejected = submission;
                }
            });
        }
        
        if (previouslyRejected) {
            return { success: false, type: 'REJECTED', reason: previouslyRejected.rejectionReason };
        }
        
        // Create submission object
        const submission = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            slangTerm: slangTerm.trim(),
            category: category,
            meaning: meaning.trim(),
            example: example.trim(),
            demoUrl: demoUrl.trim(),
            submitterName: submitterName.trim(),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Save to Firebase
        await pendingRef.child(submission.id).set(submission);
        
        // Log analytics event
        if (analytics) {
            analytics.logEvent('slang_submission', {
                category: CATEGORY_NAMES[category],
                category_id: category,
                has_demo_url: !!demoUrl,
                has_submitter_name: !!submitterName
            });
        }
        
        return { success: true };
        
    } catch (error) {
        if (error.message === 'DUPLICATE') {
            return { success: false, type: 'DUPLICATE' };
        } else if (error.message === 'DUPLICATE_PENDING') {
            return { success: false, type: 'DUPLICATE_PENDING' };
        }
        console.error('Error submitting:', error);
        return { success: false, type: 'ERROR', error: error };
    }
}

// ============================================
// LOAD FUNCTIONS
// ============================================
function loadPendingSubmissions() {
    const container = document.getElementById('pendingSubmissions');
    container.innerHTML = '<p class="admin-info">Loading...</p>';
    
    pendingRef.once('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data || Object.keys(data).length === 0) {
            container.innerHTML = '<p class="admin-info">No pending submissions.</p>';
            return;
        }

        let html = '<div class="submissions-list">';
        Object.values(data).forEach((submission) => {
            html += `
                <div class="submission-item" data-id="${submission.id}">
                    <div class="submission-header">
                        <h3>${submission.slangTerm}</h3>
                        <span class="submission-category">Category ${submission.category}: ${CATEGORY_NAMES[submission.category]}</span>
                    </div>
                    <div class="submission-details">
                        <p><strong>Meaning:</strong> ${submission.meaning}</p>
                        <p><strong>Example:</strong> "${submission.example}"</p>
                        ${submission.demoUrl ? `<p><strong>Demo URL:</strong> <a href="${submission.demoUrl}" target="_blank">${submission.demoUrl}</a></p>` : ''}
                        ${submission.submitterName ? `<p><strong>Submitted by:</strong> ${submission.submitterName}</p>` : ''}
                        <p class="submission-time">Submitted: ${new Date(submission.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="submission-actions">
                        <button onclick="approveSubmission('${submission.id}')" class="approve-btn">✓ Approve</button>
                        <button onclick="editSubmission('${submission.id}')" class="edit-btn">✎ Edit</button>
                        <button onclick="rejectSubmission('${submission.id}')" class="reject-btn">✗ Reject</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    });
}

function loadRejectedSubmissions() {
    const container = document.getElementById('rejectedSubmissions');
    container.innerHTML = '<p class="admin-info">Loading...</p>';
    
    rejectedRef.once('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data || Object.keys(data).length === 0) {
            container.innerHTML = '<p class="admin-info">No rejected submissions to display.</p>';
            return;
        }

        let html = '<div class="rejected-list">';
        Object.values(data).forEach((submission) => {
            html += `
                <div class="rejected-item">
                    <div class="rejected-header">
                        <h3>${submission.slangTerm}</h3>
                        <span class="rejected-category">Category ${submission.category}: ${CATEGORY_NAMES[submission.category]}</span>
                    </div>
                    <div class="rejected-details">
                        <p><strong>Meaning:</strong> ${submission.meaning}</p>
                        <p><strong>Example:</strong> "${submission.example}"</p>
                        <div class="rejection-reason-box">
                            <strong>❌ Rejection Reason:</strong>
                            <p class="rejection-reason">${submission.rejectionReason || 'No reason provided'}</p>
                        </div>
                        ${submission.submitterName ? `<p><strong>Submitted by:</strong> ${submission.submitterName}</p>` : ''}
                        <p class="rejected-time">Rejected: ${new Date(submission.rejectedAt || submission.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    });
}

function loadApprovedSubmissions() {
    approvedRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data) return;
        
        Object.values(data).forEach(submission => {
            // Find the appropriate category section
            const categorySection = document.querySelector(`.category-section:nth-child(${parseInt(submission.category)})`);
            if (!categorySection) return;

            const table = categorySection.querySelector('.slang-table tbody');
            if (!table) return;

            // Check if already added
            const existingRow = Array.from(table.querySelectorAll('tr')).find(row => {
                const slangCell = row.querySelector('td strong');
                return slangCell && slangCell.textContent.trim().toLowerCase() === submission.slangTerm.toLowerCase();
            });

            if (existingRow) return; // Already exists

            // Create new row
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td data-label="Slang"><strong>${submission.slangTerm}</strong></td>
                <td data-label="Meaning">${submission.meaning}</td>
                <td data-label="Example">"${submission.example}"</td>
                <td data-label="Demo">${submission.demoUrl ? `<a href="${submission.demoUrl}" target="_blank" rel="noopener noreferrer">Watch Demo</a>` : ''}</td>
            `;
            newRow.setAttribute('data-submission-id', submission.id);
            table.appendChild(newRow);
        });
    });
}

// ============================================
// ADMIN FUNCTIONS
// ============================================
async function approveSubmission(id) {
    try {
        // Get the submission from pending
        const snapshot = await pendingRef.child(id).once('value');
        const submission = snapshot.val();
        
        if (!submission) {
            alert('Submission not found!');
            return;
        }

        // Add to approved submissions
        await approvedRef.child(id).set(submission);

        // Remove from pending
        await pendingRef.child(id).remove();

        // Log analytics event
        if (analytics) {
            analytics.logEvent('admin_approve', {
                slang_term: submission.slangTerm,
                category: CATEGORY_NAMES[submission.category]
            });
        }

        alert('Submission approved! It will now appear in the dictionary for all users.');
        
        // Reload displays
        loadPendingSubmissions();
        
    } catch (error) {
        console.error('Error approving submission:', error);
        alert('Error approving submission. Please try again.');
    }
}

async function editSubmission(id) {
    try {
        // Get the submission from pending
        const snapshot = await pendingRef.child(id).once('value');
        const submission = snapshot.val();
        
        if (!submission) {
            alert('Submission not found!');
            return;
        }

        // Prompt for edits
        const editedSlang = prompt('Edit Slang Term:', submission.slangTerm) || submission.slangTerm;
        const editedMeaning = prompt('Edit Meaning:', submission.meaning) || submission.meaning;
        const editedExample = prompt('Edit Example:', submission.example) || submission.example;
        const editedDemoUrl = prompt('Edit Demo URL (or leave empty):', submission.demoUrl) || '';

        // Update submission
        submission.slangTerm = editedSlang;
        submission.meaning = editedMeaning;
        submission.example = editedExample;
        submission.demoUrl = editedDemoUrl;
        submission.edited = true;
        submission.editTimestamp = new Date().toISOString();

        await pendingRef.child(id).set(submission);
        loadPendingSubmissions();
        
    } catch (error) {
        console.error('Error editing submission:', error);
        alert('Error editing submission. Please try again.');
    }
}

async function rejectSubmission(id) {
    const rejectionReason = prompt('Please provide a reason for rejection (this will be visible to the submitter):\n\nExamples:\n- "Term already exists in the dictionary"\n- "Not a commonly used soccer slang term"\n- "Inappropriate content"\n- "Needs more context or better example"', '');
    
    if (rejectionReason === null) return; // User cancelled
    
    try {
        // Get the submission from pending
        const snapshot = await pendingRef.child(id).once('value');
        const submission = snapshot.val();
        
        if (!submission) {
            alert('Submission not found!');
            return;
        }

        // Add rejection reason
        submission.rejectionReason = rejectionReason.trim() || 'No reason provided';
        submission.status = 'rejected';
        submission.rejectedAt = new Date().toISOString();

        // Move to rejected submissions
        await rejectedRef.child(id).set(submission);

        // Remove from pending
        await pendingRef.child(id).remove();

        // Log analytics event
        if (analytics) {
            analytics.logEvent('admin_reject', {
                slang_term: submission.slangTerm,
                category: CATEGORY_NAMES[submission.category],
                reason_provided: !!rejectionReason.trim()
            });
        }

        alert('Submission rejected. The reason will be visible to users.');
        
        // Reload displays
        loadPendingSubmissions();
        loadRejectedSubmissions();
        
    } catch (error) {
        console.error('Error rejecting submission:', error);
        alert('Error rejecting submission. Please try again.');
    }
}

// ============================================
// CLEAR FUNCTIONS
// ============================================
async function clearAllData() {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL pending submissions, rejected submissions, and approved submissions.\n\nAre you absolutely sure?')) {
        return;
    }
    
    if (!confirm('This action cannot be undone. Are you REALLY sure?')) {
        return;
    }

    try {
        await pendingRef.remove();
        await rejectedRef.remove();
        await approvedRef.remove();
        
        // Remove approved submissions from dictionary
        document.querySelectorAll('[data-submission-id]').forEach(row => {
            row.remove();
        });
        
        // Reload displays
        loadPendingSubmissions();
        loadRejectedSubmissions();
        
        alert('✓ All submissions and rejections have been cleared.');
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
    }
}

async function clearPendingOnly() {
    if (!confirm('Are you sure you want to clear all pending submissions?')) {
        return;
    }

    try {
        await pendingRef.remove();
        loadPendingSubmissions();
        alert('✓ All pending submissions have been cleared.');
    } catch (error) {
        console.error('Error clearing pending:', error);
        alert('Error clearing data. Please try again.');
    }
}

async function clearRejectedOnly() {
    if (!confirm('Are you sure you want to clear all rejected submissions?')) {
        return;
    }

    try {
        await rejectedRef.remove();
        loadRejectedSubmissions();
        alert('✓ All rejected submissions have been cleared.');
    } catch (error) {
        console.error('Error clearing rejected:', error);
        alert('Error clearing data. Please try again.');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function normalizeSlangTerm(term) {
    // Remove all spaces and convert to lowercase for comparison
    return term.toLowerCase().replace(/\s+/g, '');
}

function getAllExistingSlangTerms() {
    const existingTerms = [];
    
    // Get all slang terms from the static HTML table
    document.querySelectorAll('.slang-table tbody tr').forEach(row => {
        const slangCell = row.querySelector('td strong');
        if (slangCell) {
            const term = slangCell.textContent.trim();
            existingTerms.push(normalizeSlangTerm(term));
        }
    });
    
    return existingTerms;
}

// ============================================
// REAL-TIME LISTENERS
// ============================================
function setupRealtimeListeners() {
    // Listen for changes to rejected submissions (for all users)
    rejectedRef.on('value', () => {
        loadRejectedSubmissions();
    });
    
    // Listen for changes to approved submissions (for all users)
    loadApprovedSubmissions(); // This already has .on('value') inside
}

