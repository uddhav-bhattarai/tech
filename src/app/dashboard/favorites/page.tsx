"use client"

import DashboardLayout from "@/components/layouts/DashboardLayout"

export default function FavoritesPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Favorites</h1>
          <p className="text-gray-600">Your favorite devices and articles are saved here.</p>
          <div className="mt-6 text-center py-12 text-gray-500">
            <p>No favorites yet. Start adding devices to your favorites!</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}