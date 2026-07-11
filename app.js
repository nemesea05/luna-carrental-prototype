// ==========================================
// 1. Mobile navigation panel toggle listeners
// ==========================================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if(menuToggle && navLinks){
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        });
    });
}

// ==========================================
// 2. Scroll intersection animation frames
// ==========================================
const revealEls = document.querySelectorAll('.reveal');
if(revealEls.length){
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    revealEls.forEach(el => observer.observe(el));
}

// ==========================================
// 3. Dynamic Sticky Booking Bar Logic
// ==========================================
const header = document.getElementById('siteHeader');
const bookingWrapper = document.getElementById('bookingWrapper');
const bookingCard = document.getElementById('bookingCard');
const secondaryNav = document.getElementById('secondaryNav');
const fleetSection = document.getElementById('fleet');
const navCarServices = document.getElementById('navCarServices');

let stickyOffset = 0;
let fleetOffset = 0;

function calculateOffsets() {
    if(!bookingWrapper || !fleetSection) return;
    const scrollPos = window.scrollY || window.pageYOffset;
    stickyOffset = bookingWrapper.getBoundingClientRect().top + scrollPos - 20; 
    fleetOffset = fleetSection.getBoundingClientRect().top + scrollPos - 150; 
}

calculateOffsets();
window.addEventListener('load', calculateOffsets);
window.addEventListener('resize', calculateOffsets);

window.addEventListener('scroll', () => {
    // Structural layout skips sticky modifiers if alternative result layouts are rendering
    if (isAltView()) return;

    const scrollY = window.scrollY;

    if (scrollY >= stickyOffset) {
        document.body.classList.add('header-hidden');
        bookingCard.classList.add('is-sticky');
    } else {
        document.body.classList.remove('header-hidden');
        bookingCard.classList.remove('is-sticky');
    }

    if (scrollY >= fleetOffset && scrollY >= stickyOffset) {
        secondaryNav.classList.add('is-visible');
    } else {
        secondaryNav.classList.remove('is-visible');
    }
    
    handleScrollSpy();
}, { passive: true });

// ==========================================
// 4. ScrollSpy Indicators Mapping
// ==========================================
const sections = [
    { id: 'fleet', link: 'link-fleet' },
    { id: 'testimonials', link: 'link-testimonials' },
    { id: 'faq', link: 'link-faq' },
    { id: 'how-it-works', link: 'link-how-it-works' }
];

function handleScrollSpy() {
    if (isAltView()) return;
    
    let currentId = '';
    const scrollY = window.scrollY + 160; 

    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
            const elTop = el.offsetTop;
            const elHeight = el.offsetHeight;
            if (scrollY >= elTop && scrollY < elTop + elHeight) {
                currentId = sec.id;
            }
        }
    });

    if (currentId) {
        document.querySelectorAll('.sec-nav-item').forEach(a => a.classList.remove('active'));
        const activeLink = document.getElementById(`link-${currentId}`);
        if(activeLink) activeLink.classList.add('active');
    }
}

document.querySelectorAll('.scroll-link, .sec-nav-item').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if(isAltView()) return;
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            window.scrollTo({
                top: targetSection.offsetTop - 120, 
                behavior: 'smooth'
            });
        }
    });
});

// ==========================================
// 5. Time Select Option Generation
// ==========================================
const pickupTime = document.getElementById('pickupTime');
const dropoffTime = document.getElementById('dropoffTime');
const pickupDate = document.getElementById('pickupDate');
const dropoffDate = document.getElementById('dropoffDate');
const pickupGroup = document.getElementById('pickupGroup');
const dropoffGroup = document.getElementById('dropoffGroup');
const pickupLocation = document.getElementById('pickupLocation');
const dropoffLocation = document.getElementById('dropoffLocation');
const diffDropoffCheck = document.getElementById('diffDropoffCheck');
const rtButtons = document.querySelectorAll('.rt-option');

const driverProvidedMessage = document.getElementById('driverProvidedMessage');
const selfDriveOptions = document.getElementById('selfDriveOptions');

const to12Hour = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if(hour12 === 0) hour12 = 12;
    const mm = String(m).padStart(2, '0');
    return `${hour12}:${mm} ${period}`;
};

const buildTimeOptions = (select, defaultValue) => {
    if(!select) return;
    select.innerHTML = '';
    for(let h = 6; h <= 23; h++){
        for(let m of [0, 30]){
            const hh = String(h).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            const value = `${hh}:${mm}`; 
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = to12Hour(h, m); 
            if(value === defaultValue) opt.selected = true;
            select.appendChild(opt);
        }
    }
};

