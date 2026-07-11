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
        document.body.classList.remove('show-details-view');
        document.body.classList.add('show-results');
        searchResultsView.style.display = 'block';
        carDetailsView.style.display = 'none';
        
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
        document.body.classList.remove('show-results');
        document.body.classList.add('show-details-view');
        searchResultsView.style.display = 'none';
        carDetailsView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
});

// Breadcrumb modeling links behavior reset
const backToResults = document.getElementById('backToResults');
if (backToResults) {
    backToResults.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.remove('show-details-view');
        document.body.classList.add('show-results');
        searchResultsView.style.display = 'block';
        carDetailsView.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
}

// Complete structural navigation canvas view updates
document.querySelectorAll('.clickable-logo').forEach(logo => {
    logo.addEventListener('click', () => {
        if(!document.body.classList.contains('show-results') && !document.body.classList.contains('show-details-view')) return;
        
        document.body.classList.remove('show-results', 'show-details-view');
        searchResultsView.style.display = 'none';
        carDetailsView.style.display = 'none';
        
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