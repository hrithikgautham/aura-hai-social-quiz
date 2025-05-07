
# Aura Hai - Social Aura Discovery Platform

![Aura Hai Banner](https://lovable.dev/projects/6663656f-be8b-4e41-b170-ccd83ec13403/banner.png)

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [User Flows](#user-flows)
- [Design System](#design-system)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Development](#development)
- [Deployment](#deployment)

## 📌 Overview

Aura Hai is a social discovery platform that allows users to create personalized quizzes to measure their friends' "auras" - a representation of personality and connection between individuals. Users can create custom quizzes, share them with friends, and analyze the results to discover insights about their social connections.

### Target Audience

- Social media users aged 16-35
- Friend groups wanting to explore their connections
- Anyone interested in personality insights and social metrics

## 🚀 Core Features

### Quiz Creation
- Create personalized quizzes with custom questions
- Choose from fixed or custom question banks
- Arrange answer priorities to affect aura calculations
- Share quizzes with a unique link

### Quiz Taking
- Take quizzes through shareable links
- Answer multiple choice or numeric questions
- See immediate results after completion
- Share results on social media

### Analytics
- View detailed quiz response analytics
- See aura point distributions
- Analyze response patterns over time
- Track engagement metrics

### User Management
- User registration and authentication
- Profile management
- Quiz history tracking
- Response history

## 💻 Technology Stack

### Frontend
- **React 18** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **TanStack Query** - Data fetching and state management
- **Canvas Confetti** - Visual celebrations
- **React Hook Form** - Form validation and handling

### Backend
- **Supabase** - Backend-as-a-Service
  - Authentication
  - PostgreSQL Database
  - Storage
  - Real-time subscriptions

## 🏗 Architecture

The application follows a client-side rendering architecture with React as the view layer and Supabase handling backend services.

### Component Structure
- **Layout Components** - Page layouts, navigation
- **UI Components** - Reusable UI elements
- **Feature Components** - Quiz, analytics, auth components
- **Page Components** - Route-level components

### State Management
- React Query for server state
- React Context for global app state (auth, theme)
- Local component state for UI interactions

## 🧭 User Flows

### User Registration & Login
1. User visits the landing page
2. User selects "Sign Up" or "Log In"
3. User completes authentication form
4. User is redirected to dashboard upon success

### Quiz Creation
1. User navigates to "Create Quiz" from dashboard
2. User enters quiz name
3. User selects 3 questions from the available question banks
   - Shows 3 questions at a time
   - After selecting a question, user sets answer priorities
   - Process repeats until 3 questions are selected
4. User receives shareable quiz link

### Taking a Quiz
1. User opens quiz link
2. User views welcome screen with creator's name and quiz rules
3. User proceeds through quiz questions
4. User submits answers
5. User views their aura results
6. User can share results or return to landing page

### Analytics Review
1. User navigates to quiz summary from dashboard
2. User views response count, aura distributions
3. User can analyze question breakdown and response patterns
4. User can share quiz or delete responses

## 🎨 Design System

### Colors
- **Primary Gradient**: `from-[#FF007F] to-[#00DDEB]` - Used for interactive elements
- **Background Gradient**: `from-[#FFE29F] via-[#FFA99F] to-[#FF719A]` - Used for page backgrounds
- **Accent Colors**:
  - Primary Pink: `#FF007F`
  - Primary Teal: `#00DDEB`
  - Primary Yellow: `#FFD700`

### Typography
- **Headings**: Modern sans-serif with gradient text effects
- **Body**: Clean, readable sans-serif
- **Font Weights**: 
  - Bold (700) for headings
  - Medium (500) for subheadings
  - Regular (400) for body text

### Components
- **Cards**: White backgrounds with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Inputs**: Clean, minimal design with clear focus states
- **Icons**: Lucide icons for consistent visual language

### Animations
- Subtle hover effects on interactive elements
- Confetti celebrations for quiz completion
- Smooth transitions between states

## 📊 Database Schema

### Tables

#### Users
- `id`: UUID (from Supabase Auth)
- `username`: STRING
- `avatar_url`: STRING
- `created_at`: TIMESTAMP

#### Quizzes
- `id`: UUID
- `name`: STRING
- `creator_id`: UUID (FK to Users)
- `shareable_link`: STRING
- `created_at`: TIMESTAMP

#### Questions
- `id`: UUID
- `text`: STRING
- `type`: ENUM ('mcq', 'number')
- `is_fixed`: BOOLEAN
- `active`: BOOLEAN
- `created_at`: TIMESTAMP

#### Quiz Questions
- `id`: UUID
- `quiz_id`: UUID (FK to Quizzes)
- `question_id`: UUID (FK to Questions)
- `order`: INTEGER
- `created_at`: TIMESTAMP

#### Options
- `id`: UUID
- `question_id`: UUID (FK to Questions)
- `text`: STRING
- `value`: INTEGER
- `order`: INTEGER
- `created_at`: TIMESTAMP

#### Responses
- `id`: UUID
- `quiz_id`: UUID (FK to Quizzes)
- `user_id`: UUID (optional, FK to Users)
- `respondent_name`: STRING
- `created_at`: TIMESTAMP

#### Answers
- `id`: UUID
- `response_id`: UUID (FK to Responses)
- `question_id`: UUID (FK to Questions)
- `selected_option_id`: UUID (FK to Options, for MCQs)
- `number_value`: INTEGER (for number questions)
- `created_at`: TIMESTAMP

## 🔐 Authentication

The application uses Supabase Authentication with:
- Email/password authentication
- OAuth providers (Google)
- Session management
- Protected routes

## 🛠 Development

### Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start development server:
   ```
   npm run dev
   ```

### Project Structure
```
src/
├── components/        # Reusable components
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components
│   ├── quiz/          # Quiz-related components
│   │   ├── analytics/ # Quiz analytics components
│   │   ├── answer/    # Quiz answering components
│   │   ├── create/    # Quiz creation components
│   └── ui/            # UI components (shadcn)
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── integrations/      # External service integrations
│   └── supabase/      # Supabase client and types
├── lib/               # Utility libraries
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🚢 Deployment

The application can be deployed using:
1. Vercel - Frontend deployment
2. Supabase - Backend services

### Steps
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy

## 🔗 Links

- [Live Application](https://lovable.dev/projects/6663656f-be8b-4e41-b170-ccd83ec13403)
- [GitHub Repository](https://github.com/your-username/aura-hai)
- [Issue Tracker](https://github.com/your-username/aura-hai/issues)

## 📄 License

MIT © Aura Hai Team

---

Built with ❤️ using [Lovable](https://lovable.dev)
