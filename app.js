/* =====================================================
   DATA
===================================================== */
/* Vehicle preview photos live in assets/vehicles/, named by code (TV, HC, MX, TF).
   Drop your images in there using these exact filenames and they'll appear automatically.
   Until a file exists, the layout falls back to the icon placeholder below. */
const VEHICLES = [
    { id:'xpander', code:'MX', nickname:'Luna', name:'Mitsubishi Xpander GLS', year:2026, type:'MPV', transmission:'Automatic', fuel:'Petrol', seats:7, bags:4, doors:5, icon:'fa-van-shuttle', image:'assets/vehicles/MX.jpg', price12:2300, priceDay:3200, rating:4.9, reviewLabel:'loved by 120+ families' }
];

// Vehicle photos are temporarily disabled site-wide — every media slot falls
// back to its icon placeholder until real photography is ready to drop in.
// Flip this back on (return the <img> tag) once assets/vehicles/*.jpg are set.
function vehiclePhotoTag(v){
    return '';
}

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
    sort: 'low',
    editingBookingId: null,  // set when editing an existing pending booking
    fromVehicleDetails: false // true when re-picking dates for a vehicle already chosen, so Continue should return to that vehicle's summary instead of the results list
};

let bookings = JSON.parse(localStorage.getItem('everyride_bookings') || '[]');

/* =====================================================
   VIEW ROUTING
   One consistent app shell (sidebar on desktop / slide-in
   drawer on mobile) wraps every view. A slim "flow context
   bar" (back button + step progress) appears above any
   booking-flow screen; the footer appears only on browse-
   type pages. This is the single source of navigation for
   the whole site, desktop and mobile alike.
===================================================== */
const VIEW_IDS = ['home','chooseType','selectDateTime','selectDates','searchResults','vehicleDetails','bookingSummary','checkout','confirmation','myBookings','allVehicles','about','contact'];

// Pages that use the plain browse layout (sidebar + content + footer, no back button).
const PRIMARY_PAGES = ['home','allVehicles','about','contact'];

// Real back-stack: forward navigation pushes, goBack pops and re-renders
// the previous entry without pushing it again (no double-pop tricks).
let historyStack = ['home'];

const BOOKING_FLOW_STEP = {
    chooseType: 0,
    selectDateTime: 1,
    selectDates: 1,
    searchResults: 2,
    bookingSummary: 3,
    checkout: 3,
    confirmation: 4
};

function updateBookingFlowProgress(viewName){
    const step = BOOKING_FLOW_STEP[viewName];
    const progressEl = document.getElementById('bookingFlowProgress');
    progressEl.style.display = step === undefined ? 'none' : 'block';
    if (step === undefined) return;
    const stages = [...document.querySelectorAll('#bookingFlowProgress .flow-stage')];
    const links = [...document.querySelectorAll('#bookingFlowProgress .flow-link')];
    stages.forEach((stage, index) => {
        stage.classList.toggle('done', index < step);
        stage.classList.toggle('current', index === step);
    });
    links.forEach((link, index) => link.classList.toggle('done', index < step));
}

/* =====================================================
   TAB LOADING SCREEN
   A brief branded loading screen plays in the content area
   whenever the user switches between the app's primary tabs
   — Home, Vehicles, My Bookings, About Us, Contact Us —
   whether triggered from the sidebar, the mobile topbar, or
   any in-page link/button that points at one of those tabs.
   Multi-step flows (choosing a rental type, dates, checkout,
   etc.) are untouched and stay instant.
===================================================== */
const TAB_VIEWS = ['home', 'allVehicles', 'myBookings', 'about', 'contact'];
const TAB_LOADING_LABELS = {
    home: 'Loading Home',
    allVehicles: 'Loading Vehicles',
    myBookings: 'Loading My Bookings',
    about: 'Loading About Us',
    contact: 'Loading Contact'
};
const TAB_LOADING_DURATION = 420;

let currentView = 'home';
let tabLoadingTimer = null;

const tabLoadingOverlay = document.getElementById('tabLoadingOverlay');
const tabLoadingText = document.getElementById('tabLoadingText');

function showTabLoading(name){
    tabLoadingText.textContent = TAB_LOADING_LABELS[name] || 'Loading';
    tabLoadingOverlay.classList.add('show');
}
function hideTabLoading(){
    tabLoadingOverlay.classList.remove('show');
}

function showView(name, opts = {}) {
    closeDrawer();

    const isTabChange = TAB_VIEWS.includes(name) && name !== currentView;

    if (isTabChange) {
        clearTimeout(tabLoadingTimer);
        showTabLoading(name);
        tabLoadingTimer = setTimeout(() => {
            commitViewChange(name, opts, true);
            hideTabLoading();
        }, TAB_LOADING_DURATION);
    } else {
        commitViewChange(name, opts, false);
    }
}

