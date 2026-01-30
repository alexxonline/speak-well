import { Link } from 'react-router-dom'
import './Home.css'

export function Home() {
  return (
    <div className="home-container">
      <h1>Speak Well</h1>
      <p className="subtitle">Learn Portuguese by speaking</p>
      <Link to="/exercise" className="start-button">
        Start Exercise
      </Link>
    </div>
  )
}
