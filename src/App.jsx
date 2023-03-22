/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './Home';

function App() {
  return (
    <Routes>
      <Route path="*" element={<div>404 Not Found</div>} />
      <Route path="/" element={<Home />} />
      <Route path="/:year" element={<Home />}>
        <Route path=":county" element={<Home />}>
          <Route path=":town" element={<Home />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
