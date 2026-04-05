# FocusForge - Gamified Daily Planner & Focus Assistant

## Design Guidelines (Notion Theme)

### Color Palette (Notion-inspired minimal grayscale)
- Background: hsl(0 0% 97%) light / hsl(0 0% 10%) dark
- Card: hsl(0 0% 100%) light / hsl(0 0% 14%) dark
- Primary: hsl(0 0% 20%) light / hsl(0 0% 85%) dark
- Accent: hsl(0 0% 94%) light / hsl(0 0% 20%) dark
- Muted: hsl(0 0% 92%) light / hsl(0 0% 18%) dark
- Border: hsl(0 0% 88%) light / hsl(0 0% 25%) dark

### Typography
- Font Sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif
- Font Serif: Georgia, 'Times New Roman', serif
- Font Mono: SFMono-Regular, Menlo, Monaco, Consolas, monospace

### Key Component Styles
- Cards: Clean white/dark cards with subtle shadow, 0.5rem border-radius
- Buttons: Primary dark bg with white text, clean and minimal
- Progress bars: Smooth animated fills
- Bottom nav: Fixed bottom bar with icon + label, thumb-friendly

### Images to Generate
1. **hero-tree-stage1.jpg** - A small green sprout/seedling in a minimal pot, clean white background, simple illustration style
2. **hero-tree-stage2.jpg** - A medium growing tree with green leaves, minimal illustration, clean background
3. **hero-tree-stage3.jpg** - A full lush tree with rich foliage, minimal illustration style, clean background
4. **hero-tree-stage4.jpg** - A magnificent large tree with golden/glowing leaves, achievement feel, minimal illustration

---

## Database Tables

### tasks (create_only=true, user-specific)
- id: integer (auto-increment)
- user_id: string
- title: string
- description: string
- priority: string (low/medium/high)
- category: string
- status: string (pending/completed/deleted)
- xp_reward: integer
- energy_cost: integer
- order_index: integer
- due_date: string
- completed_at: string
- created_at: string (datetime)

### user_profiles (create_only=true, user-specific)
- id: integer (auto-increment)
- user_id: string
- display_name: string
- avatar: string
- level: integer
- xp: integer
- total_xp: integer
- energy: integer
- max_energy: integer
- streak: integer
- best_streak: integer
- streak_freezes: integer
- personality_mode: string (chill/strict/funny)
- mood: string (lazy/productive/overwhelmed)
- tree_stage: integer
- tasks_completed: integer
- focus_minutes: integer
- created_at: string (datetime)

---

## Development Files (8 files max)

1. **src/index.css** - Notion theme CSS variables (light + dark)
2. **src/App.tsx** - Router with all pages + AuthProvider
3. **src/contexts/AuthContext.tsx** - Auth context with user state management
4. **src/pages/Index.tsx** - Dashboard/Home: XP bar, streak, energy, tree, today's tasks
5. **src/pages/TasksPage.tsx** - Task manager: CRUD, priority, categories, swipe gestures
6. **src/pages/FocusPage.tsx** - Focus mode: Pomodoro timer, current task, ambient sounds
7. **src/pages/StatsPage.tsx** - Progress dashboard: XP history, streaks, completion stats
8. **src/pages/ProfilePage.tsx** - Profile: avatar, personality mode, mood, settings