function commitViewChange(name, opts, animate) {
    currentView = name;

    if (!opts.fromBack && historyStack[historyStack.length - 1] !== name) {
        historyStack.push(name);
    }

    VIEW_IDS.forEach(id => {
        const el = document.getElementById(`view-${id}`);
        if (el) el.style.display = (id === name) ? 'block' : 'none';
    });

    const isPrimaryPage = PRIMARY_PAGES.includes(name);
    document.getElementById('siteFooter').style.display = isPrimaryPage ? 'block' : 'none';

    const flowBar = document.getElementById('flowContextBar');
    flowBar.style.display = isPrimaryPage ? 'none' : 'block';
    const flowTitleEl = document.getElementById('flowContextTitle');
    if (!isPrimaryPage) flowTitleEl.textContent = FLOW_TITLES[name] || '';
    updateBookingFlowProgress(name);

    const highlightTarget = NAV_HIGHLIGHT[name];
    document.querySelectorAll('.sidebar-nav button[data-go]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-go') === highlightTarget);
    });

    window.scrollTo({ top:0, behavior:'instant' });

    if (animate) {
        const activeEl = document.getElementById(`view-${name}`);
        if (activeEl) {
            activeEl.classList.remove('view-enter');
            void activeEl.offsetWidth; // force reflow so the fade-in replays every time
            activeEl.classList.add('view-enter');
        }
    }

    if (name === 'home') { renderFamilySpotlight(); renderUpcomingTrip(); }
    if (name === 'chooseType') { state.editingBookingId = null; state.fromVehicleDetails = false; renderChooseType(); }
    if (name === 'selectDateTime') renderDateTimeView();
    if (name === 'selectDates') renderDatesView();
    if (name === 'searchResults') renderSearchResults();
    if (name === 'vehicleDetails') renderVehicleDetails();
    if (name === 'bookingSummary') renderBookingSummary();
    if (name === 'myBookings') renderMyBookings();
    if (name === 'allVehicles') renderAllVehicles();
}

// Which sidebar item should read as "active" for each view. Every booking-flow
// step highlights Vehicles, since that's the section it belongs to; My Bookings
// and the browse pages simply highlight themselves.
const NAV_HIGHLIGHT = {
    home: 'home',
    allVehicles: 'allVehicles',
    about: 'about',
    contact: 'contact',
    myBookings: 'myBookings',
    chooseType: 'allVehicles',
    selectDateTime: 'allVehicles',
    selectDates: 'allVehicles',
    searchResults: 'allVehicles',
    vehicleDetails: 'allVehicles',
    bookingSummary: 'allVehicles',
    checkout: 'allVehicles',
    confirmation: 'allVehicles'
};

const FLOW_TITLES = {
    chooseType: 'Book Your Ride',
    selectDateTime: 'Select Date & Time',
    selectDates: 'Select Dates',
    searchResults: 'Available Vehicles',
    vehicleDetails: 'Vehicle Details',
    bookingSummary: 'Booking Summary',
    checkout: 'Checkout',
    confirmation: 'Booking Confirmed',
    myBookings: 'My Bookings'
};

function goBack() {
    if (historyStack.length > 1) historyStack.pop();
    const prev = historyStack[historyStack.length - 1] || 'home';
    showView(prev, { fromBack: true });
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
function addDays(dateStr, n){ const d = parseDateStr(dateStr); d.setDate(d.getDate() + n); return toDateStr(d); }
function formatShortDate(s){
    if(!s) return '--';
    return parseDateStr(s).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}
function generateBookingId(){
    const digits = () => Math.floor(100000 + Math.random()*900000);
    return `ER-${digits()}`;
}

/* =====================================================
   MEET THE FAMILY (HOME) — single-vehicle spotlight
===================================================== */
function renderFamilySpotlight(){
    const v = VEHICLES[0];

    document.getElementById('spotlightMedia').innerHTML = `${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i><span class="spotlight-nickname-tag">${v.nickname}</span>`;
    document.getElementById('spotlightNickname').textContent = v.nickname;
    document.getElementById('spotlightModel').textContent = `${v.name} ${v.year}`;
    document.getElementById('spotlightRatingText').textContent = `${v.rating} · ${v.reviewLabel}`;
    document.getElementById('spotlightSpecs').innerHTML = `
        <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
        <span><i class="fa-solid fa-gears"></i> ${v.transmission}</span>
        <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
        <span><i class="fa-solid fa-suitcase"></i> ${v.bags} Bags</span>
    `;
    document.getElementById('spotlightPrice').innerHTML = `${formatCurrency(v.price12)} <small>/12 hrs</small>`;

    document.getElementById('spotlightViewBtn').addEventListener('click', () => {
        state.vehicle = v;
        showView('vehicleDetails');
    });
}

/* =====================================================
   UPCOMING TRIP (HOME) — reflects the customer's own bookings
===================================================== */
function renderUpcomingTrip(){
    const el = document.getElementById('upcomingTripContent');
    const todayStr = toDateStr(new Date());

    const upcoming = bookings
        .filter(b => (b.status === 'pending' || b.status === 'confirmed') && b.pickup >= todayStr)
        .sort((a, b) => a.pickup.localeCompare(b.pickup))[0];

    if (!upcoming) {
        el.innerHTML = `
            <div class="ut-empty">
                <i class="fa-solid fa-route"></i>
                <p>No trips booked yet. Ready to make your first memory with Luna?</p>
                <button type="button" class="btn btn-navy btn-sm" data-go="chooseType">Book Now</button>
            </div>`;
        el.querySelector('[data-go]').addEventListener('click', (e) => { e.preventDefault(); showView('chooseType'); });
        return;
    }

    const meta = STATUS_META[upcoming.status] || STATUS_META.pending;
    const dateLabel = upcoming.rentalType === 'wholeday'
        ? `${formatShortDate(upcoming.pickup)} - ${formatShortDate(upcoming.returnDate)}`
        : `${formatShortDate(upcoming.pickup)}, ${upcoming.pickupTimeSlot.start}`;

    el.innerHTML = `
        <div class="ut-media"><i class="fa-solid ${upcoming.vehicle.icon}"></i></div>
        <div class="ut-title">Trip with ${upcoming.vehicle.nickname || upcoming.vehicle.name}</div>
        <div class="ut-dates">${dateLabel} · ${upcoming.location}</div>
        <span class="status-badge ${meta.class}">${meta.label}</span>
        <div class="ut-actions">
            <button type="button" class="btn btn-outline" data-go="myBookings">Manage Booking</button>
            <button type="button" class="btn btn-navy" data-go="myBookings">View Details</button>
        </div>`;
    el.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); showView('myBookings'); }));
}

