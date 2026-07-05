// --- Global functions for selecting services/plans ---
function selectService(serviceName) {
    const serviceSelect = document.getElementById('service');
    const contactSection = document.getElementById('contact');
    if (serviceSelect) serviceSelect.value = serviceName;
    if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
}

// Keep selectPlan for backward compatibility with pricing buttons
function selectPlan(plan) {
    selectService(plan);
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Scroll Reveal Animation ---
    const reveals = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
        }
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Run once on load

    // --- Form Validation ---
    const orderForm = document.getElementById('orderForm');
    const feedback = document.getElementById('formFeedback');

    const showError = (input, message) => {
        input.classList.add('error');
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-msg';
        errorMsg.innerText = message;
        input.parentElement.appendChild(errorMsg);
    };

    const clearErrors = () => {
        const inputs = orderForm.querySelectorAll('input, select');
        inputs.forEach(input => input.classList.remove('error'));
        const messages = orderForm.querySelectorAll('.error-msg');
        messages.forEach(msg => msg.remove());
        feedback.innerHTML = "";
    };

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();
        
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const channelLink = document.getElementById('channelLink');
        const service = document.getElementById('service');
        let isValid = true;

        if (name.value.trim().length < 2) {
            showError(name, "Please enter your name.");
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            showError(email, "Please enter a valid email address.");
            isValid = false;
        }

        if (!channelLink.value.includes('youtube.com') && !channelLink.value.includes('youtu.be')) {
            showError(channelLink, "Please enter a valid YouTube channel link.");
            isValid = false;
        }

        if (service.value === "") {
            showError(service, "Please select a service plan.");
            isValid = false;
        }

        if (isValid) {
            const submittedLink = channelLink.value.trim();
            // --- Save Order to LocalStorage ---
            const newOrder = {
                id: Date.now(),
                name: name.value.trim(),
                email: email.value.trim(),
                link: submittedLink,
                plan: service.value,
                date: new Date().toLocaleString(),
                status: 'Processing' // Default status for new orders
            };

            const existingOrders = JSON.parse(localStorage.getItem('tubeBoostOrders')) || [];
            existingOrders.push(newOrder);
            localStorage.setItem('tubeBoostOrders', JSON.stringify(existingOrders));

            feedback.style.color = "#00ff00";
            feedback.innerHTML = `<i class="fas fa-check-circle"></i> Thank you, ${name.value.trim()}! Your order for the ${service.value} plan has been received.`;

            // Automatically show channel and payment details right here
            document.getElementById('paymentCard').style.display = 'block';
            orderForm.reset();
            processChannelLink(submittedLink); // Call this *after* resetting the form but with the saved link
        }
    });

    // --- Live Channel Preview on Link Input ---
    const channelLinkInput = document.getElementById('channelLink');
    if (channelLinkInput) {
        channelLinkInput.addEventListener('blur', () => {
            const url = channelLinkInput.value.trim();
            if (url) {
                processChannelLink(url);
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a');

    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        
        // Staggered Link Animation
        links.forEach((link, index) => {
            if (link.parentElement.style.animation) {
                link.parentElement.style.animation = '';
            } else {
                link.parentElement.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Toggle Menu Icon
        const icon = menuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Close menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('nav-active');
            // Reset animations so they trigger again next time
            links.forEach(l => l.parentElement.style.animation = '');
            
            const icon = menuBtn.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        });
    });

    // --- Back to Top Button ---
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- YouTube Channel Inspector Logic ---
    const API_KEY = 'AIzaSyAHBlvpQvblXt6U_Uh2u5wlG4DxESVRnzw'; // REPLACE WITH YOUR ACTUAL KEY
    const channelCard = document.getElementById('channelCard');
    const errorDisplay = document.getElementById('inspectorError');
    const loader = document.getElementById('inspectorLoading');

    const fetchChannelDetails = async (identifier, isHandle) => {
        const part = 'snippet,statistics';
        const filter = isHandle ? `forHandle=${identifier}` : `id=${identifier}`;
        const url = `https://www.googleapis.com/youtube/v3/channels?part=${part}&${filter}&key=${API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                displayChannel(channel);
            } else {
                throw new Error("Channel not found. Check the link.");
            }
        } catch (err) {
            errorDisplay.innerText = err.message;
            channelCard.style.display = 'none';
        } finally {
            loader.style.display = 'none';
        }
    };

    const displayChannel = (channel) => {
        document.getElementById('chanImg').src = channel.snippet.thumbnails.medium.url;
        document.getElementById('chanName').innerText = channel.snippet.title;
        
        const stats = channel.statistics;
        const subCount = stats.hiddenSubscriberCount 
            ? "Private" 
            : Number(stats.subscriberCount).toLocaleString();
        
        const viewCount = Number(stats.viewCount).toLocaleString();
        const videoCount = Number(stats.videoCount).toLocaleString();
        
        document.getElementById('chanSubs').innerText = `${subCount} Subscribers`;
        document.getElementById('chanViews').innerText = `${viewCount} Total Views`;
        document.getElementById('chanVideos').innerText = `${videoCount} Videos`;

        channelCard.style.display = 'flex';
        errorDisplay.innerText = "";

        // --- 3D Tilt Effect Initialization ---
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(channelCard, {
                max: 15,
                speed: 400,
                glare: true,
                "max-glare": 0.3,
            });
        }
    };

    const processChannelLink = (url) => {
        errorDisplay.innerText = "";
        channelCard.style.display = 'none';

        if (!url) return;

        let identifier = "";
        let isHandle = false;

        // More robust regex to capture various YouTube channel URL formats
        const regexPatterns = [
            /youtube\.com\/(?:c\/|channel\/|@)?([^/?#]+)/,
            /youtu\.be\/([^/?#]+)/ 
        ];

        for (const regex of regexPatterns) {
            const match = url.match(regex);
            if (match && match[1]) {
                identifier = match[1];
                // Handles start with '@', channel IDs do not.
                isHandle = identifier.startsWith('@');
                break;
            }
        }

        if (!identifier) return; // Exit if no valid identifier was found

        loader.style.display = 'block';
        fetchChannelDetails(identifier, isHandle);
    };
});
