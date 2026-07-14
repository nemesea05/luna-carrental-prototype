/* =====================================================
   DATA
===================================================== */
/* EveryRide currently features one trusted member of the family: the
   Mitsubishi Xpander GLS 2026, nicknamed "Luna". Vehicle photo lives at
   assets/vehicles/MX.jpg — drop a file there and it appears automatically;
   until then the layout falls back to the icon placeholder below. */
/* status: 'Available' | 'Unavailable' | 'Booked' — drives the status badge shown
   on every vehicle card and whether the vehicle can be selected for booking. */
const VEHICLES = [
    { id:'xpander', code:'MX', name:'Mitsubishi Xpander GLS 2026', nickname:'Luna', type:'MPV', transmission:'Automatic', fuel:'Petrol', seats:7, bags:4, doors:5, icon:'fa-van-shuttle', image:'assets/vehicles/MX.jpg', price12:3000, priceDay:6000, status:'Available',
      features:['Bluetooth Audio','Backup Camera','Third-Row Seating','USB Charging Ports','Keyless Entry','Cruise Control','Push-Start Ignition'] }
];

// Returns an <img> tag that quietly falls back to the gradient + icon placeholder
// (already present as a sibling in the same media container) if the asset is missing.
function vehiclePhotoTag(v){
    return `<img src="${v.image}" alt="${v.name}" class="vehicle-photo" onerror="this.style.display='none'">`;
}

const VEHICLE_STATUS_META = {
    Available:   { label:'Available',   className:'status-available' },
    Unavailable: { label:'Unavailable', className:'status-unavailable' },
    Booked:      { label:'Booked',      className:'status-booked' }
};

// Small badge shown on every vehicle card / photo — tells a user at a glance
// whether a car can be booked right now. Kept compact so it never overwhelms
// the photo it sits on.
function statusBadge(v, size){
    const meta = VEHICLE_STATUS_META[v.status] || VEHICLE_STATUS_META.Unavailable;
    const sizeClass = size === 'lg' ? ' vehicle-status-badge-lg' : '';
    return `<span class="vehicle-status-badge ${meta.className}${sizeClass}"><i class="fa-solid fa-circle"></i> ${meta.label}</span>`;
}

function isBookable(v){ return v.status === 'Available'; }

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
    editingBookingId: null   // set when editing an existing pending booking
};

let bookings = JSON.parse(localStorage.getItem('everyride_bookings') || '[]');

/* =====================================================
   VIEW ROUTING
===================================================== */
const VIEW_IDS = ['home','chooseType','selectDateTime','selectDates','searchResults','vehicleDetails','bookingSummary','checkout','confirmation','myBookings','allVehicles','about','contact'];

// Real back-stack: forward navigation pushes, goBack pops and re-renders
// the previous entry without pushing it again (no double-pop tricks).
let historyStack = ['home'];

function showView(name, opts = {}) {
    if (!opts.fromBack && historyStack[historyStack.length - 1] !== name) {
        historyStack.push(name);
    }

    VIEW_IDS.forEach(id => {
        const el = document.getElementById(`view-${id}`);
        if (el) el.style.display = (id === name) ? 'block' : 'none';
    });

    const primaryPages = ['home','allVehicles','about','contact'];
    const usesMainHeader = primaryPages.includes(name);
    document.getElementById('mainHeader').style.display = usesMainHeader ? 'block' : 'none';
    document.getElementById('flowHeader').style.display = usesMainHeader ? 'none' : 'block';
    document.getElementById('siteFooter').style.display = usesMainHeader ? 'block' : 'none';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-go') === name);
    });

    closeMobileNav();
    window.scrollTo({ top:0, behavior:'instant' });

    if (name === 'chooseType') { state.editingBookingId = null; renderChooseType(); }
    if (name === 'selectDateTime') renderDateTimeView();
    if (name === 'selectDates') renderDatesView();
    if (name === 'searchResults') renderSearchResults();
    if (name === 'vehicleDetails') renderVehicleDetails();
    if (name === 'bookingSummary') renderBookingSummary();
    if (name === 'myBookings') renderMyBookings();
    if (name === 'allVehicles') renderAllVehicles();
}

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
   HOME — HERO CAROUSEL
   Slides read their image from inline background-image (assets/hero/slide-N.jpg).
   If that file isn't there yet, this swaps in the data-fallback URL so the
   layout still looks right while real photos are being added.
