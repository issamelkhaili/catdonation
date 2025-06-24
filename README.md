# Paws Hope - Cat Donation Website with PayPal Integration

A complete donation website for cat rescue organization with PayPal payment processing.

## Features

🐱 **Complete Cat Donation Platform**
- Beautiful responsive design
- Multiple donation amounts ($25, $50, $100, custom)
- One-time and monthly donation options
- **💳 Unified Payment Processing** - Credit cards AND PayPal accounts
- Secure payment processing through PayPal
- Accepts Visa, Mastercard, American Express, and PayPal accounts
- Real-time payment processing
- Mobile-friendly interface

💳 **Payment Processing**
- **Unified Checkout** - One interface for both credit cards and PayPal accounts
- PayPal-powered secure payment processing
- PayPal Sandbox integration for testing
- PCI-compliant payment handling
- Order creation and capture
- Payment status tracking
- Success/failure notifications
- Support for all major credit cards and PayPal balances

🔧 **Technical Features**
- Node.js/Express backend
- PayPal REST API integration
- CORS enabled for development
- Security headers with Helmet
- Request logging with Morgan
- Error handling middleware

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PayPal Developer Account (sandbox)

### Installation

1. **Clone and setup**
   ```bash
   cd catdonate
   npm install
   ```

2. **Environment Configuration**
   The `.env` file is already configured with sandbox credentials:
   ```
   PAYPAL_CLIENT_ID=AX6VEN59nYYZuh_SOdd8wM2N1LPJujPZHypGJv8NVymYIfpu1bA6EPUwM9GK3WJvmyrmDrcTp1kePiHB
   PAYPAL_CLIENT_SECRET=ENaAJhrkkFj9N9kcPSHJuc8eYiySGFRByAN9WtCbMWByFSKiJPmQl7yNszkVyqEPQO4WsIwRgtY4i7tn
   PAYPAL_MODE=sandbox
   PORT=3000
   NODE_ENV=development
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the website**
   Open your browser and go to: `http://localhost:3000`

## How to Test Donations

### Testing with PayPal Sandbox

1. **Make a donation:**
   - Visit `http://localhost:3000`
   - Scroll to the donation section
   - Select an amount or enter a custom amount
   - Fill in your information
   - Click "Donate" - you'll be redirected to PayPal's secure checkout

2. **Testing Payment Methods:**
   
   **Option A: Credit Card (No PayPal account needed):**
   - On PayPal checkout page, click "Pay with Debit or Credit Card"
   - Use test card numbers:
     - **Visa:** `4111111111111111`
     - **Mastercard:** `5555555555554444`
     - **Expiry:** Any future date (e.g., `12/25`)
     - **CVV:** Any 3 digits (e.g., `123`)
   
   **Option B: PayPal Account:**
   - On PayPal checkout page, click "Log in to PayPal"
   - Use test account:
     - **Email:** `sb-buyer@business.example.com`
     - **Password:** `testpass123`
   
   **Or create your own test account at:**
   - https://developer.paypal.com/developer/accounts/

3. **Complete the payment:**
   - Choose your preferred payment method on PayPal's checkout page
   - Complete the payment and you'll be redirected back with success confirmation

## API Endpoints

### PayPal Routes (`/api/paypal/`)

- `POST /create-order` - Create PayPal order (handles both cards and PayPal accounts)
- `POST /capture-order` - Capture a completed payment
- `GET /donations` - Get all donations (admin)
- `GET /donation/:id` - Get specific donation details
- `GET /config` - Get PayPal configuration
- `GET /success` - PayPal success redirect
- `GET /cancel` - PayPal cancel redirect

### Health Check
- `GET /api/health` - Server health status

## File Structure

```
catdonate/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
├── index.html             # Main website
├── routes/
│   └── paypal.js         # PayPal API routes
├── js/
│   └── donation.js       # Frontend donation logic
└── README.md             # This file
```

## Development

### Start development server with auto-reload:
```bash
npm run dev
```

### View server logs:
The server provides detailed logging including:
- PayPal order creation
- Payment captures
- Donation tracking
- Error handling

### Testing different amounts:
- $25 - Basic donation
- $50 - Unlocks exclusive donor benefits
- $100 - Complete rescue package
- Custom amounts are supported

## Production Deployment

### For production use:

1. **Update PayPal credentials:**
   - Get live PayPal app credentials
   - Update `.env` file:
     ```
     PAYPAL_MODE=production
     PAYPAL_CLIENT_ID=your_live_client_id
     PAYPAL_CLIENT_SECRET=your_live_client_secret
     ```

2. **Security considerations:**
   - Use HTTPS in production
   - Set up proper CORS origins
   - Configure firewall rules
   - Use a process manager (PM2)
   - Set up monitoring and logging

3. **Database integration:**
   - Replace in-memory storage with database
   - Add donor management system
   - Implement donation reporting

## Troubleshooting

### Common Issues:

1. **"Payment failed" error:**
   - Check PayPal credentials in `.env`
   - Verify network connectivity
   - Check server logs for details

2. **"Failed to load payment system":**
   - Ensure server is running
   - Check browser console for errors
   - Verify API endpoints are accessible

3. **Donation button not working:**
   - Make sure amount is selected
   - Verify email address is entered
   - Check browser console for JavaScript errors

### Debug Mode:
Set `NODE_ENV=development` in `.env` for detailed error messages.

## Support

For support with:
- PayPal integration: https://developer.paypal.com/docs/
- General issues: Check server logs and browser console

## License

This project is licensed under the MIT License.

---

🐱 **Built with love for cats worldwide!** 💖 