buildTimeOptions(pickupTime, '10:00');
buildTimeOptions(dropoffTime, '10:00');

const toInputDate = (d) => d.toISOString().split('T')[0];
const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 3); 

if(pickupDate && dropoffDate) {
    pickupDate.value = toInputDate(today);
    dropoffDate.value = toInputDate(tomorrow);
    pickupDate.min = toInputDate(today);
    
    pickupDate.addEventListener('change', () => {
        dropoffDate.min = pickupDate.value;
        if(dropoffDate.value < pickupDate.value){
            dropoffDate.value = pickupDate.value;
        }
    });
}

// Requirement 3 Fix: Handle the drop-off checkbox toggle functionality explicitly
if (diffDropoffCheck) {
    diffDropoffCheck.addEventListener('change', () => {
        handleDropoffFieldVisibility();
    });
}

function handleDropoffFieldVisibility() {
    const isDriverActive = document.getElementById('rtDriver').classList.contains('active');
    if (isDriverActive && diffDropoffCheck && diffDropoffCheck.checked) {
        dropoffGroup.classList.remove('is-hidden');
        dropoffLocation.required = true;
    } else {
        dropoffGroup.classList.add('is-hidden');
        dropoffLocation.required = false;
        dropoffLocation.value = '';
    }
    calculateOffsets();
}

function setRentalType(type){
    const isDriver = type === 'driver';

    rtButtons.forEach(btn => {
        const active = btn.dataset.type === type;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if(isDriver){
        pickupGroup.classList.remove('is-hidden');
        pickupLocation.required = true;
        driverProvidedMessage.classList.remove('is-hidden');
        selfDriveOptions.classList.add('is-hidden');
    } else {
        pickupGroup.classList.add('is-hidden');
        pickupLocation.required = false;
        driverProvidedMessage.classList.add('is-hidden');
        selfDriveOptions.classList.remove('is-hidden');
        if(diffDropoffCheck) diffDropoffCheck.checked = false;
    }

    handleDropoffFieldVisibility();
}

if(rtButtons.length){
    rtButtons.forEach(btn => {
        btn.addEventListener('click', () => setRentalType(btn.dataset.type));
    });
    setRentalType('self'); 
}

// ==========================================
// 6. Search Submit Interface Handlers
// ==========================================
const mainSearchForm = document.getElementById('mainSearchForm');
const searchResultsView = document.getElementById('searchResultsView');
const carDetailsView = document.getElementById('carDetailsView');
const bookingConfirmationView = document.getElementById('bookingConfirmationView');
const myBookingsView = document.getElementById('myBookingsView');

// Central view registry: keeps every top-level interface (results, details,
// confirmation, my bookings) in sync across PC and mobile so only one
// "screen" is ever visible at a time and state stays consistent.
const viewSections = {
    results: searchResultsView,
    details: carDetailsView,
    confirmation: bookingConfirmationView,
    mybookings: myBookingsView
};
const viewBodyClasses = {
    results: 'show-results',
    details: 'show-details-view',
    confirmation: 'show-confirmation-view',
    mybookings: 'show-mybookings-view'
};

function isAltView() {
    return Object.values(viewBodyClasses).some(cls => document.body.classList.contains(cls));
}

// Switch the active top-level view. Pass null/undefined to return to the landing page.
function showView(name) {
    Object.values(viewBodyClasses).forEach(cls => document.body.classList.remove(cls));
    Object.values(viewSections).forEach(sec => { if (sec) sec.style.display = 'none'; });

    if (name && viewSections[name]) {
        document.body.classList.add(viewBodyClasses[name]);
        viewSections[name].style.display = 'block';
    }

    if (navCarServices) {
        navCarServices.classList.toggle('highlight-active', name === 'results' || name === 'details');
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    calculateOffsets();
}

if(mainSearchForm) {
    mainSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if(!mainSearchForm.checkValidity()){
            mainSearchForm.reportValidity();
            return;
        }
        
        bookingCard.classList.remove('is-sticky');
        document.body.classList.remove('header-hidden');
        secondaryNav.classList.remove('is-visible');

        // Render Active Results View Matrix
        showView('results');
    });
}

// Requirement 4 Fix: Bind Deal selection interactions to premium product breakdown modal rows
document.querySelectorAll('.view-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const row = btn.closest('.result-row-card');
        populateCarDetails(row);
        updateItinerarySummary();
        showView('details');
    });
});

