const Page = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex justify-center py-10">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-8 space-y-8">
        
        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="text-gray-500 text-sm">
            Your plans, payments, and invoices — all in one quiet little corner.
          </p>
        </div>

        {/* Current Plan */}
        <div className="p-6 border rounded-xl bg-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medium">Current Plan</h2>
            <p className="text-gray-600 text-sm">Pro — ₹299/month</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition">
            Manage
          </button>
        </div>

        {/* Usage */}
        <div className="p-6 border rounded-xl">
          <h2 className="text-lg font-medium mb-2">Usage</h2>
          <p className="text-gray-500 text-sm">You’re floating in calm waters.</p>

          <div className="w-full bg-gray-200 h-3 rounded-full mt-4">
            <div className="h-full bg-black rounded-full" style={{ width: "45%" }}></div>
          </div>

          <div className="text-right text-sm text-gray-500 mt-1">45% used</div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 border rounded-xl">
          <h2 className="text-lg font-medium mb-4">Payment Method</h2>

          <div className="flex justify-between items-center border p-4 rounded-xl bg-gray-50">
            <div className="flex flex-col">
              <span className="font-medium">Visa ending in 4242</span>
              <span className="text-gray-500 text-sm">Expires 06/28</span>
            </div>
            <button className="px-4 py-2 rounded-xl border hover:bg-gray-100 transition">
              Edit
            </button>
          </div>
        </div>

        {/* Invoices */}
        <div className="p-6 border rounded-xl">
          <h2 className="text-lg font-medium mb-4">Invoices</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center border p-4 rounded-xl hover:bg-gray-50 transition"
              >
                <span className="text-sm">Invoice #{1230 + i}</span>
                <span className="font-medium">₹299</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Page;
