import { render } from 'preact'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Home } from './pages/Home.tsx'
import { Exercise } from './pages/Exercise.tsx'

render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/exercise" element={<Exercise />} />
    </Routes>
  </BrowserRouter>,
  document.getElementById('app')!
)
