# 🔗 Links & DM - The Ultimate Link-in-Bio for Creators

The complete link management and smart messaging solution for influencers, creators, and professionals. Manage all your links, social handles, contact info, and incoming messages in one beautiful, customizable interface.

## ✨ Features

### 📱 4 Beautiful Pages
- **Landing Page** - Hero section showcasing all features
- **Profile Editor** - Customize everything about your profile
- **Live Preview** - See exactly how your profile looks
- **Message Inbox** - Receive and manage all incoming messages

### 🎨 Design & Customization
- **12 Gorgeous Gradient Themes** - Choose your perfect vibe
- **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- **Beautiful UI** - Built with Tailwind CSS
- **Smooth Animations** - Professional interactions throughout

### 💬 Smart DM System
- **Book a Meeting** - Direct scheduling button
- **Let's Connect** - Quick connection requests
- **Collab Request** - Partnership inquiries
- **Support a Cause** - Charity/cause promotion
- **Priority Contacts** - Star your VIPs and close friends
- **Real-time Filtering** - Filter by message type, sender, or priority
- **Auto-Save Messages** - Messages save instantly

### 🌐 Social & Contact Integration
- **15+ Social Platforms** - Instagram, TikTok, Twitter, LinkedIn, YouTube, Discord, Twitch, and more
- **Email Hub** - Unlimited email addresses
- **Contact Numbers** - Up to 5 phone numbers
- **Website Links** - Add your store, blog, or website
- **Portfolio Showcase** - Link to your portfolio
- **Projects Gallery** - Showcase up to 5 projects

### 💾 Data Management
- **LocalStorage** - Instant local saving
- **Firebase Integration** - Cloud backup and real-time sync
- **Cross-Browser Sync** - Updates sync across all browsers
- **Persistent Storage** - Your data is never lost

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/links-and-dm.git
cd links-and-dm
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

4. **Open your browser**
```
http://localhost:3000
```

### Build for Production
```bash
npm run build
```

## 📦 Tech Stack

- **Frontend Framework**: React 18.2.0
- **CSS Framework**: Tailwind CSS 3.3.6
- **Backend/Database**: Firebase 10.7.0
- **Build Tool**: React Scripts 5.0.1
- **CSS Processing**: PostCSS 8.4.31

## 🔧 Configuration

### Firebase Setup

Your Firebase project is already configured:
- **Project ID**: links-dm-pro
- **Database**: Realtime Database
- **Config**: Embedded in LinksAndDM.jsx

Messages automatically save to Firebase and sync in real-time.

### Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

The Firebase credentials are already included.

## 📁 Project Structure
```
links-and-dm/
├── public/
│   └── index.html              # Main HTML file
├── src/
│   ├── App.js                  # App wrapper
│   ├── index.js                # React entry point
│   ├── index.css               # Global styles with Tailwind
│   └── LinksAndDM.jsx          # Main component (all features)
├── .env.example                # Environment variables template
├── .gitignore                  # Git configuration
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind CSS config
└── postcss.config.js           # PostCSS config
```

## 📖 Usage Guide

### Profile Setup

1. Click the **Profile section**
2. **Upload your photo** by clicking the camera icon
3. **Enter your name** and profession
4. **Write your bio** (up to 200 characters)
5. **Choose a theme** from the 12 options

### Add Social Handles

1. Click **"+ Add Handle"**
2. Select platform (Instagram, TikTok, Twitter, etc.)
3. Enter your handle
4. Save automatically

### Manage Contact Info

- **Email**: Add unlimited email addresses
- **Phone**: Add up to 5 phone numbers
- **Website**: Link to your store or main website
- **Portfolio**: Showcase your work
- **Projects**: List up to 5 projects

### Set Priority Contacts

1. Go to **"Friends & Family"** section
2. **Add contact handles** (e.g., @username or email)
3. Messages from these contacts automatically star as ⭐
4. They appear first in your inbox

### Message Management

- **Send Messages**: Click any DM button to open form
- **Filter Messages**: Use tabs to filter by type
- **Star Important**: Click ☆ to mark as important
- **View Details**: Click any message to see full content

## 🎨 Customization

### Change Colors/Themes

Edit `src/LinksAndDM.jsx`:
```javascript
const themes = [
  { 
    name: 'Your Theme', 
    gradient: 'linear-gradient(135deg, #FF0000 0%, #00FF00 100%)' 
  },
  // Add more themes...
];
```

### Change Button Labels

In the Profile Editor, click any button label to edit it directly.

### Add New Social Platforms

Edit the `getSocialMediaUrl()` function in `LinksAndDM.jsx`:
```javascript
const platformUrls = {
  'YourPlatform': `https://yourplatform.com/${cleanHandle}`,
  // ...
};
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Click "New Project"
   - Select your repository
   - Click "Deploy"

3. **Your app is live!** 🎉

### Deploy to Netlify

1. **Connect GitHub** at https://netlify.com
2. **Select your repository**
3. Leave build settings as default
4. **Click Deploy**

### Deploy to Firebase Hosting
```bash
npm run build
npm install -g firebase-tools
firebase login
firebase deploy
```

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## 🐛 Troubleshooting

### "npm: command not found"
Install Node.js from https://nodejs.org

### "Port 3000 already in use"
```bash
npm start -- --port 3001
```

### "Tailwind styles not showing"
Make sure `src/index.css` contains:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### "Firebase not saving messages"
Check that your database has read/write permissions enabled.

## 📝 Features Coming Soon

- [ ] User authentication
- [ ] Multiple profiles
- [ ] Custom domains
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Social media auto-posting

## 📄 License

This project is open source and available under the MIT License.

## 🙋 Support

For questions or issues:
1. Check the documentation in this README
2. Open an issue on GitHub
3. Check the existing issues and discussions

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💖 Acknowledgments

Built with ❤️ for creators, influencers, and professionals everywhere.

Special thanks to:
- React team for the amazing framework
- Tailwind CSS for beautiful styling
- Firebase for real-time database

## 📞 Connect

- **Twitter**: [@YourHandle](https://twitter.com)
- **Email**: your@email.com
- **Website**: https://yourwebsite.com

---

**Made with 💎 for creators everywhere**

**Start building your Links & DM profile today!** 🚀
