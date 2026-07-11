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
    if (document.body.classList.contains('show-results') || document.body.classList.contains('show-details-view')) return;

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
    if (document.body.classList.contains('show-results') || document.body.classList.contains('show-details-view')) return;
    
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
        if(document.body.classList.contains('show-results') || document.body.classList.contains('show-details-view')) return;
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
        switchView('results');
    });
}

// Requirement 4 Fix: Bind Deal selection interactions to premium product breakdown modal rows
document.querySelectorAll('.view-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('details');
    });
});

// Breadcrumb modeling links behavior reset
const backToResults = document.getElementById('backToResults');
if (backToResults) {
    backToResults.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('results');
    });
}

// Complete structural navigation canvas view updates — clicking the logo always resets to home
const ACTIVE_VIEW_CLASSES = ['show-results', 'show-details-view', 'show-checkout-view', 'show-confirmation-view', 'show-mybookings-view'];
document.querySelectorAll('.clickable-logo').forEach(logo => {
    logo.addEventListener('click', () => {
        const inAltView = ACTIVE_VIEW_CLASSES.some(cls => document.body.classList.contains(cls));
        if(!inAltView) return;
        switchView('landing');
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
// 7. Checkout -> Booking Submitted -> Receipt -> My Bookings flow
// ==========================================

// In-memory store for this prototype session (no backend yet).
let bookingsStore = [];
let pendingCarSummary = null; // captured from the details view right before checkout

const checkoutView = document.getElementById('checkoutView');
const confirmationView = document.getElementById('confirmationView');
const myBookingsView = document.getElementById('myBookingsView');
const checkoutSummaryBox = document.getElementById('checkoutSummaryBox');
const confirmationContainer = document.getElementById('confirmationContainer');
const myBookingsList = document.getElementById('myBookingsList');
const checkoutForm = document.getElementById('checkoutForm');
const fabBadge = document.getElementById('fabBadge');

// Master view switcher covering every top-level interface in the app.
const VIEW_MAP = {
    landing:       { cls: null,                    el: null },
    results:       { cls: 'show-results',           el: searchResultsView },
    details:       { cls: 'show-details-view',       el: carDetailsView },
    checkout:      { cls: 'show-checkout-view',      el: checkoutView },
    confirmation:  { cls: 'show-confirmation-view',  el: confirmationView },
    mybookings:    { cls: 'show-mybookings-view',    el: myBookingsView }
};

function switchView(viewName){
    Object.values(VIEW_MAP).forEach(v => {
        if(v.cls) document.body.classList.remove(v.cls);
        if(v.el) v.el.style.display = 'none';
    });

    const target = VIEW_MAP[viewName];
    if(target){
        if(target.cls) document.body.classList.add(target.cls);
        if(target.el) target.el.style.display = 'block';
    }

    if(navCarServices) navCarServices.classList.toggle('highlight-active', viewName === 'results');
    window.scrollTo({ top: 0, behavior: 'instant' });
    calculateOffsets();
}

function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
}

function parseMoney(str){
    return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
}

function formatMoney(n){
    return 'US$' + n.toFixed(2);
}

function genBookingId(){
    const rand = Math.floor(1000 + Math.random() * 9000);
    return 'LUNA-' + Date.now().toString().slice(-6) + rand;
}

// Reads the currently-displayed car details view and turns it into a plain summary object.
function captureCarSummary(){
    const titleEl = document.querySelector('#carDetailsView .car-title-row h2');
    let carTitle = 'Selected Vehicle';
    let carSubtitle = '';
    if(titleEl){
        carTitle = (titleEl.childNodes[0] && titleEl.childNodes[0].textContent.trim()) || carTitle;
        const subEl = titleEl.querySelector('.car-subtext');
        if(subEl && subEl.childNodes[0]) carSubtitle = subEl.childNodes[0].textContent.trim();
    }

    let tripText = '';
    const itText = document.querySelector('#carDetailsView .it-text');
    if(itText){
        const clone = itText.cloneNode(true);
        const pill = clone.querySelector('.duration-pill');
        const duration = pill ? pill.textContent.trim() : '';
        if(pill) pill.remove();
        tripText = clone.textContent.trim();
        if(duration) tripText += ` (${duration})`;
    }

    let pickupLocation = '';
    const locTitleEl = document.querySelector('#carDetailsView .loc-title');
    if(locTitleEl && locTitleEl.childNodes[0]){
        pickupLocation = locTitleEl.childNodes[0].textContent.trim();
    }

    const priceEls = document.querySelectorAll('#carDetailsView .price-summary-row.primary-row .row-cost-val');
    const prepay = priceEls[0] ? priceEls[0].textContent.trim() : 'US$0.00';
    const payAtPickup = priceEls[1] ? priceEls[1].textContent.trim() : 'US$0.00';
    const total = formatMoney(parseMoney(prepay) + parseMoney(payAtPickup));

    return { carTitle, carSubtitle, tripText, pickupLocation, prepay, payAtPickup, total };
}

function renderCheckoutSummary(summary){
    checkoutSummaryBox.innerHTML = `
        <h3>Booking Summary</h3>
        <div class="receipt-row"><span>Vehicle</span><span>${escapeHtml(summary.carTitle)}</span></div>
        ${summary.carSubtitle ? `<div class="receipt-row"><span>Category</span><span>${escapeHtml(summary.carSubtitle)}</span></div>` : ''}
        <div class="receipt-row"><span>Trip</span><span>${escapeHtml(summary.tripText)}</span></div>
        <div class="receipt-row"><span>Pick-up</span><span>${escapeHtml(summary.pickupLocation)}</span></div>
        <div class="divider-line"></div>
        <div class="price-summary-row sub-row"><span class="row-title">Prepay online</span><span class="row-cost-val">${escapeHtml(summary.prepay)}</span></div>
        <div class="price-summary-row sub-row"><span class="row-title">Pay at pick-up</span><span class="row-cost-val">${escapeHtml(summary.payAtPickup)}</span></div>
        <div class="divider-line"></div>
        <div class="price-summary-row primary-row"><span class="row-title">Total estimate</span><span class="row-cost-val">${escapeHtml(summary.total)}</span></div>
        <button type="submit" form="checkoutForm" class="checkout-submit-btn">Submit Booking Request</button>
        <p class="checkout-fineprint">By submitting, you agree to be contacted by our staff regarding availability and payment terms.</p>
    `;
}

function renderReceipt(booking, opts){
    const isFresh = !!(opts && opts.showSuccessBanner);

    confirmationContainer.innerHTML = `
        <div class="confirmation-hero">
            <div class="confirmation-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h2>${isFresh ? 'Your Booking Has Been Submitted!' : 'Booking Receipt'}</h2>
            <p>${isFresh
                ? 'Thank you! We\u2019ve received your request. Please wait while our staff reviews it \u2014 they will contact you shortly to confirm availability and assist you with the payment terms.'
                : 'Here are the full details of this submitted booking request.'}</p>
            <div class="booking-ref-pill"><i class="fa-solid fa-hashtag"></i> ${escapeHtml(booking.id)}</div>
        </div>

        <div class="payment-pending-note">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p><strong>No payment has been collected.</strong> This booking is pending confirmation. Our staff will reach out by phone or email to finalize your reservation and go over the payment terms.</p>
        </div>

        <div class="receipt-card">
            <h3>Status <span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending Confirmation</span></h3>
            <div class="receipt-row"><span>Submitted on</span><span>${escapeHtml(booking.createdAt)}</span></div>
            <div class="receipt-row"><span>Rental type</span><span>${escapeHtml(booking.rentalType)}</span></div>
        </div>

        <div class="receipt-card">
            <h3>Vehicle & Trip Details</h3>
            <div class="receipt-row"><span>Vehicle</span><span>${escapeHtml(booking.carTitle)}</span></div>
            ${booking.carSubtitle ? `<div class="receipt-row"><span>Category</span><span>${escapeHtml(booking.carSubtitle)}</span></div>` : ''}
            <div class="receipt-row"><span>Trip</span><span>${escapeHtml(booking.tripText)}</span></div>
            <div class="receipt-row"><span>Pick-up location</span><span>${escapeHtml(booking.pickupLocation)}</span></div>
        </div>

        <div class="receipt-card">
            <h3>Guest Information</h3>
            <div class="receipt-row"><span>Full name</span><span>${escapeHtml(booking.guestName)}</span></div>
            <div class="receipt-row"><span>Email</span><span>${escapeHtml(booking.guestEmail)}</span></div>
            <div class="receipt-row"><span>Mobile number</span><span>${escapeHtml(booking.guestPhone)}</span></div>
            ${booking.guestIdType ? `<div class="receipt-row"><span>ID type</span><span>${escapeHtml(booking.guestIdType)}${booking.guestIdNumber ? ' &mdash; ' + escapeHtml(booking.guestIdNumber) : ''}</span></div>` : ''}
            ${booking.guestNotes ? `<div class="receipt-row"><span>Special requests</span><span>${escapeHtml(booking.guestNotes)}</span></div>` : ''}
        </div>

        <div class="receipt-card">
            <h3>Estimated Price</h3>
            <div class="receipt-row"><span>Prepay online</span><span>${escapeHtml(booking.prepay)}</span></div>
            <div class="receipt-row"><span>Pay at pick-up</span><span>${escapeHtml(booking.payAtPickup)}</span></div>
            <div class="receipt-row total"><span>Total estimate</span><span>${escapeHtml(booking.total)}</span></div>
        </div>

        <div class="confirmation-actions">
            <button type="button" class="btn-ghost" id="confBackHome"><i class="fa-solid fa-house"></i> Back to Home</button>
            <button type="button" class="btn-primary" id="confViewBookings"><i class="fa-solid fa-clipboard-list"></i> View My Bookings</button>
        </div>
    `;

    document.getElementById('confBackHome').addEventListener('click', () => switchView('landing'));
    document.getElementById('confViewBookings').addEventListener('click', () => {
        renderMyBookingsList();
        switchView('mybookings');
    });
}

function renderMyBookingsList(){
    if(!bookingsStore.length){
        myBookingsList.innerHTML = `
            <div class="empty-bookings-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>No bookings yet</h3>
                <p>Once you submit a booking request, it will show up here with its status and full receipt.</p>
                <button type="button" class="btn-primary" id="emptyBookHomeBtn"><i class="fa-solid fa-car"></i> Browse Vehicles</button>
            </div>`;
        const emptyBtn = document.getElementById('emptyBookHomeBtn');
        if(emptyBtn) emptyBtn.addEventListener('click', () => switchView('landing'));
        return;
    }

    myBookingsList.innerHTML = bookingsStore.slice().reverse().map(b => `
        <div class="booking-list-card">
            <div class="blc-left">
                <span class="blc-car">${escapeHtml(b.carTitle)}</span>
                <div class="blc-meta">
                    <span><i class="fa-solid fa-hashtag"></i> ${escapeHtml(b.id)}</span>
                    <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(b.tripText)}</span>
                    <span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>
                </div>
            </div>
            <div class="blc-right">
                <span class="blc-price">${escapeHtml(b.total)}</span>
                <button type="button" class="view-receipt-btn" data-id="${escapeHtml(b.id)}">View Receipt</button>
            </div>
        </div>
    `).join('');

    myBookingsList.querySelectorAll('.view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const booking = bookingsStore.find(b => b.id === btn.dataset.id);
            if(booking){
                renderReceipt(booking, { showSuccessBanner: false });
                switchView('confirmation');
            }
        });
    });
}

