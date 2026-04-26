/**
 * Nexora Elite Content Script - MASTER ENGINE
 * Includes Bypasses for VU, DigiSkills, and CISCO.
 */

console.log('🛡️ Nexora Elite: Power Engine Initialized');

// 1. ONE-CLICK LECTURE BYPASS (VU, DigiSkills, CISCO)
async function bypassLectures() {
    const data = await chrome.storage.local.get('autoBypass');
    if (data.autoBypass === false) return; 

    console.log('⚡ Attempting Multi-Platform Bypass...');
    
    const video = document.querySelector('video');
    if (video) {
        video.currentTime = video.duration - 1;
        video.play();
        console.log('✅ Video Bypassed');
    }
    
    if (window.location.host.includes('digiskills.pk')) {
        const nextBtn = document.querySelector('.next-btn, #btnNext, .btn-next');
        if (nextBtn) nextBtn.click();
    }

    if (window.location.host.includes('netacad.com')) {
        const ciscoNext = document.querySelector('.next-button, [aria-label="Next"]');
        if (ciscoNext) ciscoNext.click();
    }
}

// 2. AI SOLVER & QUESTION EXTRACTION
async function solveWithAI() {
    const data = await chrome.storage.local.get('aiSolver');
    if (data.aiSolver === false) return;

    const questionText = extractQuestion();
    if (!questionText) {
        alert('❌ Could not find a clear question on this page.');
        return;
    }
    
    window.open(`https://hmnexora.tech/ai-assistant?q=${encodeURIComponent("Please solve this academic question professionally: " + questionText)}`, '_blank');
}

function extractQuestion() {
    const selectors = [
        '.question-text', '.assignment-desc', '#questionContent', 
        '.quiz-question', 'article.content', '.course-content h1'
    ];
    
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.length > 20) return el.innerText;
    }
    
    const selected = window.getSelection().toString();
    if (selected.length > 10) return selected;
    
    return document.body.innerText.substring(0, 1000);
}

