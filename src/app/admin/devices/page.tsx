import Link from 'next/link'

export default function AdminDevicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Device Management
          </h1>
          <p className="text-gray-600 mb-6">
            Device management interface is currently being developed.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/devices" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Devices
            </Link>
            <Link 
              href="/admin" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
