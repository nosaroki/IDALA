import { useState, useContext } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { LangCtx } from './LangContext'

// Formulaire de paiement Stripe Elements, rendu à l'intérieur d'un <Elements> parent.
// Reçoit les infos client (déjà saisies au-dessus) et l'URL de retour après paiement.
export default function PaymentForm({ clientName, clientEmail, cgvAccepted, onError }) {
  const { lang } = useContext(LangCtx)
  const stripe = useStripe()
  const elements = useElements()

  const [processing, setProcessing] = useState(false)
  const [localError, setLocalError] = useState(null)

  async function handlePay() {
    setLocalError(null)

    if (!cgvAccepted) {
      const msg = lang === 'fr'
        ? 'Veuillez accepter les conditions générales de vente avant de payer.'
        : 'Please accept the terms and conditions before paying.'
      setLocalError(msg)
      return
    }
    if (!clientName?.trim() || !clientEmail?.trim()) {
      const msg = lang === 'fr'
        ? 'Veuillez renseigner votre nom et votre email.'
        : 'Please provide your name and email.'
      setLocalError(msg)
      return
    }
    if (!stripe || !elements) return

    setProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/#/reservation/confirmation`,
        payment_method_data: {
          billing_details: { name: clientName, email: clientEmail },
        },
      },
    })

    // Si on arrive ici, c'est qu'il y a eu une erreur (sinon redirection auto)
    if (error) {
      const msg = error.type === 'card_error' || error.type === 'validation_error'
        ? error.message
        : (lang === 'fr'
            ? 'Le paiement n\'a pas abouti. Veuillez réessayer.'
            : 'The payment could not be completed. Please try again.')
      setLocalError(msg)
      if (onError) onError(msg)
      setProcessing(false)
    }
  }

  return (
    <div className="resa-payment">
      <PaymentElement options={{ layout: 'tabs' }} />

      {localError && <p className="resa-error">{localError}</p>}

      <button
        type="button"
        className="btn btn--violet-mid resa-pay-btn"
        onClick={handlePay}
        disabled={processing || !stripe}
      >
        {processing
          ? (lang === 'fr' ? 'Paiement en cours...' : 'Processing...')
          : (lang === 'fr' ? 'Payer et réserver' : 'Pay and book')}
      </button>
    </div>
  )
}