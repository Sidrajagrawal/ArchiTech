import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Components/Home";
import CreatePage from "./Components/CreatePage"; 
import ResultPage from './Components/ResultPage';
import EditorPage from './Components/EditorPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/editor" element={<EditorPage />} />
            </Routes>
        </Router>
    );
};

export default App;
