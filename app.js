/* =====================================================
   DATA
===================================================== */
const VEHICLES = [
    { id:'vios', name:'Toyota Vios', type:'Sedan', transmission:'Automatic', fuel:'Petrol', seats:5, bags:2, doors:4, icon:'fa-car', price12:2500, priceDay:5000 },
    { id:'city', name:'Honda City', type:'Sedan', transmission:'Automatic', fuel:'Petrol', seats:5, bags:2, doors:4, icon:'fa-car', price12:2700, priceDay:5400 },
    { id:'xpander', name:'Mitsubishi Xpander', type:'MPV', transmission:'Automatic', fuel:'Petrol', seats:7, bags:4, doors:5, icon:'fa-van-shuttle', price12:3000, priceDay:6000 },
    { id:'fortuner', name:'Toyota Fortuner', type:'SUV', transmission:'Automatic', fuel:'Diesel', seats:7, bags:4, doors:5, icon:'fa-car-side', price12:5000, priceDay:9000 }
];

const TIME_SLOTS = [
    { start:'7:00 AM', end:'7:00 PM' },
    { start:'10:00 PM', end:'10:00 AM' },
    { start:'1:00 PM', end:'1:00 AM' },
    { start:'4:00 AM', end:'4:00 PM' }
];

const LOCATIONS = ['Quezon City, Metro Manila', 'Makati City, Metro Manila', 'Pasig City, Metro Manila', 'Taguig City, Metro Manila'];

/* =====================================================
   STATE
===================================================== */
const state = {
    rentalType: null,      // '12hour' | 'wholeday'
    location: LOCATIONS[0],
    date: null,             // 'YYYY-MM-DD' single date (12hr)
    timeSlot: null,          // { start, end }
    rangeStart: null,        // 'YYYY-MM-DD' (whole day)
    rangeEnd: null,
    vehicle: null,
    sort: 'low'
};

let bookings = JSON.parse(localStorage.getItem('luna_bookings') || '[]');

/* =====================================================
   VIEW ROUTING
===================================================== */
const VIEW_IDS = ['home','chooseType','selectDateTime','selectDates','searchResults','vehicleDetails','bookingSummary','checkout','confirmation','myBookings'];
const historyStack = [];

function showView(name, opts = {}) {
    if (!opts.fromBack) historyStack.push(name);

    VIEW_IDS.forEach(id => {
        const el = document.getElementById(`view-${id}`);
        if (el) el.style.display = (id === name) ? 'block' : 'none';
    });

    const isHome = name === 'home';
    document.getElementById('mainHeader').style.display = isHome ? 'block' : 'none';
    document.getElementById('flowHeader').style.display = isHome ? 'none' : 'block';
    document.getElementById('siteFooter').style.display = isHome ? 'block' : 'none';

    window.scrollTo({ top:0, behavior:'instant' });

    if (name === 'chooseType') renderChooseType();
    if (name === 'selectDateTime') renderDateTimeView();
    if (name === 'selectDates') renderDatesView();
    if (name === 'searchResults') renderSearchResults();
    if (name === 'vehicleDetails') renderVehicleDetails();
    if (name === 'bookingSummary') renderBookingSummary();
    if (name === 'myBookings') renderMyBookings();
}

function goBack() {
    historyStack.pop(); // remove current
    const prev = historyStack.pop() || 'home';
    showView(prev);
}

document.getElementById('flowBackBtn').addEventListener('click', goBack);

document.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        showView(el.getAttribute('data-go'));
    });
});

document.querySelectorAll('.scroll-link').forEach(el => {
    el.addEventListener('click', (e) => {
        const targetId = el.getAttribute('data-scroll') || (el.getAttribute('href') || '').replace('#','');
        const target = document.getElementById(targetId);
        if (target) {
            e.preventDefault();
            showView('home');
            setTimeout(() => target.scrollIntoView({ behavior:'smooth', block:'start' }), 30);
        }
    });
});

