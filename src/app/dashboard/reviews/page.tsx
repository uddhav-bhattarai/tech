"use client"

import DashboardLayout from "@/components/layouts/DashboardLayout"

export default function MyReviewsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Reviews</h1>
          <p className="text-gray-600">This is where you&apos;ll see all your device reviews.</p>
          <div className="mt-6 text-center py-12 text-gray-500">
            <p>No reviews yet. Start reviewing devices to see them here!</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}