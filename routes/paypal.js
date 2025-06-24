const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (process.env.PAYPAL_MODE === 'sandbox') {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
}

// PayPal client
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Store for tracking donations (in production, use a database)
const donations = new Map();

/**
 * Create order for direct card payments (hosted fields)
 */
router.post('/create-card-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', frequency, donorInfo } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!donorInfo || !donorInfo.email) {
      return res.status(400).json({ error: 'Donor information required' });
    }

    // Create order request for card payments
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: uuidv4(),
        description: frequency === 'monthly' 
          ? `Monthly donation to Paws Hope - Saving Cats Worldwide` 
          : `One-time donation to Paws Hope - Saving Cats Worldwide`,
        amount: {
          currency_code: currency,
          value: amount.toString()
        }
      }],
      payment_source: {
        card: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Paws Hope - Cat Donations',
            locale: 'en-US',
            landing_page: 'NO_PREFERENCE',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
          }
        }
      }
    };

    request.requestBody(orderData);

    // Execute request
    const order = await client().execute(request);
    
    // Store donation details
    const donationId = order.result.id;
    donations.set(donationId, {
      id: donationId,
      amount: parseFloat(amount),
      currency,
      frequency,
      donorInfo,
      paymentMethod: 'card',
      status: 'CREATED',
      createdAt: new Date().toISOString()
    });

    console.log(`💳 Direct card payment order created: ${donationId} for $${amount}`);
    
    res.json({
      id: order.result.id,
      status: order.result.status
    });

  } catch (error) {
    console.error('❌ Error creating card payment order:', error);
    res.status(500).json({ 
      error: 'Failed to create card payment order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Create PayPal order (handles both credit cards and PayPal accounts)
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', frequency, donorInfo } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!donorInfo || !donorInfo.email) {
      return res.status(400).json({ error: 'Donor information required' });
    }

    // Create order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: uuidv4(),
        description: frequency === 'monthly' 
          ? `Monthly donation to Paws Hope - Saving Cats Worldwide` 
          : `One-time donation to Paws Hope - Saving Cats Worldwide`,
        amount: {
          currency_code: currency,
          value: amount.toString()
        },
        payee: {
          email_address: 'pawshope@example.com' // Replace with your actual PayPal business email
        }
      }],
      application_context: {
        brand_name: 'Paws Hope - Cat Donations',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        payment_method_preference: 'UNRESTRICTED',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${req.protocol}://${req.get('host')}/api/paypal/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/api/paypal/cancel`
      }
    };

    request.requestBody(orderData);

    // Execute request
    const order = await client().execute(request);
    
    // Store donation details
    const donationId = order.result.id;
    donations.set(donationId, {
      id: donationId,
      amount: parseFloat(amount),
      currency,
      frequency,
      donorInfo,
      status: 'CREATED',
      createdAt: new Date().toISOString()
    });

    console.log(`✅ PayPal order created: ${donationId} for $${amount}`);
    
    res.json({
      id: order.result.id,
      status: order.result.status,
      links: order.result.links
    });

  } catch (error) {
    console.error('❌ Error creating PayPal order:', error);
    res.status(500).json({ 
      error: 'Failed to create PayPal order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Capture PayPal order
 */
router.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    // Execute capture
    const capture = await client().execute(request);
    
    // Update donation status
    if (donations.has(orderID)) {
      const donation = donations.get(orderID);
      donation.status = 'COMPLETED';
      donation.capturedAt = new Date().toISOString();
      donation.paypalTransactionId = capture.result.purchase_units[0].payments.captures[0].id;
      
      // Check for exclusive donor benefits
      if (donation.amount >= 50) {
        donation.exclusiveDonor = true;
        console.log(`🌟 Exclusive donor benefits activated for ${donation.donorInfo.firstName || 'Anonymous'} - $${donation.amount}`);
        console.log(`📧 Will send special updates, photos, and impact reports to ${donation.donorInfo.email}`);
      }
      
      donations.set(orderID, donation);
      
      console.log(`💰 Donation captured successfully: ${orderID} - $${donation.amount}`);
      console.log(`🐱 Thank you ${donation.donorInfo.firstName || 'Anonymous'} for helping cats!`);
    }

    res.json({
      id: capture.result.id,
      status: capture.result.status,
      purchase_units: capture.result.purchase_units,
      payer: capture.result.payer
    });

  } catch (error) {
    console.error('❌ Error capturing PayPal order:', error);
    res.status(500).json({ 
      error: 'Failed to capture PayPal order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get donation details
 */
router.get('/donation/:id', (req, res) => {
  const { id } = req.params;
  
  if (!donations.has(id)) {
    return res.status(404).json({ error: 'Donation not found' });
  }
  
  const donation = donations.get(id);
  res.json(donation);
});

/**
 * Get all donations (for admin purposes)
 */
router.get('/donations', (req, res) => {
  const allDonations = Array.from(donations.values());
  const totalAmount = allDonations.reduce((sum, donation) => {
    return donation.status === 'COMPLETED' ? sum + donation.amount : sum;
  }, 0);
  
  res.json({
    donations: allDonations,
    summary: {
      total: allDonations.length,
      completed: allDonations.filter(d => d.status === 'COMPLETED').length,
      totalAmount: totalAmount,
      currency: 'USD'
    }
  });
});

/**
 * Success redirect (for PayPal redirects)
 */
router.get('/success', (req, res) => {
  const { token } = req.query;
  res.redirect(`/?payment=success&token=${token}`);
});

/**
 * Cancel redirect (for PayPal redirects)
 */
router.get('/cancel', (req, res) => {
  const { token } = req.query;
  res.redirect(`/?payment=cancelled&token=${token}`);
});

/**
 * Webhook endpoint for PayPal notifications (future enhancement)
 */
router.post('/webhook', (req, res) => {
  console.log('📨 PayPal webhook received:', req.body);
  // Handle webhook events here
  res.status(200).json({ received: true });
});

/**
 * Get PayPal client ID for frontend
 */
router.get('/config', (req, res) => {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID,
    mode: process.env.PAYPAL_MODE
  });
});

module.exports = router; 