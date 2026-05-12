import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Ensures the user is signed in anonymously to Firebase.
 * Returns the current user or signs in and returns the new user.
 */
export const ensureAuthenticated = (): Promise<User> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                signInAnonymously(auth)
                    .then((credential) => resolve(credential.user))
                    .catch(reject);
            }
        });
    });
};

/**
 * Gets the current authenticated user synchronously if available.
 */
export const getCurrentUser = () => auth.currentUser;