// 3. PERFECT PDF GENERATOR
function downloadPerfectPDF(solutionText = "") {
    const studentId = localStorage.getItem('lmsId') || 'BCXXXXXXXX';
    const course = document.querySelector('.page-title, h1')?.innerText || 'Course';
    
    // Sanitize filename
    const filename = `${course.replace(/\s+/g, '_')}_Assignment_NexoraElite`.substring(0, 50);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${filename}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; color: #1a202c; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #22d3ee; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
                .elite { color: #22d3ee; }
                .meta { margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 5px solid #22d3ee; }
                .meta p { margin: 5px 0; font-weight: bold; }
                .question-box { background: #fff; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 30px; }
                .solution-box { white-space: pre-wrap; margin-top: 20px; }
                .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">VIRTUAL UNIVERSITY <span class="elite">SOLUTIONS</span></div>
                <p>Nexora Elite Academic Companion</p>
            </div>
            <div class="meta">
                <p>STUDENT ID: ${studentId}</p>
                <p>COURSE: ${course}</p>
                <p>DATE: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="question-box">
                <h2 style="color: #22d3ee;">Question:</h2>
                <p>${extractQuestion()}</p>
            </div>
            <div class="solution-box">
                <h2 style="color: #22d3ee;">Solution:</h2>
                <p>${solutionText || 'Paste your AI-generated solution here before printing, or use the automated solve feature.'}</p>
            </div>
            <div class="footer">
                Generated with Nexora Elite - The #1 VU Student Hub
            </div>
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <p>Ready to save? The print dialog should open automatically.</p>
                <button onclick="window.print()" style="background: #22d3ee; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">🖨️ Open Print Manually</button>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 1000);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// 4. QUIZ & GDB UNLOCKER
function unlockQuiz() {
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        el.style.userSelect = 'auto';
        // @ts-ignore
        el.oncontextmenu = null;
        // @ts-ignore
        el.oncopy = null;
    });

    document.oncontextmenu = null;
    document.onselectstart = null;
    
    // Force CSS override
    const style = document.createElement('style');
    style.innerHTML = `
        * { user-select: auto !important; -webkit-user-select: auto !important; }
        .no-select { user-select: auto !important; }
        #nexora-hub-float { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); z-index: 999999; }
    `;
    document.head.appendChild(style);

    // Add Solve & Save Button
    if ((window.location.href.includes('Quiz') || window.location.href.includes('Assignment')) && !document.getElementById('nexora-solve-btn')) {
        const actionGroup = document.createElement('div');
        actionGroup.id = 'nexora-action-group';
        actionGroup.innerHTML = `
            <button id="nexora-solve-btn" class="nexora-action-btn">🤖 Solve with AI</button>
            <button id="nexora-pdf-btn" class="nexora-action-btn" style="bottom: 160px;">📥 Perfect PDF</button>
        `;
        document.body.appendChild(actionGroup);
        
        document.getElementById('nexora-solve-btn').onclick = solveWithAI;
        document.getElementById('nexora-pdf-btn').onclick = () => downloadPerfectPDF();
    }
}

// 5. GDB & UI BYPASS (EXPERIMENTAL)
function restoreGDBEditor() {
    console.log('🔓 Attempting Advanced GDB Editor Restore...');
    
    // 1. Try to find the submitted text
    let submittedText = "";
    const submissionContainers = document.querySelectorAll('.submission-box, .gdb-answer, #pnlAnswer, .well');
    submissionContainers.forEach(container => {
        if (container.innerText.length > 10 && !container.querySelector('textarea')) {
            submittedText = container.innerText.trim();
        }
    });

    // 2. Find or Recreate the Editor
    let textarea = document.querySelector('textarea, .ck-editor__editable');
    if (!textarea) {
        // If uni removed textarea, try to re-inject one where the answer was
        const target = document.querySelector('.submission-box, .gdb-answer, #pnlAnswer') || document.body;
        const newEditor = document.createElement('textarea');
        newEditor.id = 'nexora-restored-editor';
        newEditor.style.width = '100%';
        newEditor.style.height = '300px';
        newEditor.style.marginTop = '20px';
        newEditor.style.padding = '15px';
        newEditor.style.background = '#1e293b';
        newEditor.style.color = '#fff';
        newEditor.style.border = '1px solid #22d3ee';
        newEditor.value = submittedText;
        target.prepend(newEditor);
        textarea = newEditor;
        console.log('✨ Re-injected New Editor');
    } else {
        // If textarea exists but is hidden/disabled
        textarea.disabled = false;
        textarea.parentElement.style.display = 'block';
        textarea.style.display = 'block';
        textarea.style.visibility = 'visible';
        if (submittedText && !textarea.value) textarea.value = submittedText;
        console.log('✅ Restored Hidden Editor');
    }

    // 3. Force Show Submit Buttons
    const submitBtns = document.querySelectorAll('input[type="submit"], button[type="submit"], .btn-submit, #btnSubmit');
    submitBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.display = 'inline-block';
        btn.style.visibility = 'visible';
    });
    
    // 4. Clean up submission messages
    document.querySelectorAll('.label-success, .alert-success').forEach(el => {
        if (el.innerText.toLowerCase().includes('submitted')) el.style.display = 'none';
    });

    alert('✅ Advanced Unlock Successful!\n\nYou can now edit your previous answer and attempt to resubmit.\nIf the "Submit" button still fails, the university has blocked re-submission on their server.');
}

function unblockLMSUI() {
    console.log('🚫 Removing UI Blocks/Overlays...');
    // VU LMS known overlays for fees/notifications
    const overlays = [
        '.modal-backdrop', '.modal', '#fee-block-overlay', 
        '.notification-overlay', '[id*="challan"]'
    ];
    
    overlays.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
            el.style.display = 'none !important';
            el.remove();
        });
    });
    
    // Enable scroll if modal blocked it
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    console.log('✅ UI Unblocked');
}

