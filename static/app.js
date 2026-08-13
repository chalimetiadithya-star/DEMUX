document.addEventListener('DOMContentLoaded', () => {
    // Set Chart.js defaults for Dark Mode
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#334155';
    }

    // -----------------------------------------------------
    // 1. Upload Page Logic
    // -----------------------------------------------------
    const form = document.getElementById('upload-form');
    if (form) {
        const fileInput = document.getElementById('file');
        const dropArea = document.getElementById('file-drop-area');
        const fileMsg = document.querySelector('.file-msg');
        const analyzeBtn = document.getElementById('analyze-btn');
        const loadingSection = document.getElementById('loading-section');
        const uploadSection = document.getElementById('upload-section');

        // Drag and Drop styling
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('is-active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('is-active'), false);
        });

        dropArea.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                updateFileDisplay();
            }
        });

        // Ensure clicking the drop area always opens the file browser
        dropArea.addEventListener('click', (e) => {
            // Prevent triggering if they already clicked the input directly
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', updateFileDisplay);

        function updateFileDisplay() {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                if (fileName.endsWith('.csv')) {
                    fileMsg.textContent = fileName;
                    dropArea.classList.add('has-file');
                    analyzeBtn.disabled = false;
                } else {
                    fileMsg.textContent = 'Please select a valid CSV file.';
                    dropArea.classList.remove('has-file');
                    analyzeBtn.disabled = true;
                    fileInput.value = '';
                }
            } else {
                fileMsg.textContent = 'Drag & Drop your CSV file here, or click to browse';
                dropArea.classList.remove('has-file');
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
                    throw new Error(data.error || 'Something went wrong processing the file.');
                }
                
                // Redirect to dashboard on success!
                window.location.href = '/dashboard';
            } catch (error) {
                alert(`Error: ${error.message}`);
                form.reset();
                updateFileDisplay();
                loadingSection.classList.add('hidden');
                uploadSection.classList.remove('hidden');
            }
        });
    }

    // -----------------------------------------------------
    // 2. Dashboard Page Logic
    // -----------------------------------------------------
    const actionChartCanvas = document.getElementById('actionChart');
    if (actionChartCanvas) {
        fetchDataAndRender(renderDashboard);
    }

    function renderDashboard(data) {
        // Populate stats
        document.getElementById('churn-percentage').textContent = `${data.churn_percentage}%`;
        document.getElementById('churn-count').textContent = `${data.at_risk_count} / ${data.total_customers} users`;
        
        if (data.model_performance) {
            document.getElementById('model-accuracy').textContent = data.model_performance.accuracy ? `${(data.model_performance.accuracy * 100).toFixed(1)}%` : 'N/A';
            document.getElementById('model-auc').textContent = data.model_performance.auc ? data.model_performance.auc.toFixed(3) : 'N/A';
        }

        // Populate Action Plan Breakdown
        const actionList = document.getElementById('action-list');
        actionList.innerHTML = '';
        if (data.action_counts && Object.keys(data.action_counts).length > 0) {
            for (const [action, count] of Object.entries(data.action_counts)) {
                actionList.innerHTML += `<li><strong>${action}:</strong> ${count} users</li>`;
            }
        } else {
            actionList.innerHTML = '<li>No actions needed.</li>';
        }

        // Populate Insights
        const insightsList = document.getElementById('insights-list');
        insightsList.innerHTML = '';
        if (data.insights && data.insights.length > 0) {
            data.insights.forEach(insight => {
                insightsList.innerHTML += `<li>${insight}</li>`;
            });
        }

        // Populate Reliability Note
        const reliabilityAlert = document.getElementById('reliability-note');
        if (data.reliability_note) {
            reliabilityAlert.textContent = data.reliability_note;
            reliabilityAlert.classList.remove('hidden');
        }

        // Render Charts
        renderCharts(data);
    }

    function renderCharts(data) {
        // 1. Action Breakdown Doughnut Chart
        new Chart(document.getElementById('actionChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.action_counts || {}),
                datasets: [{
                    data: Object.values(data.action_counts || {}),
                    backgroundColor: ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        // 2. Top Churn Reasons Bar Chart
        const reasonCounts = {};
        if (data.high_risk_users) {
            data.high_risk_users.forEach(user => {
                const r = user.top_reason || 'Unknown';
                reasonCounts[r] = (reasonCounts[r] || 0) + 1;
            });
        }
        
        new Chart(document.getElementById('reasonsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(reasonCounts),
                datasets: [{
                    label: 'Number of At-Risk Users',
                    data: Object.values(reasonCounts),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
            }
        });

        // 3. Monthly Churn Trend
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

        new Chart(document.getElementById('trendChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: Object.keys(cohorts),
                datasets: [{
                    label: 'At-Risk Users',
                    data: Object.values(cohorts),
                    borderColor: '#f97316', borderWidth: 4, backgroundColor: 'transparent', fill: false, tension: 0,
                    pointBackgroundColor: '#fcd34d', pointBorderColor: '#000000', pointBorderWidth: 2, pointRadius: 6, pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    // -----------------------------------------------------
    // 3. Customers Page Logic
    // -----------------------------------------------------
    const usersTable = document.getElementById('high-risk-users');
    let currentHighRiskUsers = [];
    
    if (usersTable) {
        fetchDataAndRender(renderCustomers);
        
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!currentHighRiskUsers || currentHighRiskUsers.length === 0) {
                    alert("No data to export.");
                    return;
                }
                const headers = ['User ID', 'Churn Probability', 'Top Reason', 'Recommended Action'];
                let csvContent = headers.join(',') + '\n';
                currentHighRiskUsers.forEach(u => {
                    csvContent += [u.user_id, (u.churn_probability * 100).toFixed(1) + '%', `"${u.top_reason || ''}"`, `"${u.recommended_action || ''}"`].join(',') + '\n';
                });
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'action_list.csv';
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    }

    function renderCustomers(data) {
        currentHighRiskUsers = data.high_risk_users || [];
        usersTable.innerHTML = '';
        if (currentHighRiskUsers.length > 0) {
            currentHighRiskUsers.forEach(user => {
                const tr = document.createElement('tr');
                
                const fakeName = 'User ' + user.user_id.split('_')[1];
                const fakeEmail = user.user_id.toLowerCase() + '@email.com';
                const avatarUrl = `https://ui-avatars.com/api/?name=${fakeName}&background=random&color=fff&rounded=true&size=40`;
                
                const riskPercent = Math.round(user.churn_probability * 100);
                let riskClass = riskPercent >= 80 ? 'risk-high' : 'risk-medium';
                let riskText = riskPercent >= 80 ? 'High' : 'Medium';
                
                const daysAgo = Math.max(1, Math.floor(Math.random() * 20)); 
                
                const reasons = (user.top_reason || 'Unknown').split('/');
                const pillsHtml = reasons.map(r => `<span class="reason-pill">${r}</span>`).join('');
                
                let actionText = user.recommended_action;
                let actionIcon = '💬';
                if (actionText === 'Discount') { actionText = 'Send Incentive Offer'; actionIcon = '🎁'; }
                else if (actionText === 'Outreach Call') { actionText = 'Call Customer'; actionIcon = '📞'; }
                else if (actionText === 'Feature Nudge') { actionText = 'Send Education Email'; actionIcon = '🎓'; }

                tr.innerHTML = `
                    <td>
                        <div class="user-cell">
                            <img src="${avatarUrl}" class="avatar" alt="Avatar">
                            <div class="user-info">
                                <span class="user-name">${fakeName}</span>
                                <span class="user-email">${fakeEmail}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="risk-cell">
                            <div class="risk-badge ${riskClass}">${riskPercent}</div>
                            <span class="risk-text ${riskClass}">${riskText}</span>
                        </div>
                    </td>
                    <td>
                        <div class="active-cell">
                            <div class="active-date">Recently</div>
                            <div class="active-days">${daysAgo} days ago</div>
                        </div>
                    </td>
                    <td>
                        <div class="reasons-cell">
                            ${pillsHtml}
                        </div>
                    </td>
                    <td>
                        <div class="action-cell">
                            <button class="premium-action-btn">
                                <span class="action-icon">${actionIcon}</span> ${actionText}
                            </button>
                        </div>
                    </td>
                `;
                
                if (user.recommended_action === 'Outreach Call') {
                    const btn = tr.querySelector('.premium-action-btn');
                    btn.onclick = () => window.openModal(user.user_id, user.top_reason);
                }

                usersTable.appendChild(tr);
            });
        } else {
            usersTable.innerHTML = '<tr><td colspan="5">No high-risk users found.</td></tr>';
        }
    }

    // -----------------------------------------------------
    // Helper: Fetch Data
    // -----------------------------------------------------
    async function fetchDataAndRender(renderFunction) {
        try {
            const res = await fetch('/api/data');
            if (!res.ok) {
                if (res.status === 404) {
                    alert("No data available. Please upload a dataset first.");
                    window.location.href = '/';
                } else {
                    throw new Error("Failed to load data.");
                }
            } else {
                const data = await res.json();
                renderFunction(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // -----------------------------------------------------
    // Modal Logic (Shared)
    // -----------------------------------------------------
    const modal = document.getElementById('call-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalTranscript = document.getElementById('modal-transcript');

    if (closeModalBtn) {
        closeModalBtn.onclick = function() { modal.classList.add('hidden'); }
        window.onclick = function(event) { if (event.target == modal) { modal.classList.add('hidden'); } }
    }

    const mockTranscripts = [
        [
            {role: 'ai', text: 'Hi! This is Sarah, the AI assistant at your SaaS provider. I noticed you had a few frustrating support tickets lately. I am calling to see if your issues were fully resolved?'},
            {role: 'customer', text: 'No actually. The analytics dashboard is still crashing when I export to PDF.'},
            {role: 'ai', text: 'I apologize for that experience. I just checked the logs and I see exactly where the error is happening. I am escalating this to a senior engineer right now. As an apology, I have credited your account for next month.'},
            {role: 'customer', text: 'Oh wow, thank you. I really appreciate you catching that. If it gets fixed I will definitely stick around.'},
            {role: 'ai', text: 'Consider it done. I will email you the moment the fix is live today. Have a great day!'}
        ],
        [
            {role: 'ai', text: 'Hello! I noticed you rated your recent support chat as a 1-star experience. I wanted to personally reach out to make this right.'},
            {role: 'customer', text: 'Yeah, the support agent did not understand my billing issue at all.'},
            {role: 'ai', text: 'I am so sorry. Looking at your account, it seems your team was double-charged for the new seats. I have already issued a full refund to your card ending in 4421, which will process in 2-3 days.'},
            {role: 'customer', text: 'That is exactly what I needed. Thank you for being proactive. I was honestly about to cancel.'},
            {role: 'ai', text: 'I completely understand. Please let me know if there is anything else I can do to improve your experience moving forward!'}
        ]
    ];

    window.openModal = function(userId, reason) {
        modalTranscript.innerHTML = `<div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
            <strong>Calling:</strong> ${userId}<br>
            <strong>Flagged Reason:</strong> ${reason}
        </div>`;
        
        const script = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        
        script.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = `chat-message ${msg.role}`;
            wrapper.innerHTML = `
                <div class="chat-label">${msg.role === 'ai' ? 'AI Agent' : 'Customer'}</div>
                <div class="chat-bubble">${msg.text}</div>
            `;
            modalTranscript.appendChild(wrapper);
        });
        
        modal.classList.remove('hidden');
    };
});
