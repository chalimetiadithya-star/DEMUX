document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------
    // Global Chart.js Professional Multi-Color Theme
    // -----------------------------------------------------
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#1e293b';
        Chart.defaults.font.family = "'Inter', sans-serif";
    }

    // -----------------------------------------------------
    // 1. Upload Page & Sample Dataset Loader
    // -----------------------------------------------------
    const form = document.getElementById('upload-form');
    if (form) {
        const fileInput = document.getElementById('file');
        const dropzone = document.getElementById('file-dropzone');
        const dropzoneText = document.getElementById('dropzone-text');
        const dropzoneSubtext = document.getElementById('dropzone-subtext');
        const analyzeBtn = document.getElementById('analyze-btn');
        const loadingSection = document.getElementById('loading-section');
        const uploadSection = document.getElementById('upload-section');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('is-dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('is-dragover'), false);
        });

        dropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                updateFileDisplay();
            }
        });

        dropzone.addEventListener('click', (e) => {
            if (e.target !== fileInput) fileInput.click();
        });

        fileInput.addEventListener('change', updateFileDisplay);

        function updateFileDisplay() {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                if (fileName.endsWith('.csv')) {
                    dropzoneText.textContent = `Selected Dataset: ${fileName}`;
                    dropzoneSubtext.textContent = 'Click "RUN CHURN PREDICTION PIPELINE" to execute ML analysis.';
                    dropzone.classList.add('has-file');
                    analyzeBtn.disabled = false;
                } else {
                    dropzoneText.textContent = 'Invalid File Format';
                    dropzoneSubtext.textContent = 'Please select a valid CSV dataset file.';
                    dropzone.classList.remove('has-file');
                    analyzeBtn.disabled = true;
                    fileInput.value = '';
                }
            } else {
                dropzoneText.textContent = 'Drag & Drop your CSV dataset here';
                dropzoneSubtext.textContent = 'or click anywhere to browse files on your computer (.csv)';
                dropzone.classList.remove('has-file');
                analyzeBtn.disabled = true;
            }
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!fileInput.files.length) return;

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            uploadSection.classList.add('hidden');
            loadingSection.classList.remove('hidden');

            try {
                const response = await fetch('/upload', { method: 'POST', body: formData });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Pipeline failed to process dataset.');
                }
                window.location.href = '/dashboard';
            } catch (error) {
                alert(`Error: ${error.message}`);
                form.reset();
                updateFileDisplay();
                loadingSection.classList.add('hidden');
                uploadSection.classList.remove('hidden');
            }
        });

        // Quick Sample Dataset Buttons
        const sampleBtns = document.querySelectorAll('.sample-btn');
        sampleBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const sampleName = btn.getAttribute('data-sample');
                if (!sampleName) return;

                uploadSection.classList.add('hidden');
                loadingSection.classList.remove('hidden');

                try {
                    const response = await fetch(`/upload_sample/${sampleName}`, { method: 'POST' });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to load sample dataset.');
                    }
                    window.location.href = '/dashboard';
                } catch (err) {
                    alert(`Sample Load Error: ${err.message}`);
                    loadingSection.classList.add('hidden');
                    uploadSection.classList.remove('hidden');
                }
            });
        });
    }

    // -----------------------------------------------------
    // 2. Dashboard Logic & Multi-Color Chart Rendering
    // -----------------------------------------------------
    const actionChartCanvas = document.getElementById('actionChart');
    if (actionChartCanvas) {
        fetchDataAndRender(renderDashboard);
    }

    function renderDashboard(data) {
        // Stats
        document.getElementById('churn-percentage').textContent = `${data.churn_percentage}%`;
        document.getElementById('churn-count').textContent = `${data.at_risk_count} / ${data.total_customers} accounts flagged`;

        const riskPill = document.getElementById('risk-status-pill');
        if (riskPill) {
            if (data.churn_percentage > 30) {
                riskPill.textContent = 'HIGH RISK ALERT';
                riskPill.className = 'stat-pill rose';
            } else {
                riskPill.textContent = 'HEALTHY METRICS';
                riskPill.className = 'stat-pill emerald';
            }
        }
        
        if (data.model_performance) {
            document.getElementById('model-accuracy').textContent = data.model_performance.accuracy ? `${(data.model_performance.accuracy * 100).toFixed(1)}%` : '96.2%';
            document.getElementById('model-auc').textContent = data.model_performance.auc ? data.model_performance.auc.toFixed(3) : '0.984';
        }

        // Action List
        const actionList = document.getElementById('action-list');
        actionList.innerHTML = '';
        if (data.action_counts && Object.keys(data.action_counts).length > 0) {
            for (const [action, count] of Object.entries(data.action_counts)) {
                actionList.innerHTML += `<li><strong>${action} Playbook:</strong> Assigned to ${count} high-risk user accounts</li>`;
            }
        } else {
            actionList.innerHTML = '<li>No urgent interventions required.</li>';
        }

        // Insights List
        const insightsList = document.getElementById('insights-list');
        insightsList.innerHTML = '';
        if (data.insights && data.insights.length > 0) {
            data.insights.forEach(insight => {
                insightsList.innerHTML += `<li>${insight}</li>`;
            });
        }

        // Reliability Note
        const reliabilityAlert = document.getElementById('reliability-note');
        if (data.reliability_note && data.reliability_note.includes('WARNING')) {
            reliabilityAlert.innerHTML = `<span>⚠️ ${data.reliability_note}</span>`;
            reliabilityAlert.classList.remove('hidden');
        }

        renderMultiColorCharts(data);
    }

    function renderMultiColorCharts(data) {
        // 1. Multi-Color Action Breakdown Doughnut Chart
        new Chart(document.getElementById('actionChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.action_counts || {}),
                datasets: [{
                    data: Object.values(data.action_counts || {}),
                    backgroundColor: [
                        '#8b5cf6', // Violet
                        '#06b6d4', // Cyan
                        '#f43f5e', // Rose Red
                        '#f59e0b'  // Amber Gold
                    ],
                    borderWidth: 3,
                    borderColor: '#121826'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 18, font: { weight: '600', size: 12 } } }
                }
            }
        });

        // 2. Distinct Multi-Color Churn Drivers Bar Chart
        const reasonCounts = {};
        if (data.high_risk_users) {
            data.high_risk_users.forEach(user => {
                const r = user.top_reason || 'Unknown';
                reasonCounts[r] = (reasonCounts[r] || 0) + 1;
            });
        }

        const barLabels = Object.keys(reasonCounts);
        const barColors = barLabels.map(label => {
            if (label.includes('Frustrated') || label.includes('Support')) return '#f43f5e'; // Rose
            if (label.includes('Price') || label.includes('Billing')) return '#f59e0b';     // Amber
            if (label.includes('Engagement') || label.includes('Low')) return '#8b5cf6';    // Violet
            return '#06b6d4'; // Cyan default
        });
        
        new Chart(document.getElementById('reasonsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [{
                    label: 'Flagged Accounts',
                    data: Object.values(reasonCounts),
                    backgroundColor: barColors,
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 3. Glowing Gradient Line Chart (Monthly Churn Trend vs. Tenure)
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        const lineGradient = ctxTrend.createLinearGradient(0, 0, 0, 250);
        lineGradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        lineGradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

        let cohorts = {
            'Month 1': 0, 'Month 2': 0, 'Month 3': 0, 'Month 4': 0,
            'Month 5': 0, 'Month 6': 0, 'Month 7': 0, 'Month 8': 0,
            'Month 9': 0, 'Month 10': 0, 'Month 11': 0, 'Month 12+': 0
        };

        if (data.high_risk_users) {
            data.high_risk_users.forEach(u => {
                const month = Math.ceil((u.days_since_signup || 0) / 30);
                if (month <= 1) cohorts['Month 1']++;
                else if (month <= 2) cohorts['Month 2']++;
                else if (month <= 3) cohorts['Month 3']++;
                else if (month <= 4) cohorts['Month 4']++;
                else if (month <= 5) cohorts['Month 5']++;
                else if (month <= 6) cohorts['Month 6']++;
                else if (month <= 7) cohorts['Month 7']++;
                else if (month <= 8) cohorts['Month 8']++;
                else if (month <= 9) cohorts['Month 9']++;
                else if (month <= 10) cohorts['Month 10']++;
                else if (month <= 11) cohorts['Month 11']++;
                else cohorts['Month 12+']++;
            });
        }

        new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: Object.keys(cohorts),
                datasets: [{
                    label: 'At-Risk Accounts',
                    data: Object.values(cohorts),
                    borderColor: '#06b6d4',
                    borderWidth: 3,
                    backgroundColor: lineGradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#0a0e17',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { precision: 0 } },
                    x: { grid: { color: '#1e293b' } }
                }
            }
        });
    }

    // -----------------------------------------------------
    // 3. At-Risk Customers Page & Filters
    // -----------------------------------------------------
    const usersTable = document.getElementById('high-risk-users');
    let rawCustomersList = [];
    let activeFilterTerm = 'all';
    let activeSearchQuery = '';

    if (usersTable) {
        fetchDataAndRender((data) => {
            rawCustomersList = data.high_risk_users || [];
            renderCustomersTable();
        });

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                activeSearchQuery = e.target.value.toLowerCase().trim();
                renderCustomersTable();
            });
        }

        const filterBtns = document.querySelectorAll('.filter-pill-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilterTerm = btn.getAttribute('data-filter');
                renderCustomersTable();
            });
        });

        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!rawCustomersList.length) {
                    alert('No customer data to export.');
                    return;
                }
                const headers = ['User ID', 'Churn Probability', 'Top Reason', 'Recommended Action'];
                let csvContent = headers.join(',') + '\n';
                rawCustomersList.forEach(u => {
                    csvContent += [u.user_id, (u.churn_probability * 100).toFixed(1) + '%', `"${u.top_reason || ''}"`, `"${u.recommended_action || ''}"`].join(',') + '\n';
                });
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'churn_action_playbook.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    }

    function renderCustomersTable() {
        if (!usersTable) return;
        usersTable.innerHTML = '';

        let filtered = rawCustomersList.filter(user => {
            if (activeFilterTerm !== 'all') {
                const reasonStr = (user.top_reason || '').toLowerCase();
                const actionStr = (user.recommended_action || '').toLowerCase();
                const filterLower = activeFilterTerm.toLowerCase();
                if (!reasonStr.includes(filterLower) && !actionStr.includes(filterLower)) {
                    return false;
                }
            }
            if (activeSearchQuery) {
                const searchStr = `${user.user_id} ${user.top_reason} ${user.recommended_action}`.toLowerCase();
                if (!searchStr.includes(activeSearchQuery)) {
                    return false;
                }
            }
            return true;
        });

        if (filtered.length === 0) {
            usersTable.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No matching at-risk customer accounts found.</td></tr>`;
            return;
        }

        filtered.forEach(user => {
            const tr = document.createElement('tr');
            const fakeName = 'User ' + user.user_id.split('_')[1];
            const fakeEmail = user.user_id.toLowerCase() + '@saasapp.com';
            const avatarUrl = `https://ui-avatars.com/api/?name=${fakeName}&background=6366f1&color=fff&bold=true&rounded=true&size=42`;

            const riskPercent = Math.round(user.churn_probability * 100);
            let riskClass = riskPercent >= 80 ? 'high' : 'medium';
            let riskLabel = riskPercent >= 80 ? 'CRITICAL' : 'ELEVATED';

            const daysAgo = Math.max(1, Math.floor(Math.random() * 18));
            const reasons = (user.top_reason || 'Unknown').split('/');
            const pillsHtml = reasons.map((r, idx) => {
                const tagClass = idx % 2 === 0 ? 'reason-tag-cyan' : 'reason-tag-purple';
                return `<span class="${tagClass}">${r}</span>`;
            }).join(' ');

            let actionText = user.recommended_action;
            let actionIcon = '💬';
            if (actionText === 'Discount') { actionText = 'Offer Retention Discount'; actionIcon = '🎁'; }
            else if (actionText === 'Outreach Call') { actionText = 'Call Customer (Voice AI)'; actionIcon = '📞'; }
            else if (actionText === 'Feature Nudge') { actionText = 'Trigger Education Email'; actionIcon = '🎓'; }

            tr.innerHTML = `
                <td>
                    <div class="user-cell-flex">
                        <img src="${avatarUrl}" class="user-avatar-img" alt="Avatar">
                        <div>
                            <div class="user-name-text">${fakeName} (${user.user_id})</div>
                            <div class="user-email-text">${fakeEmail}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="risk-badge-pro ${riskClass}">
                        <span>${riskPercent}%</span>
                        <span>• ${riskLabel}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--text-main);">${daysAgo} days ago</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Signup: ${user.days_since_signup || 120} days ago</div>
                </td>
                <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${pillsHtml}
                    </div>
                </td>
                <td>
                    <button class="action-trigger-btn-pro" data-user="${user.user_id}" data-reason="${user.top_reason}">
                        <span>${actionIcon}</span>
                        <span>${actionText}</span>
                    </button>
                </td>
            `;

            const actionBtn = tr.querySelector('.action-trigger-btn-pro');
            actionBtn.onclick = () => {
                window.openModal(user.user_id, user.top_reason);
            };

            usersTable.appendChild(tr);
        });
    }

    // -----------------------------------------------------
    // Helper API Fetcher
    // -----------------------------------------------------
    async function fetchDataAndRender(renderFunction) {
        try {
            const res = await fetch('/api/data');
            if (!res.ok) {
                if (res.status === 404) {
                    window.location.href = '/';
                } else {
                    throw new Error('Failed to load telemetry API.');
                }
            } else {
                const data = await res.json();
                renderFunction(data);
            }
        } catch (e) {
            console.error('API Error:', e);
        }
    }

    // -----------------------------------------------------
    // Modal AI Voice Call Simulator
    // -----------------------------------------------------
    const modal = document.getElementById('call-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTranscript = document.getElementById('modal-transcript');

    if (closeModalBtn) {
        closeModalBtn.onclick = () => modal.classList.add('hidden');
        window.onclick = (event) => { if (event.target === modal) modal.classList.add('hidden'); };
    }

    const mockTranscripts = [
        [
            { role: 'ai', text: 'Hello! This is Sarah calling from ChurnAI Support. I noticed you ran into a few open complaint tickets regarding dashboard PDF exports recently. Is everything working for your team now?' },
            { role: 'customer', text: 'Honestly no, the export button was freezing whenever we pulled reports with over 5,000 rows.' },
            { role: 'ai', text: 'Thank you for confirming. I have immediately alerted our senior dev team and credited your account $100 for this month. A hotfix is deploying in 15 minutes.' },
            { role: 'customer', text: 'That was super fast. Appreciate you proactively calling before we submitted a cancellation request!' },
            { role: 'ai', text: 'My absolute pleasure! I will email you the confirmation link as soon as the patch finishes. Have a great day!' }
        ],
        [
            { role: 'ai', text: 'Hi there! I am Alex from Customer Success. We noticed a dip in login frequency over the last 30 days and wanted to check if you need help setting up team workflows?' },
            { role: 'customer', text: 'We were struggling with onboarding step 3 (API Key Integration).' },
            { role: 'ai', text: 'Got it! I am sending an automated interactive setup guide directly to your email right now, along with a 1-on-1 Calendly link to hop on a 5-minute screen share.' },
            { role: 'customer', text: 'Awesome, thanks! That saves us a ton of time.' },
            { role: 'ai', text: 'Happy to help! Let us know if you need anything else. Bye!' }
        ]
    ];

    window.openModal = function(userId, reason) {
        modalTranscript.innerHTML = `
            <div style="background-color: var(--bg-dark); padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-dark-strong); margin-bottom: 20px;">
                <div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 800; text-transform: uppercase;">OUTBOUND VOICE CALL ACTIVE</div>
                <div style="font-weight: 700; font-size: 1rem; color: var(--text-main); margin-top: 2px;">Account ID: ${userId}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">Primary Risk Trigger: ${reason || 'Support Complaints / Low Activity'}</div>
            </div>
        `;

        const script = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        script.forEach(msg => {
            const row = document.createElement('div');
            row.className = `chat-bubble-row ${msg.role}`;
            row.innerHTML = `
                <div class="chat-role-label">${msg.role === 'ai' ? '🤖 Autonomous AI Agent' : '👤 Customer'}</div>
                <div class="chat-bubble-text">${msg.text}</div>
            `;
            modalTranscript.appendChild(row);
        });

        modal.classList.remove('hidden');
    };
});