// Breadcrumb modeling links behavior reset
const backToResults = document.getElementById('backToResults');
if (backToResults) {
    backToResults.addEventListener('click', (e) => {
        e.preventDefault();
        showView('results');
    });
}

// Complete structural navigation canvas view updates
document.querySelectorAll('.clickable-logo').forEach(logo => {
    logo.addEventListener('click', () => {
        if(!isAltView()) return;
        showView(null);
    });
});

// Grid landing deals shortcuts modifiers mapping
document.querySelectorAll('.select-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('pickupLocation').value = "Quezon City Headquarters";
        mainSearchForm.dispatchEvent(new Event('submit'));
    });
});

// ==========================================
// 7. Accordion Dropdown Functions
// ==========================================
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(other => {
            other.classList.remove('open');
            other.querySelector('.faq-answer').style.maxHeight = null;
        });

        if(!isOpen){
            item.classList.add('open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
});

// ==========================================
// 8. Booking Confirmation & My Bookings System
// ==========================================

// In-memory booking store for this session (prototype only — no backend).
let bookings = [];

// Tracks whichever vehicle is currently shown in the Car Details view,
// defaulting to the markup's built-in example (Jeep Compass) until a
// "View deal" card is clicked.
let selectedCar = {
    iconName: 'fa-truck-pickup',
    name: 'Jeep Compass',
    subtitle: 'or similar Compact SUV',
    specsSummary: '5 Seats · 3 Suitcases · 4 Doors · Automatic',
    perDayLabel: '₱2,000.00',
    totalLabel: '₱6,000.00'
};

const proceedBookingBtn = document.getElementById('proceedBookingBtn');
const driverFullName = document.getElementById('driverFullName');
const driverMobile = document.getElementById('driverMobile');
const driverEmail = document.getElementById('driverEmail');
const myBookingsBtn = document.getElementById('myBookingsBtn');
const confBackHomeBtn = document.getElementById('confBackHomeBtn');
const confViewBookingsBtn = document.getElementById('confViewBookingsBtn');
const bookAnotherBtn = document.getElementById('bookAnotherBtn');
const emptyStateBookBtn = document.getElementById('emptyStateBookBtn');

// ---- Formatting helpers -------------------------------------------------

function formatTimeValue(val) {
    if (!val) return '--';
    const [h, m] = val.split(':').map(Number);
    return to12Hour(h, m);
}