===================================================== */
(function initHeroCarousel(){
    const track = document.getElementById('heroSlides');
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.hero-slide'));
    const dotsWrap = document.getElementById('heroDots');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    let current = 0;
    let timer = null;

    // Verify each slide's real asset loads; if not, use the fallback stock photo.
    slides.forEach(slide => {
        const url = slide.style.backgroundImage.slice(5, -2); // unwrap url("...")
        const fallback = slide.getAttribute('data-fallback');
        const img = new Image();
        img.onerror = () => { if (fallback) slide.style.backgroundImage = `url('${fallback}')`; };
        img.src = url;
    });

    dotsWrap.innerHTML = slides.map((_, i) => `<button type="button" class="hero-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Go to slide ${i+1}"></button>`).join('');
    const dots = Array.from(dotsWrap.querySelectorAll('.hero-dot'));

    function goTo(index){
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function restartAutoplay(){
        clearInterval(timer);
        timer = setInterval(() => goTo(current + 1), 5500);
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); restartAutoplay(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); restartAutoplay(); });
    dots.forEach(dot => dot.addEventListener('click', () => { goTo(Number(dot.getAttribute('data-slide'))); restartAutoplay(); }));

    const carouselEl = document.getElementById('heroCarousel');
    carouselEl.addEventListener('mouseenter', () => clearInterval(timer));
    carouselEl.addEventListener('mouseleave', restartAutoplay);

    restartAutoplay();
})();

