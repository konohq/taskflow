import { Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-lg font-semibold text-white">
            TF
          </div>
          <p className="mb-2 text-sm font-medium text-indigo-600">
            Frontend foundation
          </p>
          <h1 className="mb-4 text-3xl font-semibold tracking-normal text-slate-950">
            TaskFlow AI
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            React, TypeScript, Vite, Tailwind CSS, Axios, and React Router are
            ready. Product screens and API integration will be added in the next
            phase.
          </p>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}

export default App
