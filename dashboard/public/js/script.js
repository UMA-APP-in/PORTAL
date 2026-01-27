const API_URL = '/services/carne/api/student/login';

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const errorMsg = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');
const btnText = document.getElementById('btn-text');
const btnLogout = document.getElementById('btn-logout');

// Check for existing session on page load
(async function checkSession() {
    const codigo = sessionStorage.getItem('dashboard_codigo');
    const dni = sessionStorage.getItem('dashboard_dni');
    const storedStudent = sessionStorage.getItem('dashboard_student');

    // Check if returning from a service (rectification or carnet)
    const urlParams = new URLSearchParams(window.location.search);
    const fromService = urlParams.get('from');

    // If returning from a service, immediately replace history to prevent back navigation
    if (fromService && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
    }

    if (codigo && dni) {
        // We have credentials - try to restore session
        if (storedStudent) {
            // Use cached student data for immediate display
            try {
                const student = JSON.parse(storedStudent);
                renderDashboard(student);
                toggleView('dashboard');
                return;
            } catch (e) {
                console.error('Failed to parse stored student:', e);
            }
        }

        // No cached data, fetch fresh
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo, dni })
            });
            const data = await response.json();
            if (data.ok && data.student) {
                sessionStorage.setItem('dashboard_student', JSON.stringify(data.student));
                renderDashboard(data.student);
                toggleView('dashboard');
            }
        } catch (e) {
            console.error('Session restore failed:', e);
        }
    }
})();

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset state
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    btnLogin.disabled = true;
    btnText.textContent = 'Verificando...';

    // Show loading overlay
    showLoading('Verificando credenciales...');

    const codigo = document.getElementById('codigo').value.trim();
    const dni = document.getElementById('dni').value.trim();

    if (!codigo || !dni) {
        hideLoading();
        showError('Por favor ingresa Código y DNI');
        resetBtn();
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ codigo, dni })
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || 'Credenciales inválidas');
        }

        // Store credentials and student data for service redirects and session persistence
        sessionStorage.setItem('dashboard_codigo', codigo);
        sessionStorage.setItem('dashboard_dni', dni);
        sessionStorage.setItem('dashboard_student', JSON.stringify(data.student));
        if (data.carnet) {
            sessionStorage.setItem('dashboard_carnet', JSON.stringify(data.carnet));
        }
        if (data.rectification) {
            sessionStorage.setItem('dashboard_rectification', JSON.stringify(data.rectification));
        }

        // Login Success
        hideLoading();
        renderDashboard(data.student);
        toggleView('dashboard');

    } catch (err) {
        console.error(err);
        hideLoading();
        showError(err.message || 'Error al conectar con el servidor');
    } finally {
        resetBtn();
    }
});

// Rectification Button Handler
// Rectification Button Handler
document.getElementById('btn-rectification').addEventListener('click', () => {
    const codigo = sessionStorage.getItem('dashboard_codigo');
    const dni = sessionStorage.getItem('dashboard_dni');

    if (!codigo || !dni) {
        alert('Sesión expirada. Por favor inicie sesión nuevamente.');
        toggleView('login');
        return;
    }

    // Check if already submitted
    if (sessionStorage.getItem('dashboard_rect_submitted') === 'true') {
        showSubmittedModal();
        return;
    }

    // Check Rectification Status (Payment)
    const rectData = JSON.parse(sessionStorage.getItem('dashboard_rectification') || '{}');
    if (rectData.allowed === false) {
        hideLoading();
        alert(rectData.reason || 'No se encontró un pago válido (boleta) de rectificación para este periodo.');
        return;
    }

    // Show loading and submit
    showLoading('Abriendo Rectificación...');
    document.getElementById('rect-codigo').value = codigo;
    document.getElementById('rect-dni').value = dni;
    document.getElementById('rectification-form').submit();
});

// Carnet Button Handler
document.getElementById('btn-carnet').addEventListener('click', () => {
    const codigo = sessionStorage.getItem('dashboard_codigo');
    const dni = sessionStorage.getItem('dashboard_dni');

    if (!codigo || !dni) {
        alert('Sesión expirada. Por favor inicie sesión nuevamente.');
        toggleView('login');
        return;
    }

    // Check Carnet Status in Session (set by checkCarnetStatus)
    const isSubmitted = sessionStorage.getItem('dashboard_carne_submitted') === 'true';
    if (isSubmitted) {
        showSubmittedModal();
        return;
    }

    const carnetData = JSON.parse(sessionStorage.getItem('dashboard_carnet') || '{}');
    if (carnetData.allowed === false) {
        hideLoading();
        alert(carnetData.reason || 'No se encontró un pago válido de carné universitario para este estudiante.');
        return;
    }

    // Show loading and navigate to service guard
    showLoading('Abriendo Carné Universitario...');
    // Use the new guard route
    const url = `/services/carne/services/carne?code=${encodeURIComponent(codigo)}&dni=${encodeURIComponent(dni)}`;
    window.location.href = url;
});

// Logout Handler
btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('dashboard_codigo');
    sessionStorage.removeItem('dashboard_dni');
    sessionStorage.removeItem('dashboard_student');
    sessionStorage.removeItem('dashboard_carnet');
    sessionStorage.removeItem('dashboard_rectification');
    toggleView('login');
    document.getElementById('login-form').reset();
});

// Helpers
function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

function resetBtn() {
    btnLogin.disabled = false;
    btnText.textContent = 'Ingresar';
}

function toggleView(view) {
    if (view === 'dashboard') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        document.body.classList.remove('is-login');
    } else {
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.body.classList.add('is-login');
    }
}

// Loading overlay functions - Delegating to global loader
function showLoading(text) {
    if (window.showLoader) window.showLoader(text);
}

