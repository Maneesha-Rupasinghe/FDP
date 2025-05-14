
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyCgtoRMDfbRKml8ENLWDfHJLR76vI5VCb0",
    authDomain: "fdp-project-f2769.firebaseapp.com",
    projectId: "fdp-project-f2769",
    storageBucket: "fdp-project-f2769.firebasestorage.app",
    messagingSenderId: "657962786831",
    appId: "1:657962786831:web:27409919353c10b56c437a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, app, db }