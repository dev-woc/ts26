export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          USHER
        </h1>
        <p className="text-xl text-center mb-8">
          Government Bid Management System
        </p>
        <div className="grid text-center lg:grid-cols-3 gap-4">
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Opportunities
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Browse and manage SAM.gov opportunities automatically
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Bid Analysis
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Automated pricing and profitability calculations
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              SOW Generation
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Professional PDF proposals with subcontractor management
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm opacity-70">
            Next.js App - Coming Soon
          </p>
        </div>
      </div>
    </main>
  )
}
