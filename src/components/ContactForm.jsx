import { useState } from 'react'
import { Button, Input, Textarea } from '@material-tailwind/react'
import { API_ENDPOINTS, BOOKINGS_BASE_URL } from '../data/api'

function ContactForm() {
  const [formData, setFormData] = useState({ name: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`${BOOKINGS_BASE_URL}${API_ENDPOINTS.comments}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        body: JSON.stringify({
          name: formData.name,
          comment: formData.message,
        }),
        mode: 'cors',
      })

      const data = await response.json()

      if (response.ok || response.status === 201) {
        setSuccess(true)
        setFormData({ name: '', message: '' })
        setTimeout(() => {
          setSuccess(false)
        }, 5000)
      } else {
        setError(data.message || data.error || 'Xabar yuborish muvaffaqiyatsiz')
      }
    } catch (err) {
      console.error('Error sending comment:', err)
      setError('Tarmoq xatosi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form className="space-y-3 sm:space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
      <Input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Ismingizni kiriting"
        required
        size="lg"
        className="!text-black !bg-white"
        labelProps={{
          className: "hidden"
        }}
        disabled={isSubmitting}
        aria-label="Your name"
      />
      <Textarea
        name="message"
        value={formData.message}
        onChange={handleInputChange}
        placeholder="Xabaringizni kiriting"
        rows={5}
        required
        size="lg"
        className="!text-black !bg-white min-h-[120px]"
        labelProps={{
          className: "hidden"
        }}
        disabled={isSubmitting}
        aria-label="Your message"
      />
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
          ✅ Xabaringiz muvaffaqiyatli yuborildi!
        </div>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full bg-barber-olive hover:bg-barber-gold text-white font-semibold rounded-xl sm:rounded-2xl text-sm sm:text-base py-3 sm:py-3.5 md:py-4"
        loading={isSubmitting}
      >
        {isSubmitting ? (
          'Yuborilmoqda...'
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Xabarni yuborish
          </span>
        )}
      </Button>
      <p className="text-white text-xs sm:text-sm opacity-70 text-center">
        Xabaringiz bizning serverga yuboriladi
      </p>
    </form>
  )
}

export default ContactForm