/* =====================================================
   LUNA LANDING SEARCH (home hero search card)
===================================================== */
let lunaRentalType = '12hour';
const lunaDate = document.getElementById('lunaDate');
lunaDate.min = toDateStr(new Date());
lunaDate.value = toDateStr(new Date());
document.querySelectorAll('[data-luna-type]').forEach(btn => btn.addEventListener('click', () => {
    lunaRentalType = btn.getAttribute('data-luna-type');
    document.querySelectorAll('[data-luna-type]').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelector('.luna-time-field').style.display = lunaRentalType === 'wholeday' ? 'none' : 'grid';
}));
document.getElementById('lunaSearchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.location = document.getElementById('lunaLocation').value;
    state.rentalType = lunaRentalType;
    state.editingBookingId = null;
    state.fromVehicleDetails = false;
    if (lunaRentalType === 'wholeday') {
        state.rangeStart = lunaDate.value;
        state.rangeEnd = addDays(lunaDate.value, 1);
        showView('selectDates');
    } else {
        state.date = lunaDate.value;
        state.timeSlot = TIME_SLOTS[Number(document.getElementById('lunaTime').value)];
        showView('selectDateTime');
    }
});
document.getElementById('lunaVehicleDetails').addEventListener('click', () => { state.vehicle = VEHICLES[0]; showView('vehicleDetails'); });

/* =====================================================
   CHOOSE RENTAL TYPE
===================================================== */
const ctLocationSelect = document.getElementById('ctLocation');

function renderChooseType(){
    document.querySelectorAll('.rental-type-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-type') === state.rentalType);
    });
    document.getElementById('confirmTypeBtn').disabled = !state.rentalType;
    ctLocationSelect.value = state.location;
    updateInfoBox();
}

ctLocationSelect.addEventListener('change', () => {
    state.location = ctLocationSelect.value;
});

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
        document.getElementById('confirmTypeBtn').disabled = false;
    });
});

