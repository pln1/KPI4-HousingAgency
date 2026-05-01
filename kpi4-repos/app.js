// --- ІНІЦІАЛІЗАЦІЯ ДАНИХ (Симуляція БД через localStorage) ---
let properties = [];
let requests = [];

function loadData() {
    const savedProperties = localStorage.getItem('agencyProperties');
    const savedRequests = localStorage.getItem('agencyRequests');
    
    if (savedProperties && savedRequests) {
        properties = JSON.parse(savedProperties);
        requests = JSON.parse(savedRequests);
    } else {
        // Дефолтні дані, якщо БД порожня
        properties = [
            { id: 'p1', address: 'м. Київ, вул. Політехнічна, 14', rooms: 1, price: 12000, status: 'Активне' },
            { id: 'p2', address: 'м. Київ, пр-т Берестейський, 37', rooms: 2, price: 18000, status: 'Активне' }
        ];
        requests = [];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('agencyProperties', JSON.stringify(properties));
    localStorage.setItem('agencyRequests', JSON.stringify(requests));
}

// --- НАВІГАЦІЯ ТА РОЛІ ---
document.getElementById('roleSelect').addEventListener('change', switchRole);
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openTab(e, btn.dataset.target));
});

function switchRole() {
    const role = document.getElementById('roleSelect').value;
    const body = document.getElementById('bodyElement');
    const title = document.getElementById('headerTitle');
    
    body.className = 'role-' + role;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'none');
    
    const activeNavs = document.querySelectorAll('.nav-' + role);
    activeNavs.forEach(btn => btn.style.display = 'block');
    
    if(role === 'owner') { title.innerText = 'ІС Житлове агентство: Кабінет Власника'; activeNavs[0].click(); }
    else if(role === 'tenant') { title.innerText = 'ІС Житлове агентство: Кабінет Орендара'; activeNavs[0].click(); }
    else if(role === 'realtor') { title.innerText = 'ІС Житлове агентство: Кабінет Рієлтора'; activeNavs[0].click(); }
    
    renderAll();
}

function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// --- ВЛАСНИК (Owner Controller) ---
document.getElementById('addPropertyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    properties.push({
        id: 'p' + Date.now(),
        address: document.getElementById('propAddress').value,
        rooms: document.getElementById('propRooms').value,
        price: document.getElementById('propPrice').value,
        status: 'Активне'
    });
    saveData();
    this.reset();
    alert("Об'єкт успішно опубліковано!");
    document.querySelector('.nav-owner').click();
    renderAll();
});

window.archiveProperty = function(id) {
    if(confirm("Зняти об'єкт з оренди (Архівувати)?")) {
        let prop = properties.find(p => p.id === id);
        if(prop) prop.status = 'В архіві';
        
        // Каскадне скасування заявок
        requests.forEach(r => { 
            if(r.propertyId === id && (r.status === 'Створена' || r.status === 'Оглянуто')) {
                r.status = 'Скасована (Обєкт знято з оренди)'; 
            }
        });
        saveData();
        renderAll();
    }
}

// --- ОРЕНДАР (Tenant Controller) ---
window.createRequest = function(propId, address) {
    const date = prompt("Введіть бажану дату та час огляду:", "2026-05-15 12:00");
    if(date) {
        requests.push({ 
            id: 'r' + Date.now(), propertyId: propId, address: address, 
            tenantName: 'Поточний Орендар', date: date, status: 'Створена' 
        });
        saveData();
        alert("Заявку на перегляд створено!");
        document.querySelectorAll('.nav-tenant')[1].click();
        renderAll();
    }
}

window.cancelRequest = function(reqId) {
    if(confirm("Ви дійсно хочете скасувати заявку?")) {
        let req = requests.find(r => r.id === reqId);
        if(req && req.status === 'Створена') {
            req.status = 'Скасована орендарем';
            saveData();
            renderAll();
        }
    }
}

// --- РІЄЛТОР (Realtor Controller) ---
window.completeInspection = function(reqId) {
    let req = requests.find(r => r.id === reqId);
    let prop = properties.find(p => p.id === req.propertyId);
    
    if(req && req.status === 'Створена' && prop && prop.status === 'Активне') {
        req.status = 'Оглянуто';
        saveData();
        alert("Огляд зафіксовано. Тепер можна переходити до укладання договору.");
        renderAll();
    } else {
        alert("Помилка: Заявку було скасовано або об'єкт більше не доступний.");
    }
}

