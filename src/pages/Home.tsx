import { useEffect, useState } from 'preact/hooks'
import { useNavigate } from 'react-router-dom'
import './Home.css'

const API_BASE_URL = 'http://localhost:8000'

interface Category {
  id: string
  name: string
  description: string
  icon?: string
}

export function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`)
        if (!response.ok) {
          throw new Error('Failed to load categories')
        }
        const data: Category[] = await response.json()
        setCategories(data)
        if (data.length > 0) {
          setSelectedCategory(data[0].id)
        }
      } catch (err) {
        setError('Failed to load categories. Please try again.')
        console.error('Error loading categories:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleStart = () => {
    if (!selectedCategory) return
    navigate(`/exercise?category=${selectedCategory}`)
  }

  const selectedCategoryInfo = categories.find((category) => category.id === selectedCategory)

  return (
    <div className="home-container">
      <h1>Speak Well</h1>
      <p className="subtitle">Learn Portuguese by speaking</p>
      {isLoading ? (
        <div className="loading">Loading categories...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="category-selection">
          <label htmlFor="category-select" className="category-label">
            Choose a category
          </label>
          <select
            id="category-select"
            className="category-dropdown"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory((event.target as HTMLSelectElement).value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ''}{category.name}
              </option>
            ))}
          </select>
          {selectedCategoryInfo?.description && (
            <p className="category-description">{selectedCategoryInfo.description}</p>
          )}
          <button className="start-button" onClick={handleStart} disabled={!selectedCategory}>
            Start Exercise
          </button>
        </div>
      )}
    </div>
  )
}
