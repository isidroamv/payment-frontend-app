import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Quotes from './components/Quotes/Quotes'; // Your Quotes component
import Home from './components/Home/Home'; // Your Home component
import NotFound from './components/NotFound/NotFound'; // Your NotFound component

function App() {
    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/quotes" element={<Quotes />} />
                    <Route path="*" element={<NotFound />} /> {/* Fallback for unmatched routes */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