window.signContract = function(propId, reqId) {
    let prop = properties.find(p => p.id === propId);
    let req = requests.find(r => r.id === reqId);
    
    if(prop && prop.status === 'Активне' && req && req.status === 'Оглянуто') {
        prop.status = 'Здано';
        req.status = 'Угода укладена';
        
        // Скасування інших заявок на цей же об'єкт
        requests.forEach(r => {
            if(r.propertyId === propId && r.id !== reqId && (r.status === 'Створена' || r.status === 'Оглянуто')) {
                r.status = 'Скасована (Обєкт вже здано)';
            }
        });
        saveData();
        alert("Договір успішно укладено!");
        renderAll();
    } else {
        alert("Дія неможлива. Перевірте актуальність статусу об'єкта або заявки.");
    }
}

// --- РЕНДЕРИНГ ІНТЕРФЕЙСУ ---
function renderAll() {
    // Власник
    const ownerProps = document.getElementById('ownerPropertiesList');
    const ownerReqs = document.getElementById('ownerRequestsList');
    ownerProps.innerHTML = ''; ownerReqs.innerHTML = '';

    properties.forEach(prop => {
        ownerProps.innerHTML += `
            <div class="card">
                <div class="card-details">
                    <strong>${prop.address}</strong><br>
                    Кімнат: ${prop.rooms} | Ціна: ${prop.price} грн<br>
                    Статус: <strong>${prop.status}</strong>
                </div>
                <div class="card-actions">
                    ${prop.status === 'Активне' ? `<button class="btn btn-danger" onclick="archiveProperty('${prop.id}')">Зняти з оренди</button>` : ''}
                </div>
            </div>`;
    });

    requests.forEach(req => {
        ownerReqs.innerHTML += `
            <div class="card">
                <div class="card-details">
                    <strong>Об'єкт:</strong> ${req.address}<br>
                    <strong>Орендар:</strong> ${req.tenantName} | <strong>Час:</strong> ${req.date}<br>
                    <strong>Статус заявки:</strong> ${req.status}
                </div>
            </div>`;
    });

    // Орендар
    const tenantCat = document.getElementById('tenantCatalogList');
    const tenantReqs = document.getElementById('tenantRequestsList');
    tenantCat.innerHTML = ''; tenantReqs.innerHTML = '';

    properties.filter(p => p.status === 'Активне').forEach(prop => {
        tenantCat.innerHTML += `
            <div class="card">
                <div class="card-details"><strong>${prop.address}</strong><br>Кімнат: ${prop.rooms} | Ціна: ${prop.price} грн</div>
                <div class="card-actions"><button class="btn btn-primary" onclick="createRequest('${prop.id}', '${prop.address}')">Записатися</button></div>
            </div>`;
    });

    requests.forEach(req => {
        tenantReqs.innerHTML += `
            <div class="card">
                <div class="card-details"><strong>${req.address}</strong><br>Час: ${req.date} | Статус: <strong>${req.status}</strong></div>
                <div class="card-actions">
                    ${req.status === 'Створена' ? `<button class="btn btn-danger" onclick="cancelRequest('${req.id}')">Скасувати</button>` : ''}
                </div>
            </div>`;
    });

    // Рієлтор
    const realtorInsp = document.getElementById('realtorInspectionsList');
    const realtorContr = document.getElementById('realtorContractsList');
    realtorInsp.innerHTML = ''; realtorContr.innerHTML = '';

    requests.filter(r => r.status === 'Створена').forEach(req => {
        realtorInsp.innerHTML += `
            <div class="card">
                <div class="card-details"><strong>${req.address}</strong><br>Клієнт: ${req.tenantName} | Час: ${req.date}</div>
                <div class="card-actions"><button class="btn btn-warning" onclick="completeInspection('${req.id}')">Зафіксувати огляд</button></div>
            </div>`;
    });

    requests.filter(r => r.status === 'Оглянуто').forEach(req => {
        realtorContr.innerHTML += `
            <div class="card">
                <div class="card-details"><strong>${req.address}</strong><br>Клієнт: ${req.tenantName}</div>
                <div class="card-actions"><button class="btn btn-success" onclick="signContract('${req.propertyId}', '${req.id}')">Укласти договір</button></div>
            </div>`;
    });
}

// Старт додатку
window.onload = function() {
    loadData();
    switchRole(); 
};