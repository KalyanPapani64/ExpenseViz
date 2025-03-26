import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxrrCCCZzGS2jsAUdPiJKWqpfq79MhRpk",
  authDomain: "d3-kalyan.firebaseapp.com",
  projectId: "d3-kalyan",
  storageBucket: "d3-kalyan.firebasestorage.app",
  messagingSenderId: "493985455848",
  appId: "1:493985455848:web:19c4e6022e0166c445335d",
  measurementId: "G-N5RBB6YS4E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.querySelector("form");
const name = document.querySelector("#name");
const cost = document.querySelector("#cost");
const error = document.querySelector("#error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (name.value && cost.value){
    
    if (isNaN(parseFloat(cost.value)) || parseFloat(cost.value) <= 0){
      error.textContent = "Invalid Money value";
    }
    else{
      const item = {
        name: name.value,
        cost: parseInt(cost.value)
      };
      try {
        await addDoc(collection(db, "expenses"), item);
        error.textContent = ""; 
        name.value = ""; 
        cost.value = "";
      } catch (error) {
        console.error("Error adding document: ", error);
        error.textContent = "An error occurred while saving the item.";
      }
    }
  }

  else{
    error.textContent = "Both fields are Required";
  }
})
