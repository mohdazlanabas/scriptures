import { useState } from 'react'

export default function Subscribe() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStripePayment = () => {
    if (!agreedToTerms) {
      alert('Please accept the Terms and Conditions before proceeding.')
      return
    }

    if (!formData.fullName || !formData.email) {
      alert('Please fill in at least your name and email.')
      return
    }

    // Store user data in localStorage for retrieval after payment
    localStorage.setItem('subscriptionUserData', JSON.stringify(formData))

    console.log('User Data:', formData)
    console.log('Agreed to Terms:', agreedToTerms)

    // For local development, redirect to local payment page
    // In production, this will be: https://buy.stripe.com/dRm9ATbGh2fmfTG8ww
    const isProduction = window.location.hostname !== 'localhost'
    const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/dRm9ATbGh2fmfTG8ww'

    if (isProduction) {
      // Production: Redirect to Stripe
      console.log('Redirecting to Stripe checkout...')
      window.location.href = STRIPE_CHECKOUT_URL
    } else {
      // Local development: Use local payment page
      console.log('Using local payment page for development...')
      window.location.href = '/payment'
    }
  }

  return (
    <div className="container py-6 max-w-4xl">
      <header className="mb-8">
        <a href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Home
        </a>
        <h1 className="text-3xl font-bold">Subscribe to Scripture Daily</h1>
        <p className="text-gray-600 mt-2">Get daily inspiration delivered to your inbox</p>
      </header>

      {/* User Information Section */}
      <section className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="United States"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="New York"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="123 Main St"
            />
          </div>
        </div>
      </section>

      {/* Terms and Conditions Section */}
      <section className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Terms and Conditions</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
          <div className="text-sm text-gray-700 space-y-3">
            <h3 className="font-semibold text-base">Subscription Agreement</h3>

            <p>
              <strong>1. Service Description:</strong> By subscribing to Scripture Daily, you will receive daily scripture passages from the Qur'an, Torah, Bible, and Human Design teachings, along with thematic summaries.
            </p>

            <p>
              <strong>2. Payment Terms:</strong> Subscription fees are billed on a recurring basis. You authorize us to charge your payment method on file for the subscription fee plus any applicable taxes.
            </p>

            <p>
              <strong>3. Cancellation Policy:</strong> You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period. No refunds will be provided for partial subscription periods.
            </p>

            <p>
              <strong>4. Content License:</strong> All content provided through Scripture Daily is for personal, non-commercial use only. You may not reproduce, distribute, or create derivative works from our content without prior written permission.
            </p>

            <p>
              <strong>5. Privacy:</strong> We respect your privacy and will not share your personal information with third parties except as necessary to provide our services or as required by law.
            </p>

            <p>
              <strong>6. Modifications:</strong> We reserve the right to modify these terms or the subscription price with 30 days advance notice. Continued use of the service after such notice constitutes acceptance of the new terms.
            </p>

            <p>
              <strong>7. Disclaimer:</strong> Scripture Daily provides spiritual and educational content. We make no warranties about the accuracy, completeness, or suitability of the content for any particular purpose.
            </p>

            <p>
              <strong>8. Contact:</strong> For questions or concerns, please contact us at support@net1io.com
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the Terms and Conditions <span className="text-red-500">*</span>
          </span>
        </label>
      </section>

      {/* Payment Button */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Ready to Subscribe?</h3>
            <p className="text-sm text-gray-600">
              Subscription: <span className="font-semibold">$9.99/month</span>
            </p>
          </div>
          <button
            onClick={handleStripePayment}
            disabled={!agreedToTerms}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              agreedToTerms
                ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Proceed to Payment
          </button>
        </div>
        {!agreedToTerms && (
          <p className="text-xs text-red-600 mt-3 text-center">
            Please accept the Terms and Conditions to proceed
          </p>
        )}
      </section>

      {/* Stripe Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>🔒 Secure Payment:</strong> Your payment is processed securely through Stripe.
          We never store your credit card information.
        </p>
      </div>

      <footer className="mt-10 pt-6 border-t text-center text-sm text-gray-500">
        <p>Developed by Net1io.com</p>
        <p>Copyright (C) Reserved 2025</p>
      </footer>
    </div>
  )
}
