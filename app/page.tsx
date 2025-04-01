'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch('/api/items')
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
  }, [])

  return (
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to our Marketplace</h1>
          <p className="text-lg">Browse our collection of items</p>
        </section>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
              ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                  <div key={item._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                    <div className="relative h-48 bg-gray-200">
                      {item.image && (
                          <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                          />
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <p className="text-gray-600 mt-1 text-sm line-clamp-2">{item.description}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
                        <span className="text-sm text-gray-500">Rating: {item.rating.toFixed(1)}</span>
                      </div>
                      <Link
                          href={`/items/${item._id}`}
                          className="mt-3 block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                      >
                        View Details
                      </Link>
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