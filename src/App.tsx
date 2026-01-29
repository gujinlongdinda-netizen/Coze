import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Pricing from "@/pages/Pricing";
import TextProcessor from "@/pages/TextProcessor";
import { AuthProvider } from '@/contexts/authContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/process" element={<TextProcessor />} />
      </Routes>
    </AuthProvider>
  );
}
