document.addEventListener('DOMContentLoaded', () => {
    // --- Data Storage (localStorage - Browser Only!) ---
    const db = {
        clients: JSON.parse(localStorage.getItem('bondsure_clients')) || {},
        bailCases: JSON.parse(localStorage.getItem('bondsure_bailCases')) || {},
        insurancePolicies: JSON.parse(localStorage.getItem('bondsure_insurancePolicies')) || {},
        nextClientId: parseInt(localStorage.getItem('bondsure_nextClientId') || '1'),
        nextCaseId: parseInt(localStorage.getItem('bondsure_nextCaseId') || '1'),
        nextPolicyId: parseInt(localStorage.getItem('bondsure_nextPolicyId') || '1')
    };

    function saveData() {
        localStorage.setItem('bondsure_clients', JSON.stringify(db.clients));
        localStorage.setItem('bondsure_bailCases', JSON.stringify(db.bailCases));
        localStorage.setItem('bondsure_insurancePolicies', JSON.stringify(db.insurancePolicies));
        localStorage.setItem('bondsure_nextClientId', db.nextClientId.toString());
        localStorage.setItem('bondsure_nextCaseId', db.nextCaseId.toString());
        localStorage.setItem('bondsure_nextPolicyId', db.nextPolicyId.toString());
    }

    // --- DOM Elements ---
    const views = document.querySelectorAll('.view');
    const addClientForm = document.getElementById('addClientForm');
    const clientsTableBody = document.querySelector('#clientsTable tbody');
    const clientDetailContent = document.getElementById('clientDetailContent');
    const addBailCaseForm = document.getElementById('addBailCaseForm');
    const addInsurancePolicyForm = document.getElementById('addInsurancePolicyForm');
    const bailClientSelect = document.getElementById('bailClientSelect');
    const insuranceClientSelect = document.getElementById('insuranceClientSelect');

    // --- Navigation ---
    window.showView = (viewId) => {
        views.forEach(view => {
            view.classList.remove('active');
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('active');
            // Refresh data if needed when switching views
            if (viewId === 'clientList') loadClientsTable();
            if (viewId === 'addBailCase') populateClientSelect(bailClientSelect);
            if (viewId === 'addInsurancePolicy') populateClientSelect(insuranceClientSelect);
            if (viewId === 'dashboard') updateDashboard();

        } else {
             console.error(`View with id ${viewId} not found.`);
             document.getElementById('dashboard').classList.add('active'); // Fallback to dashboard
        }
    };

    // --- Client Management ---
    function addClient(event) {
        event.preventDefault();
        const clientId = db.nextClientId++;
        const clientData = {
            id: clientId,
            name: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            address: document.getElementById('clientAddress').value,
            dob: document.getElementById('clientDOB').value,
            ssn: document.getElementById('clientSSN').value, // WARNING: NO SECURITY
            type: document.getElementById('clientType').value, // Bail, Insurance, Both, Prospect
            bailCaseIds: [],
            insurancePolicyIds: []
        };
        db.clients[clientId] = clientData;
        saveData();
        addClientForm.reset();
        alert(`Client ${clientData.name} added successfully!`);
        showView('clientList'); // Switch to client list view
    }

    function loadClientsTable() {
        clientsTableBody.innerHTML = ''; // Clear existing rows
        Object.values(db.clients).forEach(client => {
            const row = clientsTableBody.insertRow();
            row.innerHTML = `
                <td>${client.name || 'N/A'}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.email || 'N/A'}</td>
                <td>${client.type || 'N/A'}</td>
                <td><button onclick="viewClientDetail(${client.id})">View Details</button></td>
            `;
        });
        if (clientsTableBody.innerHTML === '') {
             clientsTableBody.innerHTML = '<tr><td colspan="5">No clients found.</td></tr>';
        }
    }

     // --- Client Detail View ---
     window.viewClientDetail = (clientId) => {
        const client = db.clients[clientId];
        if (!client) {
            alert("Client not found!");
            showView('clientList');
            return;
        }

        let detailHTML = `
            <h3>${client.name} (ID: ${client.id})</h3>
            <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
            <p><strong>Email:</strong> ${client.email || 'N/A'}</p>
            <p><strong>Address:</strong> ${client.address || 'N/A'}</p>
            <p><strong>DOB:</strong> ${client.dob || 'N/A'}</p>
            <p><strong>Type:</strong> ${client.type}</p>
            <p><strong>SSN (Demo):</strong> ${client.ssn || 'N/A'}</p> <!-- Displaying SSN is bad practice -->

            <h3>Bail Cases</h3>
            <ul>`;

        if (client.bailCaseIds.length > 0) {
             client.bailCaseIds.forEach(caseId => {
                 const bailCase = db.bailCases[caseId];
                 if(bailCase) {
                     detailHTML += `<li>Case ID: ${caseId} - Defendant: ${bailCase.defendantName} - Bond: $${bailCase.bondAmount}</li>`;
                 }
             });
        } else {
            detailHTML += `<li>No bail cases associated.</li>`;
        }
         detailHTML += `</ul>

            <h3>Insurance Policies</h3>
             <ul>`;

        if (client.insurancePolicyIds.length > 0) {
             client.insurancePolicyIds.forEach(policyId => {
                 const policy = db.insurancePolicies[policyId];
                 if(policy) {
                     detailHTML += `<li>Policy ID: ${policyId} - Type: ${policy.policyType} - Carrier: ${policy.carrier || 'N/A'}</li>`;
                 }
             });
        } else {
            detailHTML += `<li>No insurance policies associated.</li>`;
        }
        detailHTML += `</ul>`;


        clientDetailContent.innerHTML = detailHTML;
        showView('clientDetail');
    };


    // --- Bail Bond Case Management ---
    function addBailCase(event) {
        event.preventDefault();
        const caseId = db.nextCaseId++;
        const selectedClientId = parseInt(document.getElementById('bailClientSelect').value);
        const ownsHome = document.getElementById('ownsHome').value;
        const hasVehicle = document.getElementById('hasVehicle').value;

        const caseData = {
            id: caseId,
            clientId: selectedClientId, // This is the indemnitor
            defendantName: document.getElementById('defendantName').value,
            charges: document.getElementById('charges').value,
            bondAmount: parseFloat(document.getElementById('bondAmount').value) || 0,
            premiumCharged: parseFloat(document.getElementById('premiumCharged').value) || 0,
            courtDate: document.getElementById('courtDate').value,
            status: 'Active', // Default status
            // Store demo answers for cross-sell prompt
            _demoOwnsHome: ownsHome,
            _demoHasVehicle: hasVehicle
        };

        db.bailCases[caseId] = caseData;

        // Link case to client
        const client = db.clients[selectedClientId];
        if (client) {
            client.bailCaseIds.push(caseId);
            // Update client type if necessary
            if (client.type === 'Prospect' || client.type === 'Insurance') {
                client.type = (client.type === 'Insurance') ? 'Bail & Insurance' : 'Bail';
            }
        }

        saveData();
        addBailCaseForm.reset();
        alert(`Bail case for ${caseData.defendantName} added successfully!`);

        // *** Trigger Cross-Sell Prompt ***
        triggerCrossSellPrompt(client, caseData);

        showView('clientList'); // Go back to client list or dashboard
    }

     // --- Insurance Policy Management ---
     function addInsurancePolicy(event) {
        event.preventDefault();
        const policyId = db.nextPolicyId++;
        const selectedClientId = parseInt(document.getElementById('insuranceClientSelect').value);

        const policyData = {
            id: policyId,
            clientId: selectedClientId,
            policyType: document.getElementById('policyType').value,
            carrier: document.getElementById('carrier').value,
            policyNumber: document.getElementById('policyNumber').value,
            premium: parseFloat(document.getElementById('policyPremium').value) || 0,
            effectiveDate: document.getElementById('effectiveDate').value,
            expirationDate: document.getElementById('expirationDate').value
        };

        db.insurancePolicies[policyId] = policyData;

        // Link policy to client
        const client = db.clients[selectedClientId];
        if (client) {
            client.insurancePolicyIds.push(policyId);
             // Update client type if necessary
             if (client.type === 'Prospect' || client.type === 'Bail') {
                client.type = (client.type === 'Bail') ? 'Bail & Insurance' : 'Insurance';
            }
        }

        saveData();
        addInsurancePolicyForm.reset();
        alert(`Insurance policy (${policyData.policyType}) added for client successfully!`);
        showView('clientList'); // Go back to client list or dashboard
    }

    // --- Cross-Sell Logic ---
    function triggerCrossSellPrompt(client, bailCase) {
        if (!client || !bailCase) return;

        let suggestions = [];
        if (bailCase._demoOwnsHome === 'yes') {
            suggestions.push("Homeowners Insurance");
        }
        if (bailCase._demoHasVehicle === 'yes') {
            suggestions.push("Auto Insurance");
        }
        // Add more simplistic triggers here if needed (e.g., based on address, etc.)
        if (suggestions.length === 0) {
             // Maybe suggest a default like Renters or Life if no specific triggers hit
            suggestions.push("Life Insurance");
            suggestions.push("Renters Insurance");
        }


        // Simple alert prompt - a real CRM would have a modal/dedicated screen
        const promptMessage = `Cross-Sell Opportunity for ${client.name}:
Based on info provided, consider offering:
- ${suggestions.join('
- ')}

(This is a demo prompt. In a real CRM, you'd track the outcome.)`;
        alert(promptMessage);

        // TODO: In a real app, create tasks, log interaction, etc. based on agent's action after the prompt.
    }


    // --- Helper Functions ---
    function populateClientSelect(selectElement) {
        selectElement.innerHTML = '<option value="">-- Select Client --</option>'; // Clear and add default
        Object.values(db.clients).forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.name} (ID: ${client.id})`;
            selectElement.appendChild(option);
        });
    }

     // --- Dashboard ---
     function updateDashboard() {
         document.getElementById('totalClients').textContent = Object.keys(db.clients).length;
         document.getElementById('totalBailCases').textContent = Object.keys(db.bailCases).length;
         document.getElementById('totalInsurancePolicies').textContent = Object.keys(db.insurancePolicies).length;
     }


    // --- Event Listeners ---
    addClientForm.addEventListener('submit', addClient);
    addBailCaseForm.addEventListener('submit', addBailCase);
    addInsurancePolicyForm.addEventListener('submit', addInsurancePolicy);

    // --- Initial Load ---
    showView('dashboard'); // Start on dashboard
});