function updateFabBadge(){
    const n = bookingsStore.length;
    if(fabBadge){
        fabBadge.textContent = n;
        fabBadge.style.display = n > 0 ? 'flex' : 'none';
    }
}

// "Proceed to Booking" on the car details pricing panel -> open guest checkout form
const proceedToBookingBtn = document.getElementById('proceedToBookingBtn');
if(proceedToBookingBtn){
    proceedToBookingBtn.addEventListener('click', () => {
        pendingCarSummary = captureCarSummary();
        renderCheckoutSummary(pendingCarSummary);
        if(checkoutForm) checkoutForm.reset();
        switchView('checkout');
    });
}

// Guest checkout form submission -> create the booking, show the submitted receipt
if(checkoutForm){
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!checkoutForm.checkValidity()){
            checkoutForm.reportValidity();
            return;
        }
        if(!pendingCarSummary) pendingCarSummary = captureCarSummary();

        const isDriverActive = document.getElementById('rtDriver') && document.getElementById('rtDriver').classList.contains('active');

        const booking = {
            id: genBookingId(),
            createdAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            rentalType: isDriverActive ? 'Rent a Car with Driver' : 'Self-drive',
            ...pendingCarSummary,
            guestName: document.getElementById('guestFullName').value.trim(),
            guestEmail: document.getElementById('guestEmail').value.trim(),
            guestPhone: document.getElementById('guestPhone').value.trim(),
            guestIdType: document.getElementById('guestIdType').value,
            guestIdNumber: document.getElementById('guestIdNumber').value.trim(),
            guestNotes: document.getElementById('guestNotes').value.trim()
        };

        bookingsStore.push(booking);
        updateFabBadge();
        renderReceipt(booking, { showSuccessBanner: true });
        switchView('confirmation');
    });
}

// Back link: checkout -> car details
const backToDetailsFromCheckout = document.getElementById('backToDetailsFromCheckout');
if(backToDetailsFromCheckout){
    backToDetailsFromCheckout.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('details');
    });
}

// Back link: my bookings -> home
const backHomeFromBookings = document.getElementById('backHomeFromBookings');
if(backHomeFromBookings){
    backHomeFromBookings.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('landing');
    });
}

// Quick access to "My Bookings" — identical entry points on desktop and mobile
[document.getElementById('heroMyBookingsBtn'), document.getElementById('floatingBookingsBtn')].forEach(btn => {
    if(!btn) return;
    btn.addEventListener('click', () => {
        renderMyBookingsList();
        switchView('mybookings');
    });
});

updateFabBadge();

// ==========================================
// 8. Accordion Dropdown Functions
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