/* =====================================================
   MEET THE FAMILY (HOME) — spotlight on Luna, our one featured vehicle.
===================================================== */
function renderPopularVehicles(){
    const grid = document.getElementById('popularVehicleGrid');
    const v = VEHICLES[0];
    grid.innerHTML = `
        <div class="spotlight-card ${isBookable(v) ? '' : 'is-dimmed'}">
            <div class="spotlight-media">
                ${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i>
                ${statusBadge(v, 'lg')}
                ${v.nickname ? `<span class="spotlight-nickname-tag"><i class="fa-solid fa-heart"></i> Meet ${v.nickname}!</span>` : ''}
            </div>
            <div class="spotlight-body">
                ${v.nickname ? `<span class="spotlight-nickname">${v.nickname}</span>` : ''}
                <h3>${v.name}</h3>
                <p class="vc-type">${v.type} · ${v.transmission} · ${v.fuel}</p>
                <div class="vc-specs">
                    <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
                    <span><i class="fa-solid fa-suitcase"></i> ${v.bags} Bags</span>
                    <span><i class="fa-solid fa-door-closed"></i> ${v.doors} Doors</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
                </div>
                <p class="spotlight-blurb">Roomy, reliable, and always ready for the next adventure with your family or barkada — Luna is the newest (and friendliest) member of the EveryRide family.</p>
                <div class="vc-prices">
                    <div class="vc-price-item">
                        <span>12-Hour</span>
                        <strong>${formatCurrency(v.price12)}</strong>
                    </div>
                    <div class="vc-price-item">
                        <span>Whole Day</span>
                        <strong>${formatCurrency(v.priceDay)}</strong>
                    </div>
                </div>
                <button type="button" class="vc-view-btn" data-vehicle="${v.id}">Meet ${v.nickname || v.name} <i class="fa-solid fa-arrow-right"></i></button>
            </div>
        </div>
    `;

    grid.querySelectorAll('.vc-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.vehicle = VEHICLES.find(v => v.id === btn.getAttribute('data-vehicle'));
            if (!state.rentalType) state.rentalType = '12hour';
            showView('vehicleDetails');
        });
    });
}
renderPopularVehicles();

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
    if (state.date && state.timeSlot) showView(state.editingBookingId ? 'bookingSummary' : 'searchResults');
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
    if (state.rangeStart && state.rangeEnd) showView(state.editingBookingId ? 'bookingSummary' : 'searchResults');
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
        <div class="result-card ${isBookable(v) ? '' : 'is-dimmed'}">
            <div class="result-card-media">${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i>${statusBadge(v)}</div>
            <div class="result-card-body">
                <h3>${v.name}</h3>
                <p class="rc-type">${v.type} · ${v.transmission} · ${v.fuel}</p>
                <div class="rc-specs">
                    <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
                    <span><i class="fa-solid fa-suitcase"></i> ${v.bags} Bags</span>
                    <span><i class="fa-solid fa-door-closed"></i> ${v.doors} Doors</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
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

    document.getElementById('vdPhotoMain').innerHTML = `${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i>${statusBadge(v, 'lg')}`;
    document.getElementById('vdName').textContent = v.nickname ? `${v.nickname} — ${v.name}` : v.name;
    document.getElementById('vdType').textContent = `${v.type} · ${v.transmission} · ${v.fuel}`;

    const featureChips = (v.features || []).map(f => `<span><i class="fa-solid fa-circle-check"></i> ${f}</span>`).join('');

    document.getElementById('vdSpecs').innerHTML = `
        <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
        <span><i class="fa-solid fa-gears"></i> ${v.transmission}</span>
        <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
        <span><i class="fa-solid fa-suitcase"></i> ${v.bags} Bags</span>
        <span><i class="fa-solid fa-door-closed"></i> ${v.doors} Doors</span>
        <span><i class="fa-solid fa-snowflake"></i> Air Conditioning</span>
        ${featureChips}
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

    const selectBtn = document.getElementById('selectVehicleBtn');
    const unavailableNote = document.getElementById('vdUnavailableNote');
    if (isBookable(v)) {
        selectBtn.disabled = false;
        selectBtn.textContent = 'Select This Vehicle';
        unavailableNote.style.display = 'none';
    } else {
        selectBtn.disabled = true;
        selectBtn.textContent = 'Currently Unavailable';
        unavailableNote.style.display = 'flex';
        unavailableNote.innerHTML = `<i class="fa-solid fa-circle-info"></i> This vehicle is ${v.status.toLowerCase()} right now. Browse other vehicles or check back later.`;
    }
}

document.getElementById('selectVehicleBtn').addEventListener('click', () => {
    if (!isBookable(state.vehicle)) return;
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
    booking.vehicle = { id: state.vehicle.id, code: state.vehicle.code, name: state.vehicle.name, type: state.vehicle.type, transmission: state.vehicle.transmission, icon: state.vehicle.icon };
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
        vehicle: { id:v.id, code:v.code, name:v.name, type:v.type, transmission:v.transmission, icon:v.icon },
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
    localStorage.setItem('everyride_bookings', JSON.stringify(bookings));
    updateBookingsBadge();

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

let bookingsFilter = 'all';

function updateBookingsBadge(){
    const badge = document.getElementById('bookingsCountBadge');
    badge.textContent = bookings.length;
    badge.classList.toggle('is-empty', bookings.length === 0);
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

        // Only a pending booking can still be changed by the customer.
        const actions = b.status === 'pending' ? `
                <button type="button" class="bi-action-btn" data-edit="${b.id}">Edit</button>
                <button type="button" class="bi-action-btn cancel-btn" data-cancel="${b.id}">Cancel Booking</button>
            ` : '';

        return `
        <div class="booking-item-card">
            <div class="bi-top-row">
                <div class="bi-icon"><i class="fa-solid ${b.vehicle.icon}"></i></div>
                <div class="bi-body">
                    <strong>${b.vehicle.name}</strong>
                    <span>${b.id} · ${dateLabel}</span>
                </div>
                <div class="bi-status"><span class="status-badge ${meta.class}">${meta.label}</span></div>
            </div>
            ${actions ? `<div class="bi-actions">${actions}</div>` : ''}
        </div>`;
    }).join('');

    listEl.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => editBooking(btn.getAttribute('data-edit')));
    });
    listEl.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.addEventListener('click', () => cancelBooking(btn.getAttribute('data-cancel')));
    });
}

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

function cancelBooking(id){
    const booking = bookings.find(b => b.id === id);
    if (!booking || booking.status !== 'pending') return;
    if (!confirm(`Cancel booking ${booking.id} for ${booking.vehicle.name}? This can't be undone.`)) return;
    booking.status = 'cancelled';
    localStorage.setItem('everyride_bookings', JSON.stringify(bookings));
    renderMyBookings();
}