document.getElementById('confirmTypeBtn').addEventListener('click', () => {
    if (!state.rentalType) return;
    showView(state.rentalType === '12hour' ? 'selectDateTime' : 'selectDates');
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

    // Vehicle isn't chosen yet at this step, so slots show duration only —
    // showing a single flat price here would misrepresent the real price,
    // which depends on which vehicle is picked later in the flow.
    const list = document.getElementById('timeSlotList');
    list.innerHTML = TIME_SLOTS.map((slot, i) => {
        const selected = state.timeSlot && state.timeSlot.start === slot.start;
        return `
        <button type="button" class="time-slot ${selected ? 'selected' : ''}" data-idx="${i}">
            <span>${slot.start} - ${slot.end}</span>
            <span>${selected ? '<i class="fa-solid fa-circle-check"></i> Selected' : '12 hrs'}</span>
        </button>`;
    }).join('');

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
    if (!(state.date && state.timeSlot)) return;
    if (state.editingBookingId) { showView('bookingSummary'); return; }
    if (state.fromVehicleDetails) { state.fromVehicleDetails = false; showView('bookingSummary'); return; }
    showView('searchResults');
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
            // Whole Day Rental requires at least 1 full night, so a return
            // date must land strictly after the pickup date — selecting the
            // same day (or an earlier day) always restarts the range instead
            // of silently creating a free, 0-day booking.
            if (!state.rangeStart || state.rangeEnd || dateStr <= state.rangeStart) {
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
    if (!(state.rangeStart && state.rangeEnd)) return;
    if (state.editingBookingId) { showView('bookingSummary'); return; }
    if (state.fromVehicleDetails) { state.fromVehicleDetails = false; showView('bookingSummary'); return; }
    showView('searchResults');
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
            <div class="result-card-media">${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i></div>
            <div class="result-card-body">
                <h3>${v.nickname ? `${v.nickname} — ${v.name}` : v.name}</h3>
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
    state.fromVehicleDetails = false;
    showView(state.rentalType === 'wholeday' ? 'selectDates' : 'selectDateTime');
});

/* =====================================================
   VEHICLE DETAILS
===================================================== */
function renderVehicleDetails(){
    const v = state.vehicle || VEHICLES[0];
    state.vehicle = v;

    document.getElementById('vdPhotoMain').innerHTML = `${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i>`;
    document.getElementById('vdName').textContent = v.nickname ? `${v.nickname} — ${v.name}` : v.name;
    document.getElementById('vdType').textContent = `${v.type} · ${v.transmission} · ${v.fuel}`;
    document.getElementById('vdRatingText').textContent = `${v.rating} · ${v.reviewLabel}`;

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

    document.getElementById('vdPrice12').textContent = formatCurrency(v.price12);
    document.getElementById('vdPriceDay').textContent = formatCurrency(v.priceDay);
}

document.getElementById('bookNowBtn').addEventListener('click', () => {
    state.editingBookingId = null;
    state.fromVehicleDetails = false;
    state.rentalType = null;
    state.date = null;
    state.timeSlot = null;
    state.rangeStart = null;
    state.rangeEnd = null;
    showView('chooseType');
});

/* =====================================================
   BOOKING SUMMARY
===================================================== */
function renderBookingSummary(){
    const v = state.vehicle;
    const isWholeDay = state.rentalType === 'wholeday';
    const price = getVehiclePrice(v);

    document.getElementById('bsVehicleIcon').innerHTML = `<i class="fa-solid ${v.icon}"></i>`;
    document.getElementById('bsVehicleName').textContent = v.nickname ? `${v.nickname} — ${v.name}` : v.name;
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

    const continueBtn = document.getElementById('continueCheckoutBtn');
    continueBtn.textContent = state.editingBookingId ? 'Save Changes' : 'Continue to Checkout';
}

document.getElementById('continueCheckoutBtn').addEventListener('click', () => {
    if (state.editingBookingId) {
        saveBookingEdits();
    } else {
        showView('checkout');
    }
});

function saveBookingEdits(){
    const booking = bookings.find(b => b.id === state.editingBookingId);
    if (!booking) { showView('myBookings'); return; }

    const isWholeDay = state.rentalType === 'wholeday';
    booking.vehicle = { id: state.vehicle.id, code: state.vehicle.code, nickname: state.vehicle.nickname, name: state.vehicle.name, type: state.vehicle.type, transmission: state.vehicle.transmission, icon: state.vehicle.icon };
    booking.rentalType = state.rentalType;
    booking.location = state.location;
    booking.pickup = isWholeDay ? state.rangeStart : state.date;
    booking.pickupTimeSlot = isWholeDay ? null : state.timeSlot;
    booking.returnDate = isWholeDay ? state.rangeEnd : state.date;
    booking.total = getVehiclePrice(state.vehicle);

    localStorage.setItem('everyride_bookings', JSON.stringify(bookings));
    state.editingBookingId = null;
    updateBookingsBadge();
    showView('myBookings');
}

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
        vehicle: { id:v.id, code:v.code, nickname:v.nickname, name:v.name, type:v.type, transmission:v.transmission, icon:v.icon },
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

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    document.getElementById('bookingProcessingOverlay').style.display = 'flex';
    setTimeout(() => {
        bookings.push(booking);
        localStorage.setItem('everyride_bookings', JSON.stringify(bookings));
        updateBookingsBadge();
        document.getElementById('bookingProcessingOverlay').style.display = 'none';
        submitBtn.disabled = false;
        renderConfirmation(booking);
        showView('confirmation');
    }, 1500);
});

/* =====================================================
   CONFIRMATION / RECEIPT
===================================================== */
const PAYMENT_LABELS = {
    cash: 'Cash on Pick-up',
    bank: 'Bank Transfer',
    card: 'Credit / Debit Card'
};

