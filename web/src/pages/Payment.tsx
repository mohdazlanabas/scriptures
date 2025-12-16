import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Payment() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form')
  const [userData, setUserData] = useState<any>(null)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })

  useEffect(() => {
    // Try to get user data from router state first, then localStorage
    let user = location.state?.userData

    if (!user) {
      const storedData = localStorage.getItem('subscriptionUserData')
      if (storedData) {
        user = JSON.parse(storedData)
        setUserData(user)
      }
    } else {
      setUserData(user)
    }

    // Redirect to subscribe if no user data found
    if (!user) {
      navigate('/subscribe')
      return
    }

    console.log('Payment page loaded for:', user)
  }, [location.state, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target

    // Format card number with spaces
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      value = value.slice(0, 19) // Limit to 16 digits + 3 spaces
    }

    // Format expiry date
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4)
      }
      value = value.slice(0, 5)
    }

    // Limit CVV to 3-4 digits
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }

    setPaymentData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitPayment = async () => {
    // Validate form
    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
      alert('Please fill in all payment details')
      return
    }

    const cardNumberDigits = paymentData.cardNumber.replace(/\s/g, '')
    if (cardNumberDigits.length !== 16) {
      alert('Please enter a valid 16-digit card number')
      return
    }

    if (paymentData.expiryDate.length !== 5) {
      alert('Please enter expiry date in MM/YY format')
      return
    }

    if (paymentData.cvv.length < 3) {
      alert('Please enter a valid CVV')
      return
    }

    // Start processing
    setStep('processing')

    // Simulate payment processing
    setTimeout(async () => {
      const isSuccess = Math.random() > 0.1 // 90% success rate for demo

      if (isSuccess) {
        // Send subscription email
        try {
          const response = await fetch('/api/subscribe/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          })

          const result = await response.json()
          console.log('Email API response:', result)

          if (result.email) {
            console.log('\n=== SUBSCRIPTION EMAIL ===')
            console.log('To:', result.email.to)
            console.log('Subject:', result.email.subject)
            console.log('\nBody:')
            console.log(result.email.body)
            console.log('========================\n')
          }

          setStep('success')
          localStorage.removeItem('subscriptionUserData')
        } catch (error) {
          console.error('Email API error:', error)
          // Still mark as success since payment went through
          setStep('success')
          localStorage.removeItem('subscriptionUserData')
        }
      } else {
        setStep('failed')
      }
    }, 2000)
  }

  const handleReturnHome = () => {
    navigate('/')
  }

  const handleTryAgain = () => {
    navigate('/subscribe')
  }

  // Payment form
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h1 className="text-2xl font-bold">Complete Your Payment</h1>
              <p className="text-blue-100 mt-1">Scripture Daily Monthly Subscription</p>
            </div>

            {/* Order Summary */}
            <div className="p-6 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subscriber:</span>
                  <span className="font-medium">{userData?.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{userData?.email}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Monthly Subscription:</span>
                  <span className="font-semibold text-lg">$9.99/month</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Payment Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    value={paymentData.cardName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <p className="text-sm text-gray-700">
                    <strong>Secure Payment:</strong> Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmitPayment}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Pay $9.99/month
                </button>
                <button
                  onClick={() => navigate('/subscribe')}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  ← Back to Subscription
                </button>
              </div>
            </div>
          </div>

          {/* Test Card Info */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>💳 Test Mode:</strong> Use any 16-digit card number for testing (e.g., 4242 4242 4242 4242)
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Processing
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="animate-spin h-16 w-16 text-blue-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600 mb-4">Please wait while we securely process your payment...</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700">
                <strong>Subscriber:</strong> {userData?.fullName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {userData?.email}
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Amount:</strong> $9.99/month
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="h-16 w-16 text-green-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to Scripture Daily. Your daily scriptures will be delivered to your inbox.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Order Confirmation</strong>
              </p>
              <p className="text-sm text-gray-600">
                Subscriber: {userData?.fullName}
              </p>
              <p className="text-sm text-gray-600">
                Email: {userData?.email}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Subscription: Scripture Daily Monthly
              </p>
              <p className="text-sm text-gray-600">
                Amount: $9.99/month
              </p>
              <p className="text-sm text-gray-600">
                Payment ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to <strong>{userData?.email}</strong>
              </p>
              <button
                onClick={handleReturnHome}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Failed
  if (step === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="h-16 w-16 text-red-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              We were unable to process your payment. Please try again or contact support if the problem persists.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Common reasons for payment failure:</strong>
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Insufficient funds</li>
                <li>Incorrect card details</li>
                <li>Card expired or blocked</li>
                <li>Network connectivity issues</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTryAgain}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={handleReturnHome}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Return to Home
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Need help? Contact us at support@net1io.com
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
