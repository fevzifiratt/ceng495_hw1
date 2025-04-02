'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ItemTypeFilter from '@/app/components/ItemTypeFilter'

type Item = {
  _id: string
  name: string
  description: string
  price: number
  image: string
  seller: string
  itemType: string
  rating: number
  reviewCount: number
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)

        // Build the query URL with type filter if selected
        let url = '/api/items'
        if (selectedType) {
          url += `?type=${selectedType}`
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch items')
        }
        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()

    // Set mounted state after a slight delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [selectedType]) // Re-fetch when selectedType changes

  const handleTypeChange = (type: string | null) => {
    setSelectedType(type)
  }

  // Prevent hydration mismatch by only rendering the image component client-side
  if (!mounted) {
    return (
        <main className="container mx-auto px-4 py-8">
          <section className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Welcome to CENG495-HW1 E-Commerce Application</h1>
            <p className="text-lg">Browse the collection of items</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </main>
    )
  }

  return (
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to CENG495-HW1 E-Commerce Application</h1>
          <p className="text-lg">Browse the collection of items</p>
        </section>

        {/* Add the ItemTypeFilter component */}
        <ItemTypeFilter selectedType={selectedType} onTypeChange={handleTypeChange} />

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
              ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                  <div key={item._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full">
                    <div className="relative h-48 bg-gray-800">
                      {mounted && item.image && (
                          <div className="relative w-full h-full">
                            <Link href={item.image} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                              <img
                                  src={item.image}
                                  alt={item.name}
                                  className="object-cover absolute inset-0 w-full h-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/file.svg';
                                    // Stop further GET requests
                                    (e.target as HTMLImageElement).onerror = null;
                                  }}
                              />
                            </Link>
                          </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h2 className="text-xl font-semibold">{item.name}</h2>
                      <div className="flex items-center mt-1">
                  <span className={`text-sm px-2 py-1 rounded-full capitalize font-medium ${
                      item.itemType === 'vinyl'
                          ? 'bg-purple-200 text-purple-800'
                          : item.itemType === 'antiqueFurniture'
                              ? 'bg-amber-200 text-amber-800'
                              : item.itemType === 'gpsWatch'
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-green-200 text-green-800'
                  }`}>
                    {item.itemType === 'antiqueFurniture' ? 'Antique Furniture' : item.itemType}
                  </span>
                      </div>
                      <p className="text-gray-300 mt-2 text-base line-clamp-2">{item.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xl font-bold">${item.price.toFixed(2)}</span>
                        <span className="text-base font-medium">
                    Rating: <span className="text-yellow-600">{item.rating.toFixed(1)}</span>
                  </span>
                      </div>
                      <div className="mt-auto pt-4">
                        <Link
                            href={`/items/${item._id}`}
                            className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
              ))}

              {items.length === 0 && !loading && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No items found. Check back later!
                  </div>
              )}
            </div>
        )}
      </main>
  )
}