import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-light text-gray-800">
          Scripture Daily
        </div>
        <button
          onClick={() => navigate('/subscribe')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Subscribe
        </button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-light text-gray-800 mb-6 leading-tight">
            Discover the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Essence of Being
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light leading-relaxed">
            A journey into consciousness, wisdom, and the infinite nature of existence
          </p>

          {/* Inspirational Text */}
          <div className="max-w-3xl mx-auto mb-16 space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              In every breath, the universe whispers its secrets. In every moment of stillness,
              we touch the eternal. Life is not merely lived—it is felt, experienced, and
              understood through the lens of timeless wisdom.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Across traditions and teachings, from ancient scriptures to the geometry of human
              consciousness, there flows a singular truth: we are all connected, all seeking,
              all part of something infinitely greater than ourselves.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Enlightenment is not a destination—it is the gentle awakening to the wonder that
              has always surrounded us, the recognition of the divine in the ordinary, and the
              courage to live authentically in harmony with the cosmos.
            </p>
          </div>

          {/* Call to Action */}
          <div className="mb-16">
            <button
              onClick={() => navigate('/scriptures')}
              className="group px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Explore Daily Wisdom
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-semibold text-gray-800 mb-2">Qur'an</h3>
              <p className="text-sm text-gray-600">
                Divine guidance and mercy for all of humanity
              </p>
            </div>

            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">✡️</div>
              <h3 className="font-semibold text-gray-800 mb-2">Torah</h3>
              <p className="text-sm text-gray-600">
                Ancient wisdom and the foundation of spiritual law
              </p>
            </div>

            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">✝️</div>
              <h3 className="font-semibold text-gray-800 mb-2">Bible</h3>
              <p className="text-sm text-gray-600">
                Teachings of love, grace, and redemption
              </p>
            </div>

            <div className="p-6 bg-white/50 backdrop-blur rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🌟</div>
              <h3 className="font-semibold text-gray-800 mb-2">Human Design</h3>
              <p className="text-sm text-gray-600">
                Your unique blueprint for living authentically
              </p>
            </div>
          </div>

          {/* Quote Section */}
          <div className="max-w-2xl mx-auto p-8 bg-white/60 backdrop-blur rounded-3xl border border-gray-100 mb-16">
            <blockquote className="text-2xl font-light text-gray-700 italic leading-relaxed">
              "The privilege of a lifetime is to become who you truly are."
            </blockquote>
            <p className="text-sm text-gray-500 mt-4">— Carl Jung</p>
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Begin your journey today. Receive daily wisdom from sacred texts and teachings.
            </p>
            <button
              onClick={() => navigate('/subscribe')}
              className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors font-medium"
            >
              Get Daily Wisdom in Your Inbox
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="flex justify-center space-x-8 text-sm text-gray-600">
            <button
              onClick={() => navigate('/scriptures')}
              className="hover:text-indigo-600 transition-colors"
            >
              Daily Scriptures
            </button>
            <button
              onClick={() => navigate('/subscribe')}
              className="hover:text-indigo-600 transition-colors"
            >
              Subscribe
            </button>
          </div>
          <p className="text-sm text-gray-500">Developed by Net1io.com</p>
          <p className="text-xs text-gray-400">Copyright (C) Reserved 2025</p>
        </div>
      </footer>
    </div>
  )
}
