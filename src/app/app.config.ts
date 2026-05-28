import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideHttpClient(),
  provideRouter(routes, withComponentInputBinding()),
  provideFirebaseApp(() => initializeApp({
    projectId: "achievementtracker-43a72",
    appId: "1:224724015636:web:ee7fb7643d8bbccd27e501",
    databaseURL: "https://achievementtracker-43a72-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "achievementtracker-43a72.firebasestorage.app",
    apiKey: "AIzaSyAsvco7urD0AruE2lhp0D6pYw4kNSc1kcg",
    authDomain: "achievementtracker-43a72.firebaseapp.com",
    messagingSenderId: "224724015636"})),
  provideAuth(() => getAuth()), provideDatabase(() => getDatabase())]
};