function renderConfirmation(booking){
    document.getElementById('cfBookingId').textContent = booking.id;
    document.getElementById('cfVehicle').textContent = booking.vehicle.nickname ? `${booking.vehicle.nickname} — ${booking.vehicle.name}` : booking.vehicle.name;
    document.getElementById('cfRentalType').textContent = booking.rentalType === 'wholeday' ? 'Whole Day Rental' : '12-Hour Rental';
    document.getElementById('cfPickup').textContent = booking.rentalType === 'wholeday'
        ? formatShortDate(booking.pickup)
        : `${formatShortDate(booking.pickup)}, ${booking.pickupTimeSlot.start}`;
    document.getElementById('cfReturn').textContent = booking.rentalType === 'wholeday'
        ? formatShortDate(booking.returnDate)
        : `${formatShortDate(booking.pickup)}, ${booking.pickupTimeSlot.end}`;
    document.getElementById('cfLocation').textContent = booking.location;
    document.getElementById('cfName').textContent = booking.contact.name;
    document.getElementById('cfPayment').textContent = PAYMENT_LABELS[booking.payMethod] || booking.payMethod;
    document.getElementById('cfTotal').textContent = formatCurrency(booking.total);
}

document.getElementById('goToBookingsBtn').addEventListener('click', () => showView('myBookings'));

/* =====================================================
   MY BOOKINGS
===================================================== */
// Status flow: pending -> confirmed -> completed, with cancelled as an
// alternate end state. Only staff/admin (outside this customer-facing app)
// move a booking from pending onward or cancel it once confirmed — the
// customer can only view, edit, or cancel while it's still pending.
const STATUS_META = {
    pending:   { label:'Pending',   class:'status-pending' },
    confirmed: { label:'Confirmed', class:'status-confirmed' },
    completed: { label:'Completed', class:'status-completed' },
    cancelled: { label:'Cancelled', class:'status-cancelled' }
};

function bookingProgressMarkup(status, compact = false){
    const stages = [
        { label:'Request sent', icon:'fa-check' },
        { label:'Under review', icon:'fa-clipboard-check' },
        { label:'Confirmed', icon:'fa-calendar-check' },
        { label:'Ready to drive', icon:'fa-car-side' }
    ];
    const activeIndex = status === 'confirmed' ? 2 : status === 'completed' ? 3 : 1;
    if (status === 'cancelled') return `<div class="booking-card-status is-cancelled"><i class="fa-solid fa-circle-xmark"></i> This booking request was cancelled.</div>`;
    return `<div class="booking-progress ${compact ? 'booking-progress-compact' : ''}" aria-label="Booking status: ${stages[activeIndex].label}">${stages.map((stage, i) => `
        <div class="progress-stage ${i < activeIndex ? 'done' : i === activeIndex ? 'current' : ''}"><span>${i < activeIndex ? `<i class="fa-solid ${stage.icon}"></i>` : i + 1}</span><small>${stage.label}</small></div>${i < stages.length - 1 ? `<div class="progress-link ${i < activeIndex ? 'done' : ''}"></div>` : ''}`).join('')}</div>`;
}

let bookingsFilter = 'all';
let activeBookingId = null;

function updateBookingsBadge(){
    const count = bookings.length;
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = count;
        badge.classList.toggle('is-empty', count === 0);
    });
}

document.querySelectorAll('.booking-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        bookingsFilter = tab.getAttribute('data-filter');
        document.querySelectorAll('.booking-tab').forEach(t => t.classList.toggle('active', t === tab));
        renderMyBookings();
    });
});

