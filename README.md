# 🎧 PULSE FM - Professional Radio Broadcasting Platform

A modern, full-featured radio broadcasting platform built for professional DJs, presenters, and radio stations. Stream live audio, manage shows, interact with listeners, and broadcast with professional-grade tools.

## ✨ Features

### 🎛️ Professional DJ Mixer
- **Dual Deck System** with independent audio controls
- **Real-time Crossfading** with multiple curve types
- **3-Band EQ** with kill switches and visual frequency display
- **Professional Effects Rack** (Reverb, Delay, Filter, Flanger)
- **Beat Sync & BPM Matching** with automatic detection
- **Cue Point System** with unlimited markers and custom labels
- **Advanced Looping** with manual and auto beat loops
- **Waveform Visualization** with real-time analysis

### 📻 Live Broadcasting
- **Real-time Live Show Management** with database-driven content
- **Hardware Mixer Integration** with MIDI control support
- **Real-time Microphone Control** for live voice-overs
- **Automated Playlist Management** with seamless transitions
- **Emergency Override System** for critical announcements
- **Professional Audio Routing** with Web Audio API

### 👥 User Management
- **Role-Based Access Control** (Admin, DJ, Presenter, Moderator, Listener)
- **Automatic Dashboard Routing** based on user roles
- **Secure Authentication** with Supabase integration
- **Profile Management** with custom display names and social links
- **Real User Data** - All DJs, Presenters, and content from database

### 💬 Real-Time Features
- **Live Chat System** for listener interaction (real messages only)
- **Geolocation-Based Analytics** with world map visualization
- **Real-Time Listener Statistics** by country and region
- **Live Status Indicators** showing actual broadcast state
- **Push Notifications** for important updates

### 📱 Modern Web Experience
- **Progressive Web App (PWA)** with offline capabilities
- **Responsive Design** optimized for all devices
- **Dark/Light Theme Support** with system preference detection
- **Touch-Friendly Controls** for mobile DJing
- **Fast Loading** with optimized assets and caching

### 🎯 Real Data Integration
- **Show Management** - Create, edit, and schedule shows through dashboard
- **Blog System** - Real blog posts with categories and image upload
- **DJ/Presenter Profiles** - Real user profiles with social links and bios
- **Featured Shows** - Database-driven featured content
- **Image Upload** - Supabase storage integration for all media

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account for backend services

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pulse-fm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Run the migrations in your Supabase SQL Editor
2. The migrations will create all necessary tables and policies
3. Assign user roles through the admin dashboard
4. Create shows, blog posts, and content through the dashboards

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui for consistent, accessible components
- **Backend**: Supabase for authentication, database, and real-time features
- **Audio Processing**: Web Audio API for professional audio manipulation
- **State Management**: React hooks with custom context providers
- **Routing**: React Router for client-side navigation
- **Storage**: Supabase Storage for image uploads

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── DJ*/            # Professional DJ mixer components
│   ├── Blog*/          # Blog management components
│   ├── Show*/          # Show management components
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
├── pages/              # Route components (dashboards)
├── integrations/       # External service integrations
└── lib/               # Utility functions and configurations
```

## 🎯 User Roles & Permissions

### Admin
- Full system access and emergency override
- User management and role assignment
- Analytics and system monitoring
- Content moderation capabilities
- Blog management and publishing

### DJ
- Professional mixer with full audio controls
- Show creation and management with image upload
- Music library management
- Live broadcasting with hardware integration
- Show scheduling and management

### Presenter
- Microphone control for voice segments
- Show creation and hosting capabilities
- Jingle triggering and sound effects
- Live chat interaction with listeners
- Show hosting and audience engagement

### Listener
- Live audio streaming with high-quality playback
- Real-time chat participation
- Show favorites and notifications
- Mobile-optimized listening experience

## 📊 Content Management

### Shows
- Create shows through DJ/Presenter dashboards
- Upload show artwork and descriptions
- Set genres and scheduling
- Mark shows as featured
- Real-time live show management

### Blog Posts
- Create and publish blog posts through admin dashboard
- Upload featured images
- Organize with categories
- Rich text content management

### User Profiles
- Real DJ and Presenter profiles
- Social media links integration
- Bio and avatar management
- Role-based display

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production Deployment

The application can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **AWS S3 + CloudFront**: Upload build files to S3 bucket
- **Firebase Hosting**: Use Firebase CLI for deployment

### Environment Variables for Production
Ensure all environment variables are properly configured in your hosting platform.

## 🔧 Configuration

### Audio Settings
- Supported formats: MP3, WAV, OGG, M4A, FLAC
- Sample rates: 44.1kHz, 48kHz recommended
- Bit depth: 16-bit, 24-bit supported

### Broadcasting Setup
- Configure Supabase real-time subscriptions
- Set up proper CORS policies for audio streaming
- Enable WebRTC for low-latency audio processing
- Configure image upload storage buckets

## 📊 Analytics & Monitoring

- Real-time listener statistics with geographic breakdown
- Broadcasting session logs and analytics
- User engagement metrics and chat activity
- Performance monitoring with error tracking

## 🔒 Security Features

- Secure authentication with Supabase Auth
- Role-based access control (RBAC)
- Input validation and sanitization
- HTTPS enforcement for all communications
- Content Security Policy (CSP) headers
- Row Level Security (RLS) for database access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎵 About PULSE FM

PULSE FM is designed for modern radio broadcasting, combining traditional DJ techniques with cutting-edge web technology. Whether you're running a community radio station, hosting online shows, or creating podcast content, PULSE FM provides the professional tools you need.

**Built for broadcasters, by broadcasters.** 🎧📻

## 🔄 Real Data Flow

- **Homepage**: Shows real featured shows, DJs, and blog posts from database
- **Dashboards**: Create and manage real content that appears immediately
- **Live Status**: Only shows live when broadcasts are actually active
- **Chat**: Real-time messages from authenticated users only
- **No Hardcoded Content**: All content comes from the database
