# Achievement Tracker

Multiplatform (web + Android) video game achievement tracker. Final degree project (TFG) for the Higher Vocational Diploma in Multiplatform Application Development (DAM), repository name `ProyectoFinalDAM`.

**Live demo:** https://achievementtracker-klie.onrender.com

## About the project

Users register ("mark") the achievements they complete in the different games stored in the Firebase database, manage their own game library, earn badges for different unlocks and compete with friends. The same product is available as an Angular web application and as a native Android application built in Java.

The Angular app is organised by components: a welcome screen and login, followed by the main area, where a navigation bar embeds each section in the rest of the available screen. SCSS is used mainly for custom colours, animations and the few places where exact measurements are required.

## Features

- **Achievement tracking:** mark achievements as completed per game, with per-achievement notes.
- **Game library:** manage your games and see your progress in each one.
- **Progression:** badges for different unlocks, plus an XP and level system.
- **Challenges:** challenge system between users.
- **Social:** friends, user profiles, comparison between users, ranking and real-time chat.
- **Notifications:** toast notifications for the relevant events.
- **UX:** onboarding modal, custom 404 page and route transition animations.
- **Security:** protected routes using a role guard (`roleGuard`) backed by `AuthService`.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Web frontend | Angular (standalone components, signals), `@angular/fire`, Bootstrap, SCSS, TypeScript |
| Android | Native app in Java |
| Backend | Node.js with TypeScript, Steam Web API integration |
| Database | Firebase Realtime Database |

## Deployment

The backend is deployed on [Render](https://render.com) and starts automatically when it receives a request, so the first request after a period of inactivity may take longer to respond. Only the site administrators make requests to it.

## Getting started (web)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 19.2.19.

Install the dependencies:

```bash
npm install
```

Start a local development server:

```bash
ng serve
```

Open `http://localhost:4200/` in your browser. The application reloads automatically when you change any source file.

## Build

```bash
ng build
```

The build artifacts are stored in the `dist/` directory. By default, the production build is optimised for performance and speed.

## Tests

Unit tests run with [Karma](https://karma-runner.github.io):

```bash
ng test
```

Usability was also validated through hallway testing with three real users.

## Additional resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
