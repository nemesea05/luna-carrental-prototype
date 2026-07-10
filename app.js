// ==========================================
// 1. Mobile menu toggle
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
// 2. Header shrink on scroll + mini search sync
// ==========================================
const header = document.getElementById('siteHeader');
const hmsLoc = document.getElementById('hmsLoc');
const hmsDates = document.getElementById('hmsDates');
const hmsSearchBtn = document.getElementById('hmsSearchBtn');

if(header){
    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
}

if(hmsSearchBtn){
    hmsSearchBtn.addEventListener('click', () => {
        const bookingSection = document.getElementById('booking');
        if(bookingSection) bookingSection.scrollIntoView({ behavior:'smooth', block:'center' });
    });
}

function syncMiniHeader(){
    const pickupLocation = document.getElementById('pickupLocation');
    const pickupDate = document.getElementById('pickupDate');
    const dropoffDate = document.getElementById('dropoffDate');

    if(hmsLoc && pickupLocation){
        hmsLoc.textContent = pickupLocation.value || 'Quezon City';
    }
    if(hmsDates && pickupDate && pickupDate.value && dropoffDate && dropoffDate.value){
        const pDate = new Date(pickupDate.value).toLocaleDateString('en-US', { month:'short', day:'numeric' });
        const dDate = new Date(dropoffDate.value).toLocaleDateString('en-US', { month:'short', day:'numeric' });
        hmsDates.textContent = `${pDate} - ${dDate}`;
    }
}

// ==========================================
// 3. Scroll reveal animations
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
// 4. Hero "Book Now" scrolls to booking and focuses first field
// ==========================================
const openBooking = document.getElementById('openBooking');
const bookingSection = document.getElementById('booking');
const pickupLocationInput = document.getElementById('pickupLocation');

function goToBooking(){
    if(!bookingSection) return;
    bookingSection.scrollIntoView({ behavior:'smooth', block:'center' });
    setTimeout(() => pickupLocationInput && pickupLocationInput.focus(), 500);
}

if(openBooking){
    openBooking.addEventListener('click', goToBooking);
}

// ==========================================
// 5. Multi-step booking widget
// ==========================================
const step1Form = document.getElementById('step1Form');

