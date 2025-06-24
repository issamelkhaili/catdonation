// PayPal Official Buttons Integration
console.log('🚀 PayPal buttons initializing...');

let paypalClientId = '';

// Load PayPal configuration
async function loadPayPalConfig() {
    try {
        const response = await fetch('/api/paypal/config');
        const config = await response.json();
        paypalClientId = config.clientId;
        console.log('✅ PayPal config loaded');
        return config;
    } catch (error) {
        console.error('❌ Error loading PayPal config:', error);
        return null;
    }
}

// Initialize PayPal buttons
async function initializePayPalButtons() {
    const config = await loadPayPalConfig();
    if (!config) {
        console.error('❌ Cannot initialize PayPal buttons without config');
        return;
    }

    // Load PayPal SDK
    if (!window.paypal) {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=USD&components=buttons&enable-funding=card`;
        script.onload = () => {
            console.log('✅ PayPal SDK loaded');
            renderPayPalButtons();
        };
        script.onerror = () => {
            console.error('❌ Failed to load PayPal SDK');
        };
        document.head.appendChild(script);
    } else {
        renderPayPalButtons();
    }
}

// Render PayPal buttons
function renderPayPalButtons() {
    const container = document.getElementById('paypal-button-container');
    if (!container) {
        console.error('❌ PayPal button container not found');
        return;
    }

    // Clear existing buttons and create wrapper
    container.innerHTML = `
        <div class="flex flex-col items-center space-y-3 max-w-sm mx-auto paypal-buttons-wrapper">
        </div>
    `;

    // Render both PayPal buttons (yellow PayPal + blue card)
    window.paypal.Buttons({
        style: {
            layout: 'vertical',
            height: 55
        },
        
        createOrder: function(data, actions) {
            const amount = getSelectedAmount();
            const donorInfo = getDonorInfo();
            
            if (!amount) {
                alert('Please select a donation amount');
                return;
            }

            if (!donorInfo.firstName || !donorInfo.lastName || !donorInfo.email) {
                alert('Please fill in all personal information');
                return;
            }

            console.log(`💰 Creating order for $${amount}`);

            return fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    frequency: donorInfo.frequency,
                    donorInfo: {
                        firstName: donorInfo.firstName,
                        lastName: donorInfo.lastName,
                        email: donorInfo.email
                    }
                }),
            })
            .then(response => response.json())
            .then(data => {
                console.log('✅ Order created:', data.id);
                return data.id;
            })
            .catch(error => {
                console.error('❌ Error creating order:', error);
                alert('Error creating order. Please try again.');
            });
        },

        onApprove: function(data, actions) {
            console.log('✅ Payment approved:', data.orderID);
            
            return fetch(`/api/paypal/capture-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: data.orderID
                }),
            })
            .then(response => response.json())
            .then(details => {
                console.log('✅ Payment captured:', details);
                
                // Show success message
                showSuccessMessage(details);
            })
            .catch(error => {
                console.error('❌ Error capturing payment:', error);
                alert('Error processing payment. Please contact support.');
            });
        },

        onError: function(err) {
            console.error('❌ Payment error:', err);
            alert('Payment encountered an error. Please try again.');
        },

        onCancel: function(data) {
            console.log('⚠️ Payment cancelled:', data.orderID);
            alert('Payment was cancelled. You can try again anytime.');
        }
    }).render('#paypal-button-container .paypal-buttons-wrapper');

    console.log('✅ PayPal buttons rendered successfully');
}

// Get selected donation amount
function getSelectedAmount() {
    const customAmount = document.getElementById('custom-amount');
    const customValue = parseFloat(customAmount.value);
    
    if (customValue && customValue > 0) {
        return customValue;
    }
    
    return 25; // Default amount
}

// Get donor information
function getDonorInfo() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const frequency = document.querySelector('input[name="frequency"]:checked').value;
    
    return {
        firstName,
        lastName,
        email,
        frequency
    };
}

// Show success message
function showSuccessMessage(details) {
    const amount = getSelectedAmount();
    const exclusiveBenefits = amount >= 50;
    
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = `
        <div class="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center">
            <div class="flex items-center justify-center mb-4">
                <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Thank You for Your Donation! 🐱</h3>
            <p class="mb-2">Transaction ID: ${details.id || details.transactionId}</p>
            ${exclusiveBenefits ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p class="text-yellow-800 font-semibold">🌟 Exclusive Donor Benefits Activated!</p>
                    <p class="text-yellow-700 text-sm">You'll receive personal updates, behind-the-scenes stories, and impact reports.</p>
                </div>
            ` : ''}
            <p class="text-sm">You will receive an email confirmation shortly.</p>
            <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all">
                Make Another Donation
            </button>
        </div>
    `;
}

// Handle custom amount input
function setupCustomAmountHandler() {
    const customAmountInput = document.getElementById('custom-amount');

    // Handle custom amount input
    customAmountInput.addEventListener('input', function() {
        const customValue = parseFloat(this.value);
        if (customValue && customValue > 0) {
            console.log(`💰 Custom amount: $${customValue}`);
        }
    });
}



// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Donation system initializing...');
    
    // Setup custom amount handler
    setupCustomAmountHandler();
    
    // Initialize PayPal buttons
    initializePayPalButtons();
    
    console.log('✅ Donation system ready');
});

// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('-translate-x-full');
    });
  }
}); 