// 6. HUB INJECTION
function injectNexoraHub() {
    const body = document.body;
    if (body && !document.querySelector('.nexora-sidebar-hub')) {
        const hub = document.createElement('div');
        hub.className = 'nexora-sidebar-hub';
        hub.innerHTML = `
            <div class="hub-header">NEXORA ELITE</div>
            <div class="hub-links">
                <a href="#" id="hub-bypass">⚡ Lecture Bypass</a>
                <a href="#" id="hub-solve">🤖 AI Solver</a>
                <a href="#" id="hub-pdf">📄 Perfect PDF</a>
                <a href="#" id="hub-gdb">🔓 GDB Unlocker</a>
                <a href="#" id="hub-unblock">🚫 UI Unblocker</a>
            </div>
        `;
        document.body.appendChild(hub);
        
        document.getElementById('hub-bypass').onclick = (e) => { e.preventDefault(); bypassLectures(); };
        document.getElementById('hub-solve').onclick = (e) => { e.preventDefault(); solveWithAI(); };
        document.getElementById('hub-pdf').onclick = (e) => { e.preventDefault(); downloadPerfectPDF(); };
        document.getElementById('hub-gdb').onclick = (e) => { e.preventDefault(); restoreGDBEditor(); };
        document.getElementById('hub-unblock').onclick = (e) => { e.preventDefault(); unblockLMSUI(); };
    }
}

function generateCoverPage() {
    const studentId = localStorage.getItem('lmsId') || 'BCXXXXXXXX';
    const course = document.querySelector('.page-title, h1')?.innerText || 'Course Name';
    
    const coverText = `
--------------------------------------------------
VIRTUAL UNIVERSITY OF PAKISTAN
ASSIGNMENT SUBMISSION
--------------------------------------------------
Course: ${course}
Student Name: (Update in Nexora Vault)
Student ID: ${studentId}
--------------------------------------------------
Dated: ${new Date().toLocaleDateString()}
Generated by Nexora Elite Extension
--------------------------------------------------
    `;
    
    navigator.clipboard.writeText(coverText);
    alert('✅ Professional Assignment Cover copied! Paste it at the top of your file.');
}

// Run injections
setTimeout(() => {
    injectNexoraHub();
    unlockQuiz();
    
    // Inject Custom Styles
    const style = document.createElement('style');
    style.textContent = `
        .nexora-sidebar-hub {
            position: fixed;
            left: -180px;
            top: 50%;
            transform: translateY(-50%);
            width: 200px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(34, 211, 238, 0.3);
            border-left: none;
            border-radius: 0 15px 15px 0;
            padding: 15px;
            z-index: 100000;
            transition: left 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 5px 0 15px rgba(0,0,0,0.3);
        }
        .nexora-sidebar-hub:hover { left: 0; }
        .hub-header { color: #22d3ee; font-weight: bold; margin-bottom: 15px; text-align: center; font-size: 0.8rem; border-bottom: 1px solid rgba(34,211,238,0.2); padding-bottom: 5px; }
        .hub-links a { display: block; color: white; text-decoration: none; padding: 8px 10px; margin: 5px 0; border-radius: 5px; font-size: 0.75rem; transition: background 0.2s; }
        .hub-links a:hover { background: rgba(34, 211, 238, 0.2); color: #22d3ee; }
        .nexora-action-btn { position: fixed; bottom: 100px; right: 30px; z-index: 9999; background: #22d3ee; color: #0f172a; border: none; padding: 12px 24px; border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(34, 211, 238, 0.4); }
    `;
    document.head.appendChild(style);
}, 2000);

// Rest of the observer logic
const observer = new MutationObserver((mutations) => {
    if (mutations.some(m => m.addedNodes.length > 0)) {
        unlockQuiz();
        injectNexoraHub();
        // Auto-run unblocker if enabled
        chrome.storage.local.get('autoUnblock', (data) => {
            if (data.autoUnblock) unblockLMSUI();
        });
    }
});
observer.observe(document.body, { childList: true, subtree: true });