if(step1Form){

    const sameLocation = document.getElementById('sameLocation');
    const dropoffGroup = document.getElementById('dropoffGroup');
    const dropoffLocationInput = document.getElementById('dropoffLocation');

    const pickupDate = document.getElementById('pickupDate');
    const pickupTime = document.getElementById('pickupTime');
    const dropoffDate = document.getElementById('dropoffDate');
    const dropoffTime = document.getElementById('dropoffTime');

    const bookingError = document.getElementById('bookingError');

    const loaderOverlay = document.getElementById('loaderOverlay');
    const loaderText = document.getElementById('loaderText');
    const progressSteps = document.querySelectorAll('.progress-step');
    const stepViews = document.querySelectorAll('.step-view');

    const vehiclePill = document.getElementById('vehiclePill');
    const vehiclePillText = document.getElementById('vehiclePillText');
    const vehiclePillClear = document.getElementById('vehiclePillClear');

    let currentStep = 1;
    let selectedVehicleKey = null;

    // ---- Build half-hour time options ----
    const buildTimeOptions = (select, defaultValue) => {
        select.innerHTML = '';
        for(let h = 6; h <= 22; h++){
            for(let m of [0, 30]){
                if(h === 22 && m === 30) continue;
                const hh = String(h).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                const value = `${hh}:${mm}`;
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = value;
                if(value === defaultValue) opt.selected = true;
                select.appendChild(opt);
            }
        }
    };

    buildTimeOptions(pickupTime, '13:00');
    buildTimeOptions(dropoffTime, '13:00');

    // ---- Default dates: today for pick-up, tomorrow for drop-off ----
    const toInputDate = (d) => d.toISOString().split('T')[0];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    pickupDate.value = toInputDate(today);
    dropoffDate.value = toInputDate(tomorrow);
    pickupDate.min = toInputDate(today);
    dropoffDate.min = toInputDate(today);

    pickupDate.addEventListener('change', () => {
        dropoffDate.min = pickupDate.value;
        if(dropoffDate.value < pickupDate.value){
            dropoffDate.value = pickupDate.value;
        }
        syncMiniHeader();
    });
    dropoffDate.addEventListener('change', syncMiniHeader);
    if(pickupLocationInput) pickupLocationInput.addEventListener('input', syncMiniHeader);

    syncMiniHeader();

    // ---- Toggle drop-off location field ----
    const syncLocationField = () => {
        if(sameLocation.checked){
            dropoffGroup.classList.add('is-hidden');
            dropoffLocationInput.required = false;
        }else{
            dropoffGroup.classList.remove('is-hidden');
            dropoffLocationInput.required = true;
        }
    };

    sameLocation.addEventListener('change', syncLocationField);
    syncLocationField();

    // ---- Vehicle pill (carried over from the fleet section) ----
    function setVehiclePill(name, key){
        selectedVehicleKey = key;
        if(vehiclePillText) vehiclePillText.textContent = name;
        if(vehiclePill) vehiclePill.classList.add('show');
    }

    if(vehiclePillClear){
        vehiclePillClear.addEventListener('click', () => {
            selectedVehicleKey = null;
            vehiclePill.classList.remove('show');
            document.querySelectorAll('.car-result-card.matched').forEach(card => card.classList.remove('matched'));
        });
    }

    // ---- Step navigation ----
    function showLoader(text, duration, callback){
        loaderText.textContent = text;
        loaderOverlay.classList.add('active');
        setTimeout(() => {
            loaderOverlay.classList.remove('active');
            callback();
        }, duration);
    }

    function updateProgressUI(stepIndex){
        progressSteps.forEach(st => {
            const stepNum = parseInt(st.getAttribute('data-step'));
            st.classList.toggle('active', stepNum <= stepIndex);
        });
    }

    window.goToStep = function(stepIndex){
        stepViews.forEach(view => view.classList.remove('active-step'));

        let viewId = 'step1Form';
        if(stepIndex === 2) viewId = 'step2Cars';
        if(stepIndex === 3) viewId = 'step3Form';
        if(stepIndex === 4) viewId = 'step4Success';

        document.getElementById(viewId).classList.add('active-step');
        updateProgressUI(stepIndex);
        currentStep = stepIndex;

        if(stepIndex === 2){
            document.querySelectorAll('.car-result-card').forEach(card => {
                card.classList.toggle('matched', selectedVehicleKey && card.dataset.key === selectedVehicleKey);
            });
        }
    };

    // ---- Step 1 -> Step 2 ----
    step1Form.addEventListener('submit', (e) => {
        e.preventDefault();
        bookingError.classList.remove('show');

        if(!step1Form.checkValidity()){
            step1Form.reportValidity();
            return;
        }

        const pickup = new Date(`${pickupDate.value}T${pickupTime.value}`);
        const dropoff = new Date(`${dropoffDate.value}T${dropoffTime.value}`);

        if(dropoff <= pickup){
            bookingError.classList.add('show');
            return;
        }

        showLoader('Searching fleet...', 1200, () => goToStep(2));
    });

    // ---- Step 2 -> Step 3 ----
    window.selectCar = function(carName, dailyRate, key){
        const d1 = new Date(pickupDate.value);
        const d2 = new Date(dropoffDate.value);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const total = diffDays * dailyRate;

        setVehiclePill(carName, key);

        document.getElementById('summaryCar').textContent = carName;
        document.getElementById('summaryPrice').textContent = `₱${total.toLocaleString()}`;

        showLoader('Preparing secure form...', 600, () => goToStep(3));
    };

    // ---- Step 3 -> Step 4 ----
    const step3Form = document.getElementById('step3Form');
    if(step3Form){
        step3Form.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!step3Form.checkValidity()){
                step3Form.reportValidity();
                return;
            }
            showLoader('Uploading secure documents...', 1800, () => goToStep(4));
        });
    }

    // ---- Fleet "Reserve" buttons feed straight into Step 1 ----
    const vehicleButtons = document.querySelectorAll('.vehicle-btn');
    vehicleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.vehicle;
            setVehiclePill(name, name);
            goToStep(1);
            goToBooking();
        });
    });
}

// ==========================================
// 6. FAQ accordion
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