/* =====================================================
   FORMAT HELPERS
===================================================== */
function formatCurrency(n){ return `₱${n.toLocaleString('en-PH')}`; }
function pad(n){ return String(n).padStart(2,'0'); }
function toDateStr(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseDateStr(s){ const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
function formatShortDate(s){
    if(!s) return '--';
    return parseDateStr(s).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}
function generateBookingId(){
    const digits = () => Math.floor(100000 + Math.random()*900000);
    return `LUNA-${digits()}`;
}

/* =====================================================
   POPULAR VEHICLES (HOME)
===================================================== */
function renderPopularVehicles(){
    const grid = document.getElementById('popularVehicleGrid');
    grid.innerHTML = VEHICLES.map(v => `
        <div class="vehicle-card">
            <div class="vehicle-card-media"><i class="fa-solid ${v.icon}"></i></div>
            <div class="vehicle-card-body">
                <h3>${v.name}</h3>
                <p class="vc-type">${v.type} · ${v.transmission}</p>
                <div class="vc-bottom-row">
                    <div class="vc-price">${formatCurrency(v.price12)} <small>/12 hrs</small></div>
                    <button type="button" class="vc-view-btn" data-vehicle="${v.id}">View Details</button>
                </div>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.vc-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.vehicle = VEHICLES.find(v => v.id === btn.getAttribute('data-vehicle'));
            if (!state.rentalType) state.rentalType = '12hour';
            showView('vehicleDetails');
        });
    });
}
renderPopularVehicles();

document.getElementById('viewAllVehiclesLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('fleet').scrollIntoView({ behavior:'smooth', block:'start' });
});

/* =====================================================
   QUICK SEARCH FORM (HOME)
===================================================== */
const qsDate = document.getElementById('qsDate');
(function initQsDate(){
    const today = new Date();
    qsDate.min = toDateStr(today);
    qsDate.value = toDateStr(today);
})();

document.getElementById('quickSearchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.location = document.getElementById('qsLocation').value;
    const type = document.getElementById('qsType').value;
    const dateVal = qsDate.value;

    if (type) {
        state.rentalType = type;
        if (dateVal) { state.date = dateVal; state.rangeStart = dateVal; }
        showView(type === '12hour' ? 'selectDateTime' : 'selectDates');
    } else {
        showView('chooseType');
    }
});

/* =====================================================
   CHOOSE RENTAL TYPE
===================================================== */
function renderChooseType(){
    document.querySelectorAll('.rental-type-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-type') === state.rentalType);
    });
    updateInfoBox();
}

function updateInfoBox(){
    const title = document.getElementById('infoBoxTitle');
    const text = document.getElementById('infoBoxText');
    if (state.rentalType === 'wholeday') {
        title.textContent = 'About Whole Day Rental';
        text.textContent = 'Whole Day Rental gives you the vehicle for a full 24 hours from your pickup time to the same time the next day, ideal for out-of-town trips.';
    } else {
        title.textContent = 'About 12-Hour Rental';
        text.textContent = 'Each 12-hour rental includes a 3-hour preparation gap between bookings for cleaning, inspection, and refueling between rentals.';
    }
}

document.querySelectorAll('.rental-type-card').forEach(card => {
    card.addEventListener('click', () => {
        const type = card.getAttribute('data-type');
        state.rentalType = type;
        document.querySelectorAll('.rental-type-card').forEach(c => c.classList.toggle('active', c === card));
        updateInfoBox();
        setTimeout(() => {
            showView(type === '12hour' ? 'selectDateTime' : 'selectDates');
        }, 180);
    });
});

/* =====================================================
   CALENDAR ENGINE
===================================================== */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildCalendarGrid(gridEl, viewDate, opts){
    // opts: { minDate, isSelected(dateStr) -> class list, onSelect(dateStr) }
    gridEl.innerHTML = '';
    DOW.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-dow';
        el.textContent = d;
        gridEl.appendChild(el);
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const todayStr = toDateStr(new Date());

    for (let i=0; i<startOffset; i++){
        const blank = document.createElement('div');
        blank.className = 'cal-day cal-day-blank';
        gridEl.appendChild(blank);
    }

    for (let day=1; day<=daysInMonth; day++){
        const d = new Date(year, month, day);
        const dateStr = toDateStr(d);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-day';
        btn.textContent = day;

        if (dateStr === todayStr) btn.classList.add('today');

        const extraClass = opts.getClass ? opts.getClass(dateStr) : '';
        if (extraClass) btn.classList.add(...extraClass.split(' ').filter(Boolean));

        const disabled = opts.minDate && dateStr < opts.minDate;
        if (disabled) {
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => opts.onSelect(dateStr));
        }

        gridEl.appendChild(btn);
    }
}

/* ---- 12-Hour rental date/time picker ---- */
let calView12 = new Date();

function renderDateTimeView(){
    const gridEl = document.getElementById('calGrid12');
    const labelEl = document.getElementById('calLabel12');
    const todayStr = toDateStr(new Date());

    if (!state.date) state.date = todayStr;

    labelEl.textContent = `${MONTH_NAMES[calView12.getMonth()]} ${calView12.getFullYear()}`;

    buildCalendarGrid(gridEl, calView12, {
        minDate: todayStr,
        getClass: (dateStr) => dateStr === state.date ? 'selected' : '',
        onSelect: (dateStr) => {
            state.date = dateStr;
            state.timeSlot = null;
            renderDateTimeView();
        }
    });

    document.getElementById('slotsDateLabel').textContent = formatShortDate(state.date);

    const list = document.getElementById('timeSlotList');
    list.innerHTML = TIME_SLOTS.map((slot, i) => `
        <button type="button" class="time-slot ${state.timeSlot && state.timeSlot.start === slot.start ? 'selected' : ''}" data-idx="${i}">
            <span>${slot.start} - ${slot.end}</span>
            <span>${formatCurrency(2500)}</span>
        </button>
    `).join('');

    list.querySelectorAll('.time-slot').forEach(btn => {
        btn.addEventListener('click', () => {
            state.timeSlot = TIME_SLOTS[Number(btn.getAttribute('data-idx'))];
            renderDateTimeView();
        });
    });

    document.getElementById('continue12Btn').disabled = !(state.date && state.timeSlot);
}

document.getElementById('calPrev12').addEventListener('click', () => {
    calView12 = new Date(calView12.getFullYear(), calView12.getMonth()-1, 1);
    renderDateTimeView();
});
document.getElementById('calNext12').addEventListener('click', () => {
    calView12 = new Date(calView12.getFullYear(), calView12.getMonth()+1, 1);
    renderDateTimeView();
});
document.getElementById('continue12Btn').addEventListener('click', () => {
    if (state.date && state.timeSlot) showView('searchResults');
});

/* ---- Whole day rental range picker ---- */
let calViewDay = new Date();

function renderDatesView(){
    const gridEl = document.getElementById('calGridDay');
    const labelEl = document.getElementById('calLabelDay');
    const todayStr = toDateStr(new Date());

    labelEl.textContent = `${MONTH_NAMES[calViewDay.getMonth()]} ${calViewDay.getFullYear()}`;

    buildCalendarGrid(gridEl, calViewDay, {
        minDate: todayStr,
        getClass: (dateStr) => {
            if (state.rangeStart && dateStr === state.rangeStart && (!state.rangeEnd || state.rangeEnd === state.rangeStart)) return 'range-start range-end';
            if (state.rangeStart && dateStr === state.rangeStart) return 'range-start';
            if (state.rangeEnd && dateStr === state.rangeEnd) return 'range-end';
            if (state.rangeStart && state.rangeEnd && dateStr > state.rangeStart && dateStr < state.rangeEnd) return 'in-range';
            return '';
        },
        onSelect: (dateStr) => {
            if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
                state.rangeStart = dateStr;
                state.rangeEnd = null;
            } else if (dateStr < state.rangeStart) {
                state.rangeStart = dateStr;
                state.rangeEnd = null;
            } else {
                state.rangeEnd = dateStr;
            }
            renderDatesView();
        }
    });

    document.getElementById('rangePickupLabel').textContent = state.rangeStart ? formatShortDate(state.rangeStart) : 'Select a date';
    document.getElementById('rangeReturnLabel').textContent = state.rangeEnd ? formatShortDate(state.rangeEnd) : 'Select a date';

    const durationBox = document.getElementById('rangeDurationBox');
    if (state.rangeStart && state.rangeEnd) {
        const days = Math.round((parseDateStr(state.rangeEnd) - parseDateStr(state.rangeStart)) / 86400000);
        durationBox.style.display = 'flex';
        document.getElementById('rangeDurationLabel').textContent = `${days} Day${days !== 1 ? 's' : ''}`;
    } else {
        durationBox.style.display = 'none';
    }

    document.getElementById('continueDayBtn').disabled = !(state.rangeStart && state.rangeEnd);
}

document.getElementById('calPrevDay').addEventListener('click', () => {
    calViewDay = new Date(calViewDay.getFullYear(), calViewDay.getMonth()-1, 1);
    renderDatesView();
});
document.getElementById('calNextDay').addEventListener('click', () => {
    calViewDay = new Date(calViewDay.getFullYear(), calViewDay.getMonth()+1, 1);
    renderDatesView();
});
document.getElementById('continueDayBtn').addEventListener('click', () => {
    if (state.rangeStart && state.rangeEnd) showView('searchResults');
});

/* =====================================================
   SEARCH RESULTS
===================================================== */
function getDurationDays(){
    if (state.rentalType === 'wholeday' && state.rangeStart && state.rangeEnd) {
        return Math.round((parseDateStr(state.rangeEnd) - parseDateStr(state.rangeStart)) / 86400000);
    }
    return 1;
}

function getVehiclePrice(v){
    if (state.rentalType === 'wholeday') return v.priceDay * getDurationDays();
    return v.price12;
}

function renderSearchResults(){
    const isWholeDay = state.rentalType === 'wholeday';

    document.getElementById('ssRentalType').textContent = isWholeDay ? 'Whole Day Rental' : '12-Hour Rental';
    document.getElementById('ssPickupDate').textContent = isWholeDay ? formatShortDate(state.rangeStart) : formatShortDate(state.date);
    document.getElementById('ssLocation').textContent = state.location;

    document.getElementById('ssTimeSlotRow').style.display = isWholeDay ? 'none' : 'flex';
    document.getElementById('ssReturnDateRow').style.display = isWholeDay ? 'flex' : 'none';
    if (!isWholeDay) document.getElementById('ssTimeSlot').textContent = state.timeSlot ? `${state.timeSlot.start} - ${state.timeSlot.end}` : '--';
    if (isWholeDay) document.getElementById('ssReturnDate').textContent = formatShortDate(state.rangeEnd);

    renderResultList();
}

function renderResultList(){
    const sort = document.getElementById('sortSelect').value;
    state.sort = sort;

    let vehicles = [...VEHICLES];
    vehicles.sort((a,b) => {
        const pa = getVehiclePrice(a), pb = getVehiclePrice(b);
        return sort === 'low' ? pa - pb : pb - pa;
    });

    document.getElementById('resultsCountLabel').textContent = `${vehicles.length} vehicles available for your selected schedule`;

    const listEl = document.getElementById('resultVehicleList');
    listEl.innerHTML = vehicles.map(v => `
        <div class="result-card">
            <div class="result-card-media"><i class="fa-solid ${v.icon}"></i></div>
            <div class="result-card-body">
                <h3>${v.name}</h3>
                <p class="rc-type">${v.type} · ${v.transmission}</p>
                <div class="rc-specs">
                    <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
                    <span><i class="fa-solid fa-gears"></i> ${v.transmission}</span>
                </div>
            </div>
            <div class="result-card-action">
                <div class="rc-price">${formatCurrency(getVehiclePrice(v))}<small>${state.rentalType === 'wholeday' ? `for ${getDurationDays()} day${getDurationDays() !== 1 ? 's' : ''}` : 'per 12 hrs'}</small></div>
                <button type="button" class="view-details-btn" data-vehicle="${v.id}">View Details</button>
            </div>
        </div>
    `).join('');

    listEl.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.vehicle = VEHICLES.find(v => v.id === btn.getAttribute('data-vehicle'));
            showView('vehicleDetails');
        });
    });
}

document.getElementById('sortSelect').addEventListener('change', renderResultList);
document.getElementById('changeSearchBtn').addEventListener('click', () => {
    showView(state.rentalType === 'wholeday' ? 'selectDates' : 'selectDateTime');
});

/* =====================================================
   VEHICLE DETAILS
===================================================== */
function renderVehicleDetails(){
    const v = state.vehicle || VEHICLES[0];
    state.vehicle = v;

    document.getElementById('vdPhotoMain').innerHTML = `<i class="fa-solid ${v.icon}"></i>`;
    document.getElementById('vdName').textContent = v.name;
    document.getElementById('vdType').textContent = `${v.type} · ${v.transmission} · ${v.fuel}`;

    document.getElementById('vdSpecs').innerHTML = `
        <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
        <span><i class="fa-solid fa-gears"></i> ${v.transmission}</span>
        <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
        <span><i class="fa-solid fa-suitcase"></i> ${v.bags} Bags</span>
        <span><i class="fa-solid fa-door-closed"></i> ${v.doors} Doors</span>
        <span><i class="fa-solid fa-snowflake"></i> Air Conditioning</span>
    `;

    document.getElementById('vdPhotoStrip').innerHTML = [1,2,3,4].map((n,i) => `
        <div class="strip-thumb ${i === 0 ? 'active' : ''}"><i class="fa-solid ${v.icon}"></i></div>
    `).join('');

    const isWholeDay = state.rentalType === 'wholeday';
    document.getElementById('vdRentalTypeLabel').textContent = isWholeDay ? 'Whole Day Rental' : '12-Hour Rental';
    document.getElementById('vdPriceAmount').textContent = formatCurrency(getVehiclePrice(v));

    if (isWholeDay) {
        document.getElementById('vdPriceSub').textContent = state.rangeStart && state.rangeEnd
            ? `${formatShortDate(state.rangeStart)} - ${formatShortDate(state.rangeEnd)}`
            : 'Select your dates';
    } else {
        document.getElementById('vdPriceSub').textContent = state.timeSlot
            ? `${state.timeSlot.start} - ${state.timeSlot.end}`
            : 'Select a time slot';
    }
}

document.getElementById('selectVehicleBtn').addEventListener('click', () => {
    if (!state.rentalType) { showView('chooseType'); return; }
    if (state.rentalType === '12hour' && !(state.date && state.timeSlot)) { showView('selectDateTime'); return; }
    if (state.rentalType === 'wholeday' && !(state.rangeStart && state.rangeEnd)) { showView('selectDates'); return; }
    showView('bookingSummary');
});

/* =====================================================
   BOOKING SUMMARY
===================================================== */
function renderBookingSummary(){
    const v = state.vehicle;
    const isWholeDay = state.rentalType === 'wholeday';
    const price = getVehiclePrice(v);

    document.getElementById('bsVehicleIcon').innerHTML = `<i class="fa-solid ${v.icon}"></i>`;
    document.getElementById('bsVehicleName').textContent = v.name;
    document.getElementById('bsVehicleType').textContent = `${v.type} · ${v.transmission} · ${v.fuel}`;

    document.getElementById('bsRentalType').textContent = isWholeDay ? 'Whole Day Rental' : '12-Hour Rental';
    document.getElementById('bsPickupDate').textContent = isWholeDay ? formatShortDate(state.rangeStart) : formatShortDate(state.date);
    document.getElementById('bsLocation').textContent = state.location;

    document.getElementById('bsTimeSlotRow').style.display = isWholeDay ? 'none' : 'flex';
    document.getElementById('bsReturnDateRow').style.display = isWholeDay ? 'flex' : 'none';
    if (!isWholeDay) document.getElementById('bsTimeSlot').textContent = `${state.timeSlot.start} - ${state.timeSlot.end}`;
    if (isWholeDay) document.getElementById('bsReturnDate').textContent = formatShortDate(state.rangeEnd);

    document.getElementById('bsPrice').textContent = formatCurrency(price);
    document.getElementById('bsTotal').textContent = formatCurrency(price);
}

document.getElementById('continueCheckoutBtn').addEventListener('click', () => showView('checkout'));

/* =====================================================
   CHECKOUT
===================================================== */
document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const v = state.vehicle;
    const isWholeDay = state.rentalType === 'wholeday';
    const price = getVehiclePrice(v);
    const payMethod = form.querySelector('input[name="payMethod"]:checked').value;

    const booking = {
        id: generateBookingId(),
        submittedAt: new Date().toISOString(),
        status: 'pending',
        vehicle: { id:v.id, name:v.name, type:v.type, transmission:v.transmission, icon:v.icon },
        rentalType: state.rentalType,
        location: state.location,
        pickup: isWholeDay ? state.rangeStart : state.date,
        pickupTimeSlot: isWholeDay ? null : state.timeSlot,
        returnDate: isWholeDay ? state.rangeEnd : state.date,
        total: price,
        contact: {
            name: document.getElementById('ckName').value.trim(),
            email: document.getElementById('ckEmail').value.trim(),
            phone: document.getElementById('ckPhone').value.trim()
        },
        payMethod
    };

    bookings.push(booking);
    localStorage.setItem('luna_bookings', JSON.stringify(bookings));

    renderConfirmation(booking);
    showView('confirmation');
});

/* =====================================================
   CONFIRMATION
===================================================== */
function renderConfirmation(booking){
    document.getElementById('cfBookingId').textContent = booking.id;
    document.getElementById('cfVehicle').textContent = booking.vehicle.name;
    document.getElementById('cfPickup').textContent = booking.rentalType === 'wholeday'
        ? formatShortDate(booking.pickup)
        : `${formatShortDate(booking.pickup)}, ${booking.pickupTimeSlot.start}`;
    document.getElementById('cfReturn').textContent = booking.rentalType === 'wholeday'
        ? formatShortDate(booking.returnDate)
        : `${formatShortDate(booking.pickup)}, ${booking.pickupTimeSlot.end}`;
}

document.getElementById('goToBookingsBtn').addEventListener('click', () => showView('myBookings'));

/* =====================================================
   MY BOOKINGS
===================================================== */
function renderMyBookings(){
    const listEl = document.getElementById('myBookingsList');
    const emptyEl = document.getElementById('myBookingsEmpty');

    if (!bookings.length) {
        listEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
    }

    listEl.style.display = 'flex';
    emptyEl.style.display = 'none';

    listEl.innerHTML = bookings.slice().reverse().map(b => `
        <div class="booking-item-card">
            <div class="bi-icon"><i class="fa-solid ${b.vehicle.icon}"></i></div>
            <div class="bi-body">
                <strong>${b.vehicle.name}</strong>
                <span>${b.id} · ${formatShortDate(b.pickup)}</span>
            </div>
            <div class="status-pending">Pending</div>
        </div>
    `).join('');
}

/* =====================================================
   MOBILE MENU
===================================================== */
document.getElementById('mobileMenuToggle').addEventListener('click', () => {
    const nav = document.querySelector('.main-nav');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.cssText += 'position:absolute; top:76px; left:0; width:100%; background:#fff; flex-direction:column; padding:20px 6%; border-bottom:1px solid var(--line); gap:16px;';
});

/* =====================================================
   INIT
===================================================== */
showView('home');