function formatShortDate(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatSubmittedAt(date) {
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function computeDurationDays(pdStr, ddStr) {
    if (!pdStr || !ddStr) return 1;
    const pd = new Date(`${pdStr}T00:00:00`);
    const dd = new Date(`${ddStr}T00:00:00`);
    const diff = Math.round((dd - pd) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
}

function formatCurrency(num) {
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateBookingRef() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = '';
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return `LUNA-${ref}`;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ---- Dynamic car selection (Results -> Details) --------------------------

function populateCarDetails(row) {
    if (!row) return;

    const iconEl = row.querySelector('.rr-visual i');
    const titleEl = row.querySelector('.rr-details h3');
    const specEls = row.querySelectorAll('.rr-specs span');
    const priceValEl = row.querySelector('.price-val');
    const priceTotalEl = row.querySelector('.price-total');

    let iconName = 'fa-truck-pickup';
    if (iconEl) {
        const found = [...iconEl.classList].find(c => c.startsWith('fa-') && c !== 'fa-solid' && !/^fa-\dx$/.test(c));
        if (found) iconName = found;
    }

    let carName = 'Selected Vehicle';
    let carSubtitle = 'or similar vehicle';
    if (titleEl) {
        carName = titleEl.childNodes[0].textContent.trim();
        const spanEl = titleEl.querySelector('span');
        if (spanEl) carSubtitle = spanEl.textContent.trim();
    }

    let seats = '5', bags = '3';
    specEls.forEach(s => {
        const t = s.textContent.trim();
        const num = t.match(/\d+/);
        if (/seat/i.test(t) && num) seats = num[0];
        if (/bag/i.test(t) && num) bags = num[0];
    });

    const perDayLabel = priceValEl ? priceValEl.textContent.trim() : selectedCar.perDayLabel;
    const totalLabel = priceTotalEl ? priceTotalEl.textContent.replace('Total:', '').trim() : selectedCar.totalLabel;

    selectedCar = {
        iconName,
        name: carName,
        subtitle: carSubtitle,
        specsSummary: `${seats} Seats · ${bags} Suitcases · 4 Doors · Automatic`,
        perDayLabel,
        totalLabel
    };

    const targetIcon = document.querySelector('#carDetailsView .car-info-visual i');
    if (targetIcon) targetIcon.className = `fa-solid ${iconName} fa-5x`;

    const targetTitle = document.querySelector('#carDetailsView .car-title-row h2');
    if (targetTitle) {
        targetTitle.innerHTML = `${carName} <span class="car-subtext">${carSubtitle} <i class="fa-solid fa-circle-info"></i></span>`;
    }

    const targetPills = document.querySelector('#carDetailsView .car-pill-specs');
    if (targetPills) {
        targetPills.innerHTML = `
            <span><i class="fa-solid fa-user"></i> ${seats} Seats</span>
            <span><i class="fa-solid fa-suitcase"></i> ${bags} Suitcases</span>
            <span><i class="fa-solid fa-door-closed"></i> 4 Doors</span>
            <span><i class="fa-solid fa-gears"></i> Automatic</span>
            <span><i class="fa-solid fa-gas-pump"></i> Fuel</span>
        `;
    }

    updatePricingSidebar(totalLabel);
}

function updatePricingSidebar(totalLabel) {
    const totalNum = parseFloat((totalLabel || '').replace(/[^\d.]/g, '')) || 0;
    if (!totalNum) return;

    const prepayCarFee = totalNum * 0.20;
    const discount = totalNum * 0.05;
    const prepayOnline = prepayCarFee - discount;
    const payAtPickup = totalNum;

    setText('prepayOnlineVal', formatCurrency(prepayOnline));
    setText('prepayCarFeeVal', formatCurrency(prepayCarFee));
    setText('discountVal1', `-${formatCurrency(discount)}`);
    setText('discountVal2', `-${formatCurrency(discount)}`);
    setText('payAtPickupVal', formatCurrency(payAtPickup));
    setText('carRentalFeeVal', formatCurrency(payAtPickup));
}

// Refresh the Car Details itinerary card using whatever is currently set
// in the main search bar (dates, times, pick-up location) so the details
// and receipt always mirror what the person actually searched for.
function updateItinerarySummary() {
    const days = computeDurationDays(pickupDate?.value, dropoffDate?.value);
    const itText = document.querySelector('#carDetailsView .it-text');
    if (itText) {
        const pickupStr = `${formatTimeValue(pickupTime?.value)}, ${formatShortDate(pickupDate?.value)}`;
        const dropoffStr = `${formatTimeValue(dropoffTime?.value)}, ${formatShortDate(dropoffDate?.value)}`;
        itText.innerHTML = `${pickupStr} - ${dropoffStr} <strong class="duration-pill">${days} day${days !== 1 ? 's' : ''}</strong>`;
    }

    const locNameEl = document.getElementById('itineraryLocationName');
    if (locNameEl) {
        const loc = (pickupLocation?.value || '').trim();
        locNameEl.textContent = `${loc || 'Quezon City Headquarters'} branch`;
    }
}

// ---- Booking submission ---------------------------------------------------

if (proceedBookingBtn) {
    proceedBookingBtn.addEventListener('click', () => {
        const requiredFields = [driverFullName, driverMobile, driverEmail];
        const invalidField = requiredFields.find(f => f && !f.checkValidity());
        if (invalidField) {
            invalidField.reportValidity();
            document.getElementById('driverDetailsCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const isDriverRental = document.getElementById('rtDriver')?.classList.contains('active');
        const hasDiffDropoff = isDriverRental && !!diffDropoffCheck?.checked;
        const days = computeDurationDays(pickupDate?.value, dropoffDate?.value);

        const booking = {
            id: generateBookingRef(),
            submittedAt: new Date(),
            status: 'pending',
            car: { ...selectedCar },
            rental: {
                type: isDriverRental ? 'driver' : 'self',
                pickupDate: pickupDate?.value,
                pickupTime: pickupTime?.value,
                dropoffDate: dropoffDate?.value,
                dropoffTime: dropoffTime?.value,
                days,
                pickupLocation: (pickupLocation?.value || '').trim() || 'Quezon City Headquarters',
                dropoffLocation: hasDiffDropoff ? (dropoffLocation?.value || '').trim() : null
            },
            driver: {
                fullName: driverFullName.value.trim(),
                mobile: driverMobile.value.trim(),
                email: driverEmail.value.trim()
            }
        };

        bookings.push(booking);
        renderConfirmation(booking);
        renderBookingsList();
        showView('confirmation');
    });
}

// ---- Receipt rendering ------------------------------------------------

function renderConfirmation(booking) {
    setText('confNameInline', booking.driver.fullName.split(' ')[0] || 'Guest');
    setText('confRefNumber', booking.id);
    setText('confSubmittedAt', formatSubmittedAt(booking.submittedAt));

    const iconEl = document.getElementById('confVehicleIcon');
    if (iconEl) iconEl.innerHTML = `<i class="fa-solid ${booking.car.iconName} fa-2x"></i>`;

    const titleEl = document.getElementById('confVehicleTitle');
    if (titleEl) titleEl.innerHTML = `${booking.car.name} <span>${booking.car.subtitle}</span>`;

    setText('confVehicleSpecs', booking.car.specsSummary);
    setText('confRentalType', booking.rental.type === 'driver' ? 'Rent a Car with Driver' : 'Rent a Car (Self-drive)');
    setText('confPickupDateTime', `${formatShortDate(booking.rental.pickupDate)}, ${formatTimeValue(booking.rental.pickupTime)}`);
    setText('confPickupLocation', booking.rental.pickupLocation);
    setText('confDropoffDateTime', `${formatShortDate(booking.rental.dropoffDate)}, ${formatTimeValue(booking.rental.dropoffTime)}`);

    const dropRow = document.getElementById('confDropoffLocRow');
    if (dropRow) {
        if (booking.rental.dropoffLocation) {
            dropRow.style.display = 'flex';
            setText('confDropoffLocation', booking.rental.dropoffLocation);
        } else {
            dropRow.style.display = 'none';
        }
    }

    setText('confDuration', `${booking.rental.days} day${booking.rental.days !== 1 ? 's' : ''}`);
    setText('confDriverName', booking.driver.fullName);
    setText('confDriverMobile', booking.driver.mobile);
    setText('confDriverEmail', booking.driver.email);
    setText('confPricePerDay', booking.car.perDayLabel || '--');
    setText('confTotal', booking.car.totalLabel || '--');
}

// ---- My Bookings list ---------------------------------------------------

function renderBookingsList() {
    const listEl = document.getElementById('bookingsList');
    const emptyEl = document.getElementById('bookingsEmptyState');
    if (!listEl || !emptyEl) return;

    if (bookings.length === 0) {
        emptyEl.style.display = 'block';
        listEl.style.display = 'none';
        listEl.innerHTML = '';
        return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display = 'flex';

    listEl.innerHTML = bookings.slice().reverse().map(b => `
        <div class="booking-list-card">
            <div class="blc-icon"><i class="fa-solid ${b.car.iconName} fa-2x"></i></div>
            <div class="blc-body">
                <div class="blc-top-row">
                    <h3>${b.car.name}<span>${b.car.subtitle}</span></h3>
                    <span class="status-pill status-pending">Pending confirmation</span>
                </div>
                <div class="blc-meta">
                    <span><i class="fa-regular fa-calendar"></i> ${formatShortDate(b.rental.pickupDate)} - ${formatShortDate(b.rental.dropoffDate)}</span>
                    <span><i class="fa-solid fa-hashtag"></i> ${b.id}</span>
                    <span><i class="fa-regular fa-clock"></i> Submitted ${formatSubmittedAt(b.submittedAt)}</span>
                </div>
            </div>
            <div class="blc-action">
                <div class="blc-price">${b.car.totalLabel || ''}</div>
                <button type="button" class="view-receipt-btn" data-booking-id="${b.id}">View Receipt</button>
            </div>
        </div>
    `).join('');

    listEl.querySelectorAll('.view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const booking = bookings.find(b => b.id === btn.getAttribute('data-booking-id'));
            if (booking) {
                renderConfirmation(booking);
                showView('confirmation');
            }
        });
    });
}

// ---- Navigation bindings for the new views -------------------------------

if (myBookingsBtn) {
    myBookingsBtn.addEventListener('click', () => {
        renderBookingsList();
        showView('mybookings');
    });
}

if (confBackHomeBtn) {
    confBackHomeBtn.addEventListener('click', () => showView(null));
}

if (confViewBookingsBtn) {
    confViewBookingsBtn.addEventListener('click', () => {
        renderBookingsList();
        showView('mybookings');
    });
}

function goBookAnotherCar() {
    showView(null);
    setTimeout(() => {
        document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}

if (bookAnotherBtn) bookAnotherBtn.addEventListener('click', goBookAnotherCar);
if (emptyStateBookBtn) emptyStateBookBtn.addEventListener('click', goBookAnotherCar);