function hideLoading() {
    if (window.hideLoader) window.hideLoader();
}

function renderDashboard(student) {
    if (!student) {
        showError('No se encontraron datos del estudiante');
        return;
    }

    console.log('Student Data:', student);

    // Mapped based on UMA API (as seen in rectification/app.js)
    const firstName = student.name || student.c_nomalu || '';
    const lastName = student.lastname || student.c_apealu || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Estudiante';

    const codigo = student.code || student.codigo || student.c_codalu || '--';
    const dniVal = student.dni || student.num_doc || '--';

    // Carrera/Programa
    const program = student.specialtyName || student.carrera || student.specialty || '--';

    // Facultad
    const faculty = student.facultyName || student.facultad || student.faculty || '--';

    // Periodo
    const period = student.period || '2026-1';

    // Modalidad (often 'mode' or 'modality')
    const modality = student.mode || student.modality || student.modalidad || '--';

    // Correo & Telefono
    const email = student.email_institucional || student.email || `${codigo}@uma.edu.pe`;
    const phone = student.phone || student.telefono || student.celular || '--';

    // Update Header
    document.getElementById('display-name').textContent = fullName;
    document.getElementById('avatar-initial').textContent = fullName.charAt(0).toUpperCase();

    // Update Grid
    document.getElementById('val-codigo').textContent = codigo;
    document.getElementById('val-dni').textContent = dniVal;
    document.getElementById('val-programa').textContent = program;
    document.getElementById('val-facultad').textContent = faculty;
    document.getElementById('val-periodo').textContent = period;
    document.getElementById('val-modalidad').textContent = modality;
    document.getElementById('val-correo').textContent = email;
    document.getElementById('val-telefono').textContent = phone;

    // Check status after render
    if (codigo !== '--') {
        checkRectificationStatus(codigo);
        // Also check Carnet status logic if DNI is available
        if (dniVal && dniVal !== '--') {
            checkCarnetStatus(dniVal);
        }
    }
}

async function checkRectificationStatus(code) {
    try {
        const res = await fetch(`/services/rectification/api/status/${code}`);
        const data = await res.json();
        const linkDetails = document.getElementById('link-rect-details');

        if (data.submitted) {
            // Already submitted logic
            sessionStorage.setItem('dashboard_rect_submitted', 'true');
            if (data.changes) {
                sessionStorage.setItem('dashboard_rect_changes', JSON.stringify(data.changes));
            }

            // Show "Ver detalles" link
            if (linkDetails) {
                linkDetails.classList.remove('hidden');
                linkDetails.onclick = (e) => {
                    e.preventDefault();
                    showDetailsModal(data.changes || []);
                };
            }

        } else {
            sessionStorage.removeItem('dashboard_rect_submitted');
            sessionStorage.removeItem('dashboard_rect_changes');
            if (linkDetails) linkDetails.classList.add('hidden');
        }
    } catch (e) {
        console.error('Status check error:', e);
    }
}

async function checkCarnetStatus(dni) {
    try {
        const res = await fetch(`/services/carne/api/student/status/${dni}`);
        const data = await res.json();
        const linkDetails = document.getElementById('link-carnet-details');

        if (data.submitted) {
            sessionStorage.setItem('dashboard_carne_submitted', 'true');
            // Show details link
            if (linkDetails) {
                linkDetails.classList.remove('hidden');
                linkDetails.href = `/services/carne/services/carne/detalles?dni=${dni}`;
            }
        } else {
            sessionStorage.removeItem('dashboard_carne_submitted');
            if (linkDetails) linkDetails.classList.add('hidden');
        }
    } catch (e) {
        console.error('Carnet status check error:', e);
    }
}

function submitRectForm() {
    const codigo = sessionStorage.getItem('dashboard_codigo');
    const dni = sessionStorage.getItem('dashboard_dni');
    showLoading('Cargando...');
    document.getElementById('rect-codigo').value = codigo;
    document.getElementById('rect-dni').value = dni;
    document.getElementById('rectification-form').submit();
}

function showSubmittedModal() {
    const m = document.getElementById('modal-submitted');
    m.classList.remove('hidden');
    document.getElementById('btn-close-modal').onclick = () => {
        m.classList.add('hidden');
    };
    m.onclick = (e) => {
        if (e.target === m) m.classList.add('hidden');
    };
}

function showDetailsModal(changes) {
    const m = document.getElementById('modal-details');
    const content = document.getElementById('details-content');

    // Build table
    if (!changes || changes.length === 0) {
        content.innerHTML = '<p class="muted-text">No se encontraron cambios registrados.</p>';
    } else {
        let rows = '';
        changes.forEach((ch, idx) => {
            const from = ch.from || {};
            const to = ch.to || {};
            rows += `
                <tr>
                    <td><strong>${ch.code || '—'}</strong><br><span class="muted-text">${ch.name || ''}</span></td>
                    <td>
                        <span class="badge old">Antes</span><br>
                        Sec. ${from.group || '—'}<br>
                        ${from.day || ''} ${from.time || ''}
                    </td>
                    <td>
                        <span class="badge new">Ahora</span><br>
                        Sec. ${to.group || '—'}<br>
                        ${to.day || ''} ${to.time || ''}
                    </td>
                </tr>
            `;
        });

        content.innerHTML = `
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Curso</th>
                        <th>Horario Anterior</th>
                        <th>Horario Nuevo</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    m.classList.remove('hidden');

    const closeBtn = document.getElementById('btn-close-details');
    if (closeBtn) {
        closeBtn.onclick = () => m.classList.add('hidden');
    }

    m.onclick = (e) => {
        if (e.target === m) m.classList.add('hidden');
    };
}
