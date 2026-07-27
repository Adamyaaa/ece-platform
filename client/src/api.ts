import axios from 'axios';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { API_URL } from './config';
import { auth } from './firebaseConfig';

// Shared axios instance that attaches the current Firebase ID token to every
// request. getIdToken() auto-refreshes the token if it's expired, so callers
// never need to manage refresh themselves.
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

interface SyncedUser {
  _id: string;
  username: string;
  email: string;
  profilePicture: string;
  solvedProblems: string[];
}

// Called right after a successful Google/GitHub sign-in to find-or-create the
// matching Mongo user record and persist it for the rest of the app to read
// from localStorage. The backend derives identity from the ID token itself
// (attached automatically by the interceptor above via auth.currentUser),
// not from anything passed in the body.
export async function syncFirebaseUser(firebaseUser: FirebaseAuthUser): Promise<SyncedUser> {
  const response = await api.post('/api/google-login', {
    username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || `User_${firebaseUser.uid.slice(-6)}`,
  });

  const user: SyncedUser = response.data.user;

  localStorage.setItem('userId', user._id);
  localStorage.setItem('username', user.username);
  localStorage.setItem('profilePicture', firebaseUser.photoURL || user.profilePicture || '');

  return user;
}