function renderMyBookings(){
    document.querySelectorAll('.booking-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-filter') === bookingsFilter));

    const listEl = document.getElementById('myBookingsList');
    const emptyEl = document.getElementById('myBookingsEmpty');

    const filtered = bookingsFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingsFilter);

    if (!filtered.length) {
        listEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.querySelector('h3').textContent = bookingsFilter === 'all' ? 'No bookings yet' : `No ${STATUS_META[bookingsFilter].label.toLowerCase()} bookings`;
        emptyEl.querySelector('p').textContent = bookingsFilter === 'all' ? 'Reserve a car to see your booking request here.' : 'Bookings will show up here once they reach this status.';
        return;
    }

    listEl.style.display = 'flex';
    emptyEl.style.display = 'none';

    listEl.innerHTML = filtered.slice().reverse().map(b => {
        const meta = STATUS_META[b.status] || STATUS_META.pending;
        const isWholeDay = b.rentalType === 'wholeday';
        const dateLabel = isWholeDay
            ? `${formatShortDate(b.pickup)} - ${formatShortDate(b.returnDate)}`
            : `${formatShortDate(b.pickup)}, ${b.pickupTimeSlot.start} - ${b.pickupTimeSlot.end}`;

        return `
        <div class="booking-item-card">
            <div class="bi-top-row">
                <div class="bi-icon"><i class="fa-solid ${b.vehicle.icon}"></i></div>
                <div class="bi-body">
                    <strong>${b.vehicle.nickname ? `${b.vehicle.nickname} · ` : ''}${b.vehicle.name}</strong>
                    <span>${b.id} · ${dateLabel}</span>
                </div>
                <div class="bi-status"><span class="status-badge ${meta.class}">${meta.label}</span></div>
            </div>
            ${bookingProgressMarkup(b.status, true)}
            <div class="bi-actions"><button type="button" class="bi-action-btn" data-details="${b.id}">View Details <i class="fa-solid fa-arrow-right"></i></button></div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('[data-details]').forEach(btn => {
        btn.addEventListener('click', () => openBookingDetails(btn.getAttribute('data-details')));
    });
}

function bookingDateLabel(booking){
    return booking.rentalType === 'wholeday'
        ? `${formatShortDate(booking.pickup)} - ${formatShortDate(booking.returnDate)}`
        : `${formatShortDate(booking.pickup)}, ${booking.pickupTimeSlot.start} - ${booking.pickupTimeSlot.end}`;
}

function openBookingDetails(id){
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const meta = STATUS_META[booking.status] || STATUS_META.pending;
    const content = document.getElementById('bookingDetailsContent');
    const canManage = booking.status === 'pending';
    content.innerHTML = `
        <div class="booking-details-heading"><span class="eyebrow">BOOKING DETAILS</span><h2 id="bookingDetailsTitle">${booking.vehicle.nickname ? `${booking.vehicle.nickname} · ` : ''}${booking.vehicle.name}</h2><p>Booking reference: ${booking.id}</p><div class="booking-detail-status"><span class="status-badge ${meta.class}">${meta.label}</span></div></div>
        <div class="booking-detail-grid">
            <div class="booking-detail-cell"><small>Rental type</small><strong>${booking.rentalType === 'wholeday' ? 'Whole Day Rental' : '12-Hour Rental'}</strong></div>
            <div class="booking-detail-cell"><small>Pick-up location</small><strong>${booking.location}</strong></div>
            <div class="booking-detail-cell"><small>Schedule</small><strong>${bookingDateLabel(booking)}</strong></div>
            <div class="booking-detail-cell"><small>Vehicle</small><strong>${booking.vehicle.transmission} · ${booking.vehicle.type}</strong></div>
            <div class="booking-detail-cell"><small>Booked by</small><strong>${booking.contact ? booking.contact.name : '--'}</strong></div>
            <div class="booking-detail-cell"><small>Payment method</small><strong>${PAYMENT_LABELS[booking.payMethod] || booking.payMethod || '--'}</strong></div>
        </div>
        ${bookingProgressMarkup(booking.status)}
        <div class="booking-details-total"><span>Total rental price</span><strong>₱${Number(booking.total || 0).toLocaleString()}</strong></div>
        ${canManage ? `<div class="booking-detail-actions"><button type="button" class="btn btn-outline" data-detail-edit="${booking.id}">Edit Booking</button><button type="button" class="btn cancel-confirm-btn" data-detail-cancel="${booking.id}">Cancel Booking</button></div>` : ''}`;
    document.getElementById('bookingDetailsOverlay').style.display = 'flex';
    content.querySelector('[data-detail-edit]')?.addEventListener('click', () => { closeBookingDetails(); editBooking(booking.id); });
    content.querySelector('[data-detail-cancel]')?.addEventListener('click', () => { closeBookingDetails(); openCancelBooking(booking.id); });
}

function closeBookingDetails(){ document.getElementById('bookingDetailsOverlay').style.display = 'none'; }
function openCancelBooking(id){
    activeBookingId = id;
    document.getElementById('cancelBookingForm').reset();
    document.getElementById('cancelBookingOverlay').style.display = 'flex';
}
function closeCancelBooking(){ activeBookingId = null; document.getElementById('cancelBookingOverlay').style.display = 'none'; }

function editBooking(id){
    const booking = bookings.find(b => b.id === id);
    if (!booking || booking.status !== 'pending') return;

    state.rentalType = booking.rentalType;
    state.location = booking.location;
    state.vehicle = VEHICLES.find(v => v.id === booking.vehicle.id) || state.vehicle;
    if (booking.rentalType === 'wholeday') {
        state.rangeStart = booking.pickup;
        state.rangeEnd = booking.returnDate;
    } else {
        state.date = booking.pickup;
        state.timeSlot = booking.pickupTimeSlot;
    }
    state.editingBookingId = booking.id;

    showView(booking.rentalType === 'wholeday' ? 'selectDates' : 'selectDateTime');
}

function cancelBooking(id, reason = '', feedback = ''){
    const booking = bookings.find(b => b.id === id);
    if (!booking || booking.status !== 'pending') return;
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancellationFeedback = feedback;
    booking.cancelledAt = new Date().toISOString();
    localStorage.setItem('everyride_bookings', JSON.stringify(bookings));
    renderMyBookings();
}

/* =====================================================
   ALL VEHICLES (with filters)
===================================================== */
const filterState = { type:[], transmission:[], fuel:[], seats:[], maxPrice:4000 };

function readFiltersFromDOM(){
    filterState.type = [...document.querySelectorAll('.f-type:checked')].map(el => el.value);
    filterState.transmission = [...document.querySelectorAll('.f-transmission:checked')].map(el => el.value);
    filterState.fuel = [...document.querySelectorAll('.f-fuel:checked')].map(el => el.value);
    filterState.seats = [...document.querySelectorAll('.f-seats:checked')].map(el => Number(el.value));
    filterState.maxPrice = Number(document.getElementById('priceRangeInput').value);
}

function applyFilters(vehicles){
    return vehicles.filter(v => {
        if (filterState.type.length && !filterState.type.includes(v.type)) return false;
        if (filterState.transmission.length && !filterState.transmission.includes(v.transmission)) return false;
        if (filterState.fuel.length && !filterState.fuel.includes(v.fuel)) return false;
        if (filterState.seats.length && !filterState.seats.includes(v.seats)) return false;
        if (v.price12 > filterState.maxPrice) return false;
        return true;
    });
}

function renderAllVehicles(){
    readFiltersFromDOM();
    document.getElementById('priceRangeValue').textContent = formatCurrency(filterState.maxPrice);

    const sort = document.getElementById('allVehiclesSortSelect').value;
    let vehicles = applyFilters(VEHICLES);
    vehicles.sort((a,b) => sort === 'low' ? a.price12 - b.price12 : b.price12 - a.price12);

    document.getElementById('allVehiclesCountLabel').textContent = `${vehicles.length} Vehicle${vehicles.length !== 1 ? 's' : ''}`;

    const listEl = document.getElementById('allVehiclesList');
    const emptyEl = document.getElementById('filtersEmptyState');

    if (!vehicles.length) {
        listEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
    }
    listEl.style.display = 'flex';
    emptyEl.style.display = 'none';

    listEl.innerHTML = vehicles.map(v => `
        <div class="result-card">
            <div class="result-card-media">${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i></div>
            <div class="result-card-body">
                <h3>${v.nickname ? `${v.nickname} — ${v.name}` : v.name}</h3>
                <p class="rc-type">${v.type} · ${v.transmission}</p>
                <div class="rc-specs">
                    <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
                    <span><i class="fa-solid fa-gears"></i> ${v.transmission}</span>
                </div>
            </div>
            <div class="result-card-action">
                <div class="rc-price">${formatCurrency(v.price12)}<small>per 12 hrs</small></div>
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

document.querySelectorAll('.f-type, .f-transmission, .f-fuel, .f-seats').forEach(el => {
    el.addEventListener('change', renderAllVehicles);
});
document.getElementById('priceRangeInput').addEventListener('input', renderAllVehicles);
document.getElementById('allVehiclesSortSelect').addEventListener('change', renderAllVehicles);
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.querySelectorAll('.f-type, .f-transmission, .f-fuel, .f-seats').forEach(el => el.checked = false);
    document.getElementById('priceRangeInput').value = 4000;
    renderAllVehicles();
});

/* =====================================================
   CONTACT FORM
===================================================== */
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }

    document.getElementById('contactSuccessMsg').style.display = 'flex';
    form.reset();
    setTimeout(() => {
        document.getElementById('contactSuccessMsg').style.display = 'none';
    }, 5000);
});

