
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

### User Registration & Authentication Flow
1. User arrives at the landing page
2. User clicks "Sign Up" or "Log In" button
3. For new users:
   - The signup form appears with fields for email and password
   - User completes the form and submits it
   - System validates the input and creates a new account
   - User is redirected to the dashboard
4. For returning users:
   - The login form appears with fields for email and password
   - User enters credentials and submits
   - System authenticates the user
   - User is redirected to their dashboard
5. For logged-in users returning to the site:
   - System automatically detects the active session
   - User is directed straight to their dashboard

### Dashboard Navigation Flow
1. After authentication, user lands on the dashboard
2. Dashboard displays:
   - Welcome message with username
   - Statistics on created quizzes and responses
   - List of quizzes created by the user
   - Quick actions buttons (Create Quiz, View Analytics)
3. User can:
   - Click on a quiz card to view its analytics
   - Click "Create Quiz" to start creating a new quiz
   - Access profile settings via the user avatar in the navigation
   - Log out via the user menu

### Quiz Creation Flow
1. User clicks "Create Quiz" button from the dashboard
2. User enters a name for the quiz and continues
3. Question selection process begins:
   - System displays 3 questions at a time from the available question bank
   - User selects a question they want to include in their quiz
   - After selecting, user is prompted to arrange answer priorities
   - User drags and drops options to set which answers are worth more "aura points"
   - Process repeats until 3 questions have been selected and prioritized
4. User reviews the final quiz configuration
5. System generates a unique shareable link for the quiz
6. User is presented with sharing options and can:
   - Copy the link to clipboard
   - Share directly to social media platforms
   - Return to dashboard

### Taking a Quiz Flow
1. User receives and opens a quiz link
2. Welcome screen appears showing:
   - Quiz creator's name
   - Brief explanation of the quiz
   - Instructions for completion
3. User clicks "Start Quiz" button
4. For each question:
   - Question appears with multiple-choice options
   - User selects their answer
   - User proceeds to the next question
5. After answering the last question, user submits the quiz
6. System calculates the aura score based on:
   - Selected answers
   - Creator's priority settings for those answers
7. Results screen appears with:
   - Visual representation of the user's aura
   - Numerical score and interpretation
   - Option to share results on social media
   - Button to return to landing page or take another quiz

### Quiz Analytics Review Flow
1. Quiz creator navigates to their quiz from the dashboard
2. Analytics overview page loads with:
   - Total response count
   - Visual chart of aura distributions
   - Engagement metrics over time
   - Response timeline
3. User scrolls to see detailed question breakdown:
   - Distribution of answers for each question
   - Correlation between questions and final aura scores
4. Admin controls section allows the creator to:
   - Share the quiz link again
   - Delete individual responses
   - Delete the entire quiz
   - Adjust quiz settings

### Admin Question Management Flow
1. Admin user navigates to the Admin Panel
2. Admin selects between "Fixed Questions" or "Custom Questions" tabs
3. For adding questions:
   - Admin clicks "Add Fixed/Custom Question" button
   - Form opens with fields for question text and options
   - Admin fills out the form and saves the question
   - New question appears in the list
4. For updating questions:
   - Admin clicks edit icon next to a question
   - Form opens with pre-populated question data
   - Admin makes changes and saves
   - Updated question replaces the old one in the list
5. For deactivating questions:
   - Admin clicks delete icon next to a question
   - Confirmation dialog appears
   - After confirmation, question is marked inactive
   - Question disappears from the active list
6. For reactivating questions:
   - Admin toggles "Show Deactivated" switch
   - List shows previously deactivated questions
   - Admin clicks reactivate icon next to a question
   - Question appears back in the active list

### Profile Management Flow
1. User clicks on their avatar in the navigation bar
2. User selects "Profile Settings" from the dropdown
3. Profile edit page loads with:
   - Username field
   - Avatar upload option
   - Account settings
4. User makes desired changes
5. System validates changes in real-time
6. User saves changes and receives confirmation
7. Updated profile is reflected across the application

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
