# Personal Finance Management App

A comprehensive personal finance management application with glassmorphism UI, AI-powered analysis, and Telegram bot integration.

## Features

### 🎨 Modern UI/UX
- **Enhanced Glassmorphism Design**: Beautiful glass-like UI elements with blur effects and aurora backgrounds
- **Aurora Backgrounds**: Animated gradient backgrounds (green aurora for light mode, solid black for dark mode)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile with optimized performance
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Custom Wallet Icons**: Upload custom images or use emojis for wallet icons
- **Dynamic Balance Colors**: Customizable color coding based on balance ranges

### 💰 Enhanced Financial Management
- **Smart Wallet System**: Custom wallet creation with image upload support
- **Transaction Tracking**: Add, edit, delete income and expense transactions with improved UX
- **Category Management**: Custom categories with color coding
- **Date Filtering**: View transactions by day, week, month, or custom ranges
- **Visual Analytics**: Interactive charts showing spending patterns and trends
- **Transfer System**: Seamless money transfers between wallets

### 🎭 Advanced Animations & Performance
- **Instant Hover Effects**: 0.1s transition for wallet cards with #00CCFF border highlight
- **Smooth Page Transitions**: No flicker when switching tabs
- **Performance Optimized**: `will-change: transform` for smooth animations
- **Mobile Optimized**: Reduced animations on mobile devices for better performance
- **Lazy Loading**: Optimized rendering for multiple wallets

### 🛠️ Custom Wallet Features
- **Custom Wallet Manager**: Create, edit, and delete custom wallets
- **Image Upload**: Support for JPG/PNG wallet icons (max 100x100px, 1MB limit)
- **Balance Alerts**: Customizable border effects based on balance thresholds
- **Color Coding**: Custom color ranges for different balance levels
- **Validation**: Prevent deletion of wallets with existing balance or transactions

### 🤖 AI-Powered Analysis
- **ChatGPT Integration**: AI-driven financial insights and recommendations
- **Smart Reports**: Automated analysis of spending patterns
- **Budget Advice**: Personalized suggestions for financial improvement
- **Trend Analysis**: Identify spending trends and savings opportunities

### 📱 Telegram Bot Integration
- **Automated Reports**: Daily, weekly, and monthly financial summaries
- **Debt Reminders**: Get notified 3 days before payment due dates
- **Real-time Notifications**: Instant updates on your financial status
- **Bot Commands**: Quick access to summaries and debt information

### 💳 Debt & Credit Management
- **Debt Tracking**: Monitor debts and credits with due dates
- **Payment Reminders**: Automated notifications for upcoming payments
- **Status Management**: Mark debts as paid and track payment history
- **Risk Assessment**: Visual indicators for overdue and urgent payments

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling with custom glassmorphism effects
- **Chart.js** for data visualization
- **Zustand** for state management
- **React Hook Form** for form handling
- **Custom Toast System** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **OpenAI API** for ChatGPT integration
- **Telegram Bot API** for notifications

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- OpenAI API key (for AI analysis)
- Telegram Bot Token (for notifications)

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/financeapp

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# Server Port
PORT=3001
```

### 3. Database Setup

Ensure MongoDB is running locally or provide a cloud MongoDB URI in the environment variables.

### 4. Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token and add it to `.env`
4. Set bot commands (optional):
   ```
   start - Welcome message and setup
   summary - Get financial summary
   debts - View upcoming debts
   help - Show help information
   ```

### 5. OpenAI API Setup

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add the key to your `.env` file

### 6. Run the Application

```bash
# Start the backend server
cd server
npm run dev

# In a new terminal, start the frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Custom Wallet Setup Guide

### Creating Custom Wallets

1. **Navigate to Settings**: Go to Settings > Dompet tab
2. **Add New Wallet**: Click "Tambah Dompet" button
3. **Fill Details**:
   - **Name**: Enter custom wallet name (e.g., "Tabungan Libur")
   - **Type**: Choose Bank, E-Wallet, or Custom
   - **Icon**: Upload image (JPG/PNG, max 1MB) or enter emoji
   - **Initial Balance**: Set starting balance (for new wallets only)

### Custom Icon Guidelines

- **Image Format**: JPG or PNG
- **Size**: Recommended 100x100px (will be auto-resized)
- **File Size**: Maximum 1MB
- **Alternative**: Use emoji characters (🏦, 💰, 💳, etc.)

### Balance Color Settings

1. **Go to Settings > Warna Saldo**
2. **Configure Ranges**:
   - Set minimum and maximum amounts
   - Choose colors for each range
   - Add descriptive labels
3. **Examples**:
   - Below Rp 50,000: Red (Saldo Rendah)
   - Rp 50,001 - Rp 500,000: Orange (Saldo Normal)
   - Above Rp 500,000: Green (Saldo Baik)

### Wallet Management Rules

- **Deletion**: Cannot delete wallets with existing balance
- **Transactions**: Cannot delete wallets with transaction history
- **Active Wallet**: Always maintains one active wallet selection
- **Custom Icons**: Persist across app sessions

## Performance Optimizations

### Animation Performance
- **Instant Hover**: 0.1s transitions for immediate feedback
- **Will-Change**: Applied to frequently animated elements
- **Mobile Optimization**: Reduced animations on mobile devices
- **GPU Acceleration**: Hardware acceleration for smooth transforms

### Loading Optimizations
- **Lazy Loading**: Images and wallet data loaded on demand
- **Debounced Updates**: Prevent excessive re-renders
- **Memoization**: Cached calculations for balance colors
- **Efficient Rendering**: Optimized component updates

### Browser Compatibility

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

The glassmorphism effects require modern browsers with backdrop-filter support.

## Testing Guidelines

### Hover Effect Testing
1. **Instant Response**: Hover over wallet cards should immediately show #00CCFF border
2. **Smooth Transition**: Border should fade back to transparent when hover ends
3. **Performance**: No lag or delay in hover effects

### Tab Switching Testing
1. **No Flicker**: Switching between tabs should be smooth without flash
2. **State Persistence**: Wallet selections should persist across tab switches
3. **Animation Continuity**: No interrupted animations when navigating

### Custom Wallet Testing
1. **Image Upload**: Test various image formats and sizes
2. **Icon Display**: Verify custom icons appear correctly in all contexts
3. **Balance Colors**: Test color changes with different balance amounts
4. **Performance**: Test with 10+ custom wallets for performance

### Mobile Responsiveness
1. **Touch Targets**: All buttons meet 44px minimum touch target
2. **Responsive Grid**: Wallet grid adapts to screen size
3. **Performance**: Smooth scrolling and interactions on mobile
4. **Animation Reduction**: Heavy animations disabled on mobile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation
- Review the code comments
- Test the Telegram bot integration
- Verify API configurations

## Roadmap

- [x] Enhanced glassmorphism design
- [x] Custom wallet management
- [x] Performance optimizations
- [x] Mobile responsiveness
- [ ] Mobile app (React Native)
- [ ] Bank account integration
- [ ] Investment tracking
- [ ] Advanced reporting
- [ ] Multi-currency support
- [ ] Export to Excel/PDF