// Lógica del cliente para el webhook test server

let webhookLog = [];
let validResponseEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const logPanel = document.getElementById('log-entries');
    const emptyState = document.getElementById('empty-state');
    const clearLogBtn = document.getElementById('clear-log');
    const logCountEl = document.getElementById('log-count');
    const copyUrlBtn = document.getElementById('copy-url');
    const forceInvalidBtn = document.getElementById('force-invalid');
    const toggleValidBtn = document.getElementById('toggle-valid');
    const toggle404Btn = document.getElementById('toggle-404');
    const toggleNotUserBtn = document.getElementById('toggle-not-user');
    const toggleNotApprovedBtn = document.getElementById('toggle-not-approved');
    const toggleNotOptedBtn = document.getElementById('toggle-not-opted');
    const notificationArea = document.getElementById('notification-area');
    const notificationMessage = document.getElementById('notification-message');
    
    // Dropdown toggle
    const dropdown = document.querySelector('.dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    dropdown.addEventListener('click', function(e) {
        dropdownContent.classList.toggle('hidden');
        e.stopPropagation();
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdownContent.classList.add('hidden');
        }
    });

    // Initialize
    fetchWebhookHistory();
    
    // Set up periodic polling to get new webhooks
    setInterval(fetchWebhookHistory, 2000); // Poll every 2 seconds

    // Event Listeners
    clearLogBtn.addEventListener('click', clearWebhookHistory);
    
    copyUrlBtn.addEventListener('click', () => {
        const url = `http://localhost:${window.location.port}/api/webhook/receive`;
        navigator.clipboard.writeText(url)
            .then(() => {
                const originalText = copyUrlBtn.innerHTML;
                copyUrlBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
                setTimeout(() => {
                    copyUrlBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });

    forceInvalidBtn.addEventListener('click', forceInvalidWebhook);
    
    // Botones de respuesta
    toggleValidBtn.addEventListener('click', () => {
        setResponseMode("valid");
        updateModeIndicator("valid");
        showNotification("Response mode: Valid (200 OK)");
        dropdownContent.classList.add('hidden');
    });
    
    toggle404Btn.addEventListener('click', () => {
        setResponseMode("404");
        updateModeIndicator("404");
        showNotification("Response mode: 404 Not Found");
        dropdownContent.classList.add('hidden');
    });
    
    toggleNotUserBtn.addEventListener('click', () => {
        setResponseMode("not-user");
        updateModeIndicator("not-user");
        showNotification("Response mode: Not a WhatsApp user");
        dropdownContent.classList.add('hidden');
    });
    
    toggleNotApprovedBtn.addEventListener('click', () => {
        setResponseMode("not-approved");
        updateModeIndicator("not-approved");
        showNotification("Response mode: Template not approved");
        dropdownContent.classList.add('hidden');
    });
    
    toggleNotOptedBtn.addEventListener('click', () => {
        setResponseMode("not-opted");
        updateModeIndicator("not-opted");
        showNotification("Response mode: Phone not opted in");
        dropdownContent.classList.add('hidden');
    });

    // Funciones para manejar los modos de respuesta
    async function setResponseMode(mode) {
        try {
            await fetch('/api/webhook/set-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: mode })
            });
            updateModeIndicator(mode); // Actualizar el indicador de modo activo
        } catch (error) {
            console.error('Error al cambiar modo de respuesta:', error);
        }
    }

    // Functions
    async function fetchWebhookHistory() {
        try {
            const response = await fetch('/api/webhook/history');
            if (response.ok) {
                webhookLog = await response.json();
                updateLogDisplay();
            }
        } catch (error) {
            console.error('Failed to fetch webhook history:', error);
        }
    }

    async function clearWebhookHistory() {
        try {
            const response = await fetch('/api/webhook/clear', { method: 'POST' });
            if (response.ok) {
                webhookLog = [];
                updateLogDisplay();
                showNotification('Webhook history cleared');
            }
        } catch (error) {
            console.error('Failed to clear webhook history:', error);
        }
    }

    async function forceInvalidWebhook() {
        const invalidPayload = {
            error: "Invalid payload format",
            received: "partial data",
            timestamp: new Date().toISOString()
        };
        
        try {
            await fetch('/api/webhook/force-invalid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidPayload)
            });
            
            // Refresh webhook history to see the new invalid webhook
            fetchWebhookHistory();
        } catch (error) {
            console.error('Failed to send invalid webhook:', error);
        }
    }

    async function toggleValidResponse() {
        try {
            validResponseEnabled = !validResponseEnabled;
            await fetch('/api/webhook/toggle-valid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: validResponseEnabled })
            });
        } catch (error) {
            console.error('Failed to toggle valid response:', error);
        }
    }

    function showNotification(message) {
        notificationMessage.textContent = message;
        notificationArea.classList.remove('hidden');

        // Fade out after 3 seconds
        setTimeout(() => {
            notificationArea.classList.add('hidden');
        }, 3000);
    }

    function updateLogDisplay() {
        logCountEl.textContent = `(${webhookLog.length})`;

        if (webhookLog.length === 0) {
            emptyState.style.display = 'block';
            logPanel.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';
        logPanel.innerHTML = '';

        webhookLog.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.id = `webhook-${entry.id}`;
            entryEl.className = 'webhook-entry border border-gray-200 rounded-lg p-4';

            const formattedTime = new Date(entry.timestamp).toLocaleString();

            // Pretty format the JSON for display
            let jsonStr;
            try {
                if (typeof entry.payload === 'string') {
                    jsonStr = JSON.stringify(JSON.parse(entry.payload), null, 2);
                } else {
                    jsonStr = JSON.stringify(entry.payload, null, 2);
                }
            } catch (e) {
                jsonStr = typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload);
            }

            // Agregar información de respuesta si está disponible
            let responseInfo = '';
            if (entry.responseStatus) {
                responseInfo = `<div class="mt-2 text-xs text-gray-500">
                    <span class="font-semibold">Respuesta:</span> ${entry.responseStatus} 
                    ${entry.responseBody ? JSON.stringify(entry.responseBody) : ''}
                </div>`;
            }
            
            entryEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
              <div class="text-sm text-gray-500">${formattedTime}</div>
              <span class="text-xs text-white px-2 py-1 rounded-full ${entry.isValid ? 'valid-badge' : 'invalid-badge'}">
                ${entry.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            <div class="json-viewer bg-gray-50 p-3 rounded">${jsonStr}</div>
            ${responseInfo}
          `;

            logPanel.appendChild(entryEl);
        });
    }

    // Add this function to app.js
    function updateModeIndicator(mode) {
        const indicator = document.getElementById('active-mode-indicator');
        
        // Set the text and color based on the mode
        switch(mode) {
            case "valid":
                indicator.textContent = "200 OK";
                indicator.className = "absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow";
                break;
            case "404":
                indicator.textContent = "404";
                indicator.className = "absolute -top-3 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow";
                break;
            case "not-user":
                indicator.textContent = "Not User";
                indicator.className = "absolute -top-3 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow";
                break;
            case "not-approved":
                indicator.textContent = "Not Approved";
                indicator.className = "absolute -top-3 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow";
                break;
            case "not-opted":
                indicator.textContent = "Not Opted In";
                indicator.className = "absolute -top-3 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow";
                break;
        }
    }

    // Add to the initialization part of app.js
    // Initialize mode indicator
    fetchCurrentMode();
});

// Add this function to get the current mode from the server
async function fetchCurrentMode() {
    try {
        const response = await fetch('/api/webhook/get-mode');
        if (response.ok) {
            const data = await response.json();
            updateModeIndicator(data.mode);
        }
    } catch (error) {
        console.error('Failed to fetch current mode:', error);
        // Default to valid mode
        updateModeIndicator("valid");
    }
}