/* =====================================================
   AUTH — LOGIN / SIGNUP MODALS
   A single sidebar login control (shared by the desktop
   sidebar and the mobile drawer, since it's the same DOM
   node) opens these modals from anywhere in the app.
===================================================== */
let currentUser = JSON.parse(localStorage.getItem('everyride_user') || 'null');

function openModal(id){ document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeModal(id){ document.getElementById(id).style.display = 'none'; document.body.style.overflow = ''; }

document.getElementById('sidebarLoginBtn').addEventListener('click', () => openModal('loginModalOverlay'));
document.getElementById('loginModalClose').addEventListener('click', () => closeModal('loginModalOverlay'));
document.getElementById('signupModalClose').addEventListener('click', () => closeModal('signupModalOverlay'));

document.getElementById('switchToSignup').addEventListener('click', (e) => {
    e.preventDefault();
    closeModal('loginModalOverlay');
    openModal('signupModalOverlay');
});
document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    closeModal('signupModalOverlay');
    openModal('loginModalOverlay');
});

// Close modal when clicking the dark overlay itself (not the card)
['loginModalOverlay','signupModalOverlay'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
        if (e.target.id === id) closeModal(id);
    });
});

function setLoggedInUser(user){
    currentUser = user;
    localStorage.setItem('everyride_user', JSON.stringify(user));
    updateAuthUI();
    closeModal('loginModalOverlay');
    closeModal('signupModalOverlay');
}

function updateAuthUI(){
    const loginBtn = document.getElementById('sidebarLoginBtn');
    const chip = document.getElementById('sidebarUserChip');
    if (currentUser) {
        loginBtn.style.display = 'none';
        chip.style.display = 'flex';
        document.getElementById('sidebarUserChipName').textContent = currentUser.name.split(' ')[0];
        document.getElementById('sidebarUserChipAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    } else {
        loginBtn.style.display = 'flex';
        chip.style.display = 'none';
    }
}

document.getElementById('sidebarUserChipLogout').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('everyride_user');
    updateAuthUI();
});

