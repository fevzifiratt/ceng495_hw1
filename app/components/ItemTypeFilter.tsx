'use client'

import React from 'react'

interface ItemTypeFilterProps {
    selectedType: string | null
    onTypeChange: (type: string | null) => void
}

export default function ItemTypeFilter({ selectedType, onTypeChange }: ItemTypeFilterProps) {
    const itemTypes = [
        { value: null, label: 'All Items' },
        { value: 'vinyl', label: 'Vinyl' },
        { value: 'antiqueFurniture', label: 'Antique Furniture' },
        { value: 'gpsWatch', label: 'GPS Watch' },
        { value: 'runningShoes', label: 'Running Shoes' }
    ]

    return (
        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Filter by Type</h2>
            <div className="flex flex-wrap gap-2">
                {itemTypes.map((type) => (
                    <button
                        key={type.value || 'all'}
                        className={`px-3 py-2 rounded-lg transition ${
                            selectedType === type.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                        onClick={() => onTypeChange(type.value)}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        </div>
    )
}