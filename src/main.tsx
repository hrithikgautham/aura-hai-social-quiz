
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add more verbose logging during development
console.log("Initializing App with environment:", import.meta.env.MODE);

createRoot(document.getElementById("root")!).render(<App />);
