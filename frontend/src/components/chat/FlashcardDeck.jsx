import { useState } from 'react'
import { motion } from 'framer-motion'

export default function FlashcardDeck({ cards, onClose }) {
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    if (!cards || cards.length === 0) return null

    const nextCard = (e) => {
        e?.stopPropagation()
        if (currentCardIndex < cards.length - 1) {
            setIsFlipped(false)
            setCurrentCardIndex(prev => prev + 1)
        }
    }

    const prevCard = (e) => {
        e?.stopPropagation()
        if (currentCardIndex > 0) {
            setIsFlipped(false)
            setCurrentCardIndex(prev => prev - 1)
        }
    }

    return (
        <div className="w-full max-w-xl aspect-[3/2] relative mt-6 mb-12 mx-auto">
            {/* Progress Indicator */}
            <div className="absolute -top-8 left-0 right-0 flex justify-between items-center text-white">
                <span className="text-sm font-medium text-purple-400">Card {currentCardIndex + 1} of {cards.length}</span>
            </div>

            {/* Card Container - The Flip Effect */}
            <div 
                className="w-full h-full relative cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    className="w-full h-full relative preserve-3d transition-transform duration-500"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front (Question) */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                        <h4 className="text-xs uppercase tracking-wider text-purple-400 mb-4 font-semibold">Question</h4>
                        <p className="text-lg sm:text-xl text-white font-medium leading-relaxed">
                            {cards[currentCardIndex].front}
                        </p>
                        <div className="absolute bottom-4 text-xs text-gray-500">Click to flip</div>
                    </div>

                    {/* Back (Answer) */}
                    <div 
                        className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-2xl border border-purple-500/30 shadow-2xl flex flex-col items-center justify-center p-8 text-center"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        {cards[currentCardIndex].image_url && (
                            <div className="mb-4 w-full max-h-32 flex justify-center">
                                <img 
                                    src={cards[currentCardIndex].image_url} 
                                    alt="Visual aid" 
                                    className="h-full object-contain rounded-lg border border-white/20 bg-black/20"
                                />
                            </div>
                        )}
                        <h4 className="text-xs uppercase tracking-wider text-cyan-300 mb-4 font-semibold">Answer</h4>
                        <p className="text-base sm:text-lg text-white leading-relaxed">
                            {cards[currentCardIndex].back}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="absolute -bottom-14 left-0 right-0 flex justify-center items-center gap-4">
                <button
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                
                <div className="flex gap-1.5">
                    {cards.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentCardIndex ? 'bg-purple-500 w-3' : 'bg-gray-600'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={nextCard}
                    disabled={currentCardIndex === cards.length - 1}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
