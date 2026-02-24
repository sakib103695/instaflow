import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HomeLegacy from './pages/HomeLegacy';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/legacy" element={<HomeLegacy />} />
      </Routes>
    </BrowserRouter>
  );
}
