import { ref, onMounted } from "vue";
import { auth, provider } from "@/firebase";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    type User
} from "firebase/auth";

import api from '../utils/api';

const user = ref<User | null>(null);

export function useAuth() {
    const login = async () => {
        await setPersistence(auth, browserLocalPersistence);
        try {
            const result = await signInWithPopup(auth, provider);
            user.value = result.user;
            saveUserData(); // Save user data after successful login
            console.log("登入成功", user.value.email);
        } catch (err) {
            console.error("登入失敗", err);
        }
    };

    const logout = async () => {
        await signOut(auth);
        user.value = null;
    };

    onMounted(() => {
        onAuthStateChanged(auth, (currentUser) => {
            user.value = currentUser;
            console.log("Auth state changed:", currentUser ? currentUser.email : "No user logged in");
        });
    });

    return {
        user,
        login,
        logout,
    };
}

// Function to save user data to the backend
const saveUserData = () => {
    if (user.value) {
        const userData = {
            uid: user.value.uid,
            email: user.value.email,
            displayName: user.value.displayName,
        };

        api.post('/api/user', userData)
            .then((response: any) => {
                console.log("User data saved successfully:", response);
            })
            .catch((error: any) => {
                console.error("Error saving user data:", error);
            });
    }
}
