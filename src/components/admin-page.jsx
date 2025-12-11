export default function AdminPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-[#3D56A6] mb-8">Admin</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#3D56A6] rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">Quotation</h2>
            <p className="text-sm text-gray-600">Create and manage customer quotations.</p>
            <a href="/quotation.html" className="inline-block mt-4 px-4 py-2 bg-[#3D56A6] text-white rounded-md">Open</a>
          </div>
          <div className="border border-[#3D56A6] rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">User Access</h2>
            <p className="text-sm text-gray-600">Manage roles and permissions.</p>
            <button className="mt-4 px-4 py-2 bg-[#3D56A6] text-white rounded-md">Open</button>
          </div>
          
        </div>
      </div>
    </div>
  )
}
