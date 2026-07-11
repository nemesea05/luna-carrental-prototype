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
    if (isAltViewActive()) return;

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
    if (isAltViewActive()) return;
    
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
        if(isAltViewActive()) return;
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
        clearAltViews();
        document.body.classList.add('show-results');
        searchResultsView.style.display = 'block';
        
        if(navCarServices) {
            navCarServices.classList.add('highlight-active');
        }
        
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
}

// Requirement 4 Fix: Bind Deal selection interactions to premium product breakdown modal rows
document.querySelectorAll('.view-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        clearAltViews();
        document.body.classList.add('show-details-view');
        carDetailsView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
});

// Breadcrumb modeling links behavior reset
const backToResults = document.getElementById('backToResults');
if (backToResults) {
    backToResults.addEventListener('click', (e) => {
        e.preventDefault();
        clearAltViews();
        document.body.classList.add('show-results');
        searchResultsView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
}

// Complete structural navigation canvas view updates
document.querySelectorAll('.clickable-logo').forEach(logo => {
    logo.addEventListener('click', () => {
        if(!isAltViewActive()) return;
        
        clearAltViews();
        
        if(navCarServices) {
            navCarServices.classList.remove('highlight-active');
        }
        
        window.scrollTo({ top: 0, behavior: 'instant' });
        calculateOffsets();
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
// 8. Alternate View State Helpers
// (Shared plumbing used by results / details / receipt / bookings views)
// ==========================================
const ALT_VIEW_CLASSES = ['show-results', 'show-details-view', 'show-receipt-view', 'show-bookings-view'];

function isAltViewActive(){
    return ALT_VIEW_CLASSES.some(cls => document.body.classList.contains(cls));
}

function clearAltViews(){
    document.body.classList.remove(...ALT_VIEW_CLASSES);
    if(searchResultsView) searchResultsView.style.display = 'none';
    if(carDetailsView) carDetailsView.style.display = 'none';
    if(bookingReceiptView) bookingReceiptView.style.display = 'none';
    if(myBookingsView) myBookingsView.style.display = 'none';
}

// ==========================================
// 9. Booking Submission, Receipt & My Bookings List
// ==========================================
const myBookingsBtn = document.getElementById('myBookingsBtn');
const bookingsCountBadge = document.getElementById('bookingsCountBadge');
const checkoutSubmitBtn = document.getElementById('checkoutSubmitBtn');
const bookingReceiptView = document.getElementById('bookingReceiptView');
const receiptCardContent = document.getElementById('receiptCardContent');
const receiptBackBtn = document.getElementById('receiptBackBtn');
const receiptViewAllBtn = document.getElementById('receiptViewAllBtn');
const myBookingsView = document.getElementById('myBookingsView');
const bookingsListContainer = document.getElementById('bookingsListContainer');
const bookingsTotalCount = document.getElementById('bookingsTotalCount');
const bookingsEmptyState = document.getElementById('bookingsEmptyState');
const emptyStateBrowseBtn = document.getElementById('emptyStateBrowseBtn');

// In-memory booking list for this prototype session (no backend yet — resets on page reload)
let bookingsStore = [];
let bookingRefCounter = 1000;

function generateBookingRef(){
    bookingRefCounter += 1;
    return `LNC-${new Date().getFullYear()}-${bookingRefCounter}`;
}

function readText(el){
    return el ? el.textContent.trim().replace(/\s+/g, ' ') : '';
}

function parseUSD(str){
    return parseFloat((str || '0').replace(/[^0-9.]/g, '')) || 0;
}

// Reads the currently displayed car + search info to build a booking record.
// Pulling from the live DOM (instead of duplicating hard-coded numbers) keeps
// the receipt in sync with whatever the pricing/details panel is showing.
function collectBookingFromDetailsView(){
    const rentalTypeBtn = document.querySelector('.rt-option.active');
    const isDriverType = !!(rentalTypeBtn && rentalTypeBtn.dataset.type === 'driver');

    // Vehicle name + subtext
    const carTitleH2 = document.querySelector('#carDetailsView .car-title-row h2');
    let carName = 'Selected Vehicle';
    let carSubtext = '';
    if(carTitleH2){
        const subtextEl = carTitleH2.querySelector('.car-subtext');
        carSubtext = subtextEl ? readText(subtextEl) : '';
        const fullText = readText(carTitleH2);
        carName = (carSubtext ? fullText.replace(carSubtext, '') : fullText).trim() || carName;
    }

    // Vehicle icon (matches whatever icon the details panel is using)
    let vehicleIconClass = 'fa-car';
    const iconEl = document.querySelector('#carDetailsView .car-info-visual i');
    if(iconEl){
        const found = Array.from(iconEl.classList).find(c => c.startsWith('fa-') && c !== 'fa-solid' && c !== 'fa-regular' && !/^fa-\d+x$/.test(c));
        if(found) vehicleIconClass = found;
    }

    // Trip dates/duration
    let tripTimelineText = '';
    const itTextEl = document.querySelector('#carDetailsView .it-text');
    if(itTextEl){
        const clone = itTextEl.cloneNode(true);
        const pill = clone.querySelector('.duration-pill');
        let durationText = '';
        if(pill){ durationText = readText(pill); pill.remove(); }
        tripTimelineText = readText(clone) + (durationText ? ` (${durationText})` : '');
    }

    // Branch / pick-up location
    let branchLocation = '';
    const locTitleEl = document.querySelector('#carDetailsView .loc-title');
    if(locTitleEl){
        const clone = locTitleEl.cloneNode(true);
        const link = clone.querySelector('.map-link-inline');
        if(link) link.remove();
        branchLocation = readText(clone);
    }
    const locSub = readText(document.querySelector('#carDetailsView .loc-sub'));

    // Rental type extras
    let rentalTypeLabel = 'Rent a Car (Self-drive)';
    let extraLine = '';
    let driverPickupAddress = '';
    if(isDriverType){
        rentalTypeLabel = 'Rent a Car with Driver';
        extraLine = "Driver will be provided by LUNA's Car Rental.";
        if(pickupLocation && pickupLocation.value) driverPickupAddress = pickupLocation.value;
        if(diffDropoffCheck && diffDropoffCheck.checked && dropoffLocation && dropoffLocation.value){
            extraLine += ` Drop-off at: ${dropoffLocation.value}.`;
        }
    } else {
        const country = document.getElementById('driverCountry');
        const age = document.getElementById('driverAge');
        extraLine = `Driver's license issuing country: ${country ? country.value : 'N/A'} · Driver's age: ${age ? age.value : 'N/A'}`;
    }

    // Pricing (Prepay online + Pay at pick-up primary rows, in document order)
    const priceRows = document.querySelectorAll('#carDetailsView .price-summary-row.primary-row .row-cost-val');
    const prepayOnline = priceRows[0] ? readText(priceRows[0]) : 'US$0.00';
    const payAtPickup = priceRows[1] ? readText(priceRows[1]) : 'US$0.00';
    const grandTotal = parseUSD(prepayOnline) + parseUSD(payAtPickup);

    return {
        ref: generateBookingRef(),
        submittedAt: new Date(),
        rentalTypeLabel,
        extraLine,
        carName,
        carSubtext,
        vehicleIconClass,
        tripTimelineText,
        branchLocation,
        locSub,
        driverPickupAddress,
        prepayOnline,
        payAtPickup,
        grandTotal,
        status: 'pending'
    };
}

function renderReceiptCardHTML(b){
    const submittedStr = b.submittedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    return `
        <div class="receipt-head-row">
            <div class="receipt-ref">${b.ref}<small>Booking reference</small></div>
            <div class="receipt-submitted">Submitted<strong>${submittedStr}</strong></div>
        </div>

        <div class="receipt-section">
            <div class="receipt-section-title">Vehicle</div>
            <div class="receipt-vehicle-row">
                <div class="receipt-vehicle-visual"><i class="fa-solid ${b.vehicleIconClass} fa-2x"></i></div>
                <div class="receipt-vehicle-info">
                    <h4>${b.carName}</h4>
                    <span>${b.carSubtext}</span>
                </div>
            </div>
        </div>

        <div class="receipt-section">
            <div class="receipt-section-title">Trip Details</div>
            <div class="receipt-detail-line"><i class="fa-regular fa-calendar"></i> ${b.tripTimelineText || 'Dates to be confirmed'}</div>
            <div class="receipt-detail-line"><i class="fa-solid fa-location-dot"></i> ${b.branchLocation || 'Branch to be confirmed'}${b.locSub ? `<small>${b.locSub}</small>` : ''}</div>
            ${b.driverPickupAddress ? `<div class="receipt-detail-line"><i class="fa-solid fa-user-tie"></i> Driver pick-up address<small>${b.driverPickupAddress}</small></div>` : ''}
            <div class="receipt-detail-line"><i class="fa-solid fa-id-card-clip"></i> ${b.rentalTypeLabel}<small>${b.extraLine}</small></div>
        </div>

        <div class="receipt-section">
            <div class="receipt-section-title">Estimated Price</div>
            <div class="receipt-price-row"><span>Prepay online</span><span>${b.prepayOnline}</span></div>
            <div class="receipt-price-row"><span>Pay at pick-up</span><span>${b.payAtPickup}</span></div>
            <div class="receipt-price-row total-row"><span>Estimated total</span><span>US$${b.grandTotal.toFixed(2)}</span></div>
        </div>

        <div class="receipt-footnote">
            <i class="fa-solid fa-circle-info"></i>
            <span>This is a booking request, not a payment receipt. No charges have been made yet — our staff will reach out to confirm details and walk you through payment terms.</span>
        </div>
    `;
}

function renderBookingSummaryCardHTML(b){
    return `
        <div class="booking-summary-card" data-booking-ref="${b.ref}">
            <div class="bsc-top">
                <span class="status-badge status-pending"><i class="fa-solid fa-hourglass-half"></i> Pending Confirmation</span>
                <span class="bsc-ref">#${b.ref}</span>
            </div>
            <div class="bsc-body">
                <div class="bsc-visual"><i class="fa-solid ${b.vehicleIconClass} fa-2x"></i></div>
                <div class="bsc-info">
                    <h4>${b.carName}<span>${b.carSubtext}</span></h4>
                    <p class="bsc-dates"><i class="fa-regular fa-calendar"></i> ${b.tripTimelineText || 'Dates to be confirmed'}</p>
                    <p class="bsc-location"><i class="fa-solid fa-location-dot"></i> ${b.branchLocation || 'Branch to be confirmed'}</p>
                </div>
            </div>
            <div class="bsc-bottom">
                <span class="bsc-total">Est. total: <strong>US$${b.grandTotal.toFixed(2)}</strong></span>
                <button type="button" class="view-receipt-btn" data-booking-ref="${b.ref}">View Receipt <i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>
    `;
}

function showReceiptView(booking){
    if(!bookingReceiptView || !receiptCardContent) return;
    receiptCardContent.innerHTML = renderReceiptCardHTML(booking);
    clearAltViews();
    document.body.classList.add('show-receipt-view');
    bookingReceiptView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderBookingsList(){
    if(!bookingsListContainer) return;
    bookingsListContainer.innerHTML = bookingsStore.slice().reverse().map(renderBookingSummaryCardHTML).join('');
    bookingsListContainer.style.display = bookingsStore.length ? 'flex' : 'none';
    if(bookingsTotalCount) bookingsTotalCount.textContent = `${bookingsStore.length} booking${bookingsStore.length === 1 ? '' : 's'}`;
    if(bookingsEmptyState) bookingsEmptyState.classList.toggle('is-active', bookingsStore.length === 0);

    bookingsListContainer.querySelectorAll('.view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const found = bookingsStore.find(b => b.ref === btn.dataset.bookingRef);
            if(found) showReceiptView(found);
        });
    });
}

function showBookingsView(){
    if(!myBookingsView) return;
    renderBookingsList();
    clearAltViews();
    document.body.classList.add('show-bookings-view');
    myBookingsView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateBookingsBadge(){
    if(!bookingsCountBadge) return;
    if(bookingsStore.length > 0){
        bookingsCountBadge.textContent = bookingsStore.length;
        bookingsCountBadge.style.display = 'inline-flex';
    } else {
        bookingsCountBadge.style.display = 'none';
    }
}

if(myBookingsBtn){
    myBookingsBtn.addEventListener('click', showBookingsView);
}

if(checkoutSubmitBtn){
    checkoutSubmitBtn.addEventListener('click', () => {
        const booking = collectBookingFromDetailsView();
        bookingsStore.push(booking);
        updateBookingsBadge();
        showReceiptView(booking);
    });
}

if(receiptBackBtn){
    receiptBackBtn.addEventListener('click', () => {
        clearAltViews();
        if(navCarServices) navCarServices.classList.remove('highlight-active');
        window.scrollTo({ top: 0, behavior: 'instant' });
        calculateOffsets();
    });
}

if(receiptViewAllBtn){
    receiptViewAllBtn.addEventListener('click', showBookingsView);
}

if(emptyStateBrowseBtn){
    emptyStateBrowseBtn.addEventListener('click', () => {
        clearAltViews();
        if(navCarServices) navCarServices.classList.remove('highlight-active');
        calculateOffsets();
        const fleetEl = document.getElementById('fleet');
        if(fleetEl){
            window.scrollTo({ top: fleetEl.offsetTop - 120, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    });
}