/* =====================================================
   ALL VEHICLES — full profile for our one featured vehicle, Luna.
   (Filters were removed: with a single vehicle in the fleet, letting
   people filter a list of one is just clutter. This will naturally grow
   back into a filterable list as more vehicles join the family.)
===================================================== */
function renderAllVehicles(){
    const v = VEHICLES[0];
    const featureChips = (v.features || []).map(f => `<span><i class="fa-solid fa-circle-check"></i> ${f}</span>`).join('');

    document.getElementById('allVehiclesList').innerHTML = `
        <div class="spotlight-card allv-card ${isBookable(v) ? '' : 'is-dimmed'}">
            <div class="spotlight-media">
                ${vehiclePhotoTag(v)}<i class="fa-solid ${v.icon}"></i>
                ${statusBadge(v, 'lg')}
                ${v.nickname ? `<span class="spotlight-nickname-tag"><i class="fa-solid fa-heart"></i> This is ${v.nickname}</span>` : ''}
            </div>
            <div class="spotlight-body">
                ${v.nickname ? `<span class="spotlight-nickname">${v.nickname}</span>` : ''}
                <h3>${v.name}</h3>
                <p class="vc-type">${v.type} · ${v.transmission} · ${v.fuel}</p>

                <div class="vc-specs allv-specs">
                    <span><i class="fa-solid fa-user"></i> ${v.seats} Seats</span>
                    <span><i class="fa-solid fa-suitcase"></i> ${v.bags} Bags</span>
                    <span><i class="fa-solid fa-door-closed"></i> ${v.doors} Doors</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${v.fuel}</span>
                    <span><i class="fa-solid fa-gears"></i> ${v.transmission}</span>
                    <span><i class="fa-solid fa-snowflake"></i> Air Conditioning</span>
                </div>

                <div class="allv-features">${featureChips}</div>

                <div class="vc-prices">
                    <div class="vc-price-item">
                        <span>12-Hour</span>
                        <strong>${formatCurrency(v.price12)}</strong>
                    </div>
                    <div class="vc-price-item">
                        <span>Whole Day</span>
                        <strong>${formatCurrency(v.priceDay)}</strong>
                    </div>
                </div>

                <button type="button" class="vc-view-btn view-details-btn" data-vehicle="${v.id}">
                    ${isBookable(v) ? `Book ${v.nickname || v.name} Now` : 'View Details'} <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;

    document.getElementById('allVehiclesList').querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.vehicle = VEHICLES.find(vv => vv.id === btn.getAttribute('data-vehicle'));
            if (!state.rentalType) state.rentalType = '12hour';
            showView('vehicleDetails');
        });
    });
}

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
===================================================== */
let currentUser = JSON.parse(localStorage.getItem('everyride_user') || 'null');

function openModal(id){ document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeModal(id){ document.getElementById(id).style.display = 'none'; document.body.style.overflow = ''; }

document.getElementById('headerLoginLink').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('loginModalOverlay');
});
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
    updateHeaderAuthUI();
    closeModal('loginModalOverlay');
    closeModal('signupModalOverlay');
}

function updateHeaderAuthUI(){
    const loginLink = document.getElementById('headerLoginLink');
    const chip = document.getElementById('headerUserChip');
    if (currentUser) {
        loginLink.style.display = 'none';
        chip.style.display = 'flex';
        document.getElementById('userChipName').textContent = currentUser.name.split(' ')[0];
        document.getElementById('userChipAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    } else {
        loginLink.style.display = 'inline';
        chip.style.display = 'none';
    }
}

document.getElementById('userChipLogout').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('everyride_user');
    updateHeaderAuthUI();
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

updateHeaderAuthUI();

/* =====================================================
   MOBILE MENU
===================================================== */
const mainNavEl = document.querySelector('.main-nav');

function closeMobileNav(){
    mainNavEl.classList.remove('open');
}

document.getElementById('mobileMenuToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    mainNavEl.classList.toggle('open');
});

// Close the mobile nav when tapping outside of it.
document.addEventListener('click', (e) => {
    if (!mainNavEl.classList.contains('open')) return;
    if (mainNavEl.contains(e.target) || e.target.closest('#mobileMenuToggle')) return;
    closeMobileNav();
});

/* =====================================================
   INIT
===================================================== */
updateBookingsBadge();
showView('home');