// Mock social sign-in (no backend available — simulates the round trip)
function mockSocialAuth(btn, provider){
    btn.classList.add('loading');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting to ${provider}...`;
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.innerHTML = originalHTML;
        setLoggedInUser({ name: provider === 'Google' ? 'Juan Dela Cruz' : 'Juan D. Cruz', email: provider === 'Google' ? 'juandelacruz@gmail.com' : 'juandelacruz@facebook.com', provider });
    }, 900);
}

document.getElementById('googleLoginBtn').addEventListener('click', (e) => mockSocialAuth(e.currentTarget, 'Google'));
document.getElementById('facebookLoginBtn').addEventListener('click', (e) => mockSocialAuth(e.currentTarget, 'Facebook'));
document.getElementById('googleSignupBtn').addEventListener('click', (e) => mockSocialAuth(e.currentTarget, 'Google'));
document.getElementById('facebookSignupBtn').addEventListener('click', (e) => mockSocialAuth(e.currentTarget, 'Facebook'));

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const email = document.getElementById('loginEmail').value.trim();
    setLoggedInUser({ name: email.split('@')[0].replace(/[._]/g,' '), email, provider: 'email' });
});

document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    setLoggedInUser({ name, email, provider: 'email' });
});

updateAuthUI();

/* =====================================================
   APP SHELL — sidebar / mobile drawer toggle
   One sidebar element serves both roles: a fixed column on
   desktop, a slide-in drawer (with backdrop) on mobile, so
   every view shares identical navigation and there's nothing
   to keep in sync between breakpoints.
===================================================== */
const appSidebar = document.getElementById('appSidebar');
const drawerBackdrop = document.getElementById('drawerBackdrop');

function openDrawer(){
    appSidebar.classList.add('open');
    drawerBackdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeDrawer(){
    appSidebar.classList.remove('open');
    drawerBackdrop.classList.remove('show');
    document.body.style.overflow = '';
}
document.getElementById('drawerToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    appSidebar.classList.contains('open') ? closeDrawer() : openDrawer();
});
drawerBackdrop.addEventListener('click', closeDrawer);

/* =====================================================
   TESTIMONIAL CAROUSEL (HOME)
===================================================== */
const TESTIMONIALS = [
    { text:"Great service, smooth booking, and the car was in excellent condition. Our family trip was truly memorable!", name:'Maria Santos', stars:5 },
    { text:"Luna was spotless and the WiFi on board made our Tagaytay drive so much easier with the kids entertained.", name:'Ramon Cruz', stars:5 },
    { text:"Booking took less than five minutes and the team followed up right away. Honest pricing, no surprises.", name:'Angela Reyes', stars:5 }
];
let testimonialIdx = 0;

function renderTestimonial(){
    const t = TESTIMONIALS[testimonialIdx];
    document.getElementById('testimonialText').textContent = t.text;
    document.getElementById('testimonialName').textContent = t.name;
    document.getElementById('testimonialAvatar').textContent = t.name.charAt(0);

    const dotsEl = document.getElementById('testimonialDots');
    dotsEl.innerHTML = TESTIMONIALS.map((_, i) => `<button type="button" class="testimonial-dot ${i === testimonialIdx ? 'active' : ''}" data-idx="${i}" aria-label="Testimonial ${i+1}"></button>`).join('');
    dotsEl.querySelectorAll('.testimonial-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            testimonialIdx = Number(dot.getAttribute('data-idx'));
            renderTestimonial();
        });
    });
}

/* =====================================================
   NEWSLETTER SIGNUP (HOME) — visual only, no backend available
===================================================== */
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    document.getElementById('newsletterSuccess').style.display = 'flex';
    form.reset();
    setTimeout(() => { document.getElementById('newsletterSuccess').style.display = 'none'; }, 5000);
});

/* =====================================================
   BOOKING DETAILS / CANCELLATION MODALS
===================================================== */
document.querySelectorAll('[data-close-booking-details]').forEach(btn => btn.addEventListener('click', closeBookingDetails));
document.querySelectorAll('[data-close-cancel]').forEach(btn => btn.addEventListener('click', closeCancelBooking));
document.getElementById('bookingDetailsOverlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeBookingDetails(); });
document.getElementById('cancelBookingOverlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeCancelBooking(); });
document.getElementById('cancelBookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeBookingId) return;
    const selected = document.querySelector('input[name="cancelReason"]:checked');
    const feedback = document.getElementById('cancelFeedback').value.trim();
    cancelBooking(activeBookingId, selected ? selected.value : '', feedback);
    closeCancelBooking();
});

/* =====================================================
   INIT
===================================================== */
updateBookingsBadge();
renderTestimonial();
showView('home');
