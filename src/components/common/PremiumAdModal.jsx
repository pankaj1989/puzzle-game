import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';
import { useAuth } from '../../auth/AuthContext';

export function PremiumAdModal({ isOpen, onClose, onUpgrade }) {
  const { simulatePremiumUpgrade } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpgrade() {
    setError(null);
    setLoading(true);
    try {
      await simulatePremiumUpgrade();
      onUpgrade?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not start checkout');
      setLoading(false);
    }
  }
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-9">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0000007d]"
        onClick={onClose}
      />
      
      {/* Scrollable Modal Container */}
      <div className="relative flex flex-col items-center w-full">
        <div className="relative flex flex-col items-center w-full  pb-[80px] pt-[50px]">
          {/* Character with Stars - Positioned outside/above modal */}
          <div className="relative z-30 mb-[-50px]">
            <div className="relative flex flex-col items-center">
              {/* Character Image */}
              <div className="relative top-[30px]">
                <img 
                  src="/tom.svg" 
                  alt="Character" 
                  className="object-contain relative z-10 w-40 sm:w-40 lg:w-auto"
                />
              </div>
            </div>
          </div>

          {/* Modal Content - Limited Width */}
          <div className="relative w-full max-w-[550px]">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-0 z-99 size-15 rounded-full bg-[rgb(38, 77, 167)] bg-[#264DA7] text-white flex items-center justify-center transition-colors shadow-lg border-[black] border-[1px]"
            >
              <IoClose className="size-6" />
            </button>

            {/* Background Image Structure */}
            <div 
              className="relative w-full"
              style={{
                backgroundImage: 'url("/card2.png")',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                minHeight: '534px'
              }}
            >
              {/* Content positioned over the background */}
              <div className="relative px-12 pt-24 pb-8">
                {/* Title */}
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
                  Tired of Ads?
                </h2>
                
                {/* Subtitle */}
                <p className="text-center text-gray-600 text-sm mb-6 leading-relaxed">
                  Upgrade to Premium and enjoy an ad-free experience<br />
                  plus unlock all categories!
                </p>

                {/* Premium Feature Box */}
                <div 
                  className="rounded-2xl p-5 mb-32 text-center"
                  style={{
                    background: '#264DA7',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <p className="text-white/70 text-[14px] font-medium mb-2">
                    Advertisement Space
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-white font-bold text-[20px]">Premium = No Ads Ever!</h3>
                  </div>
                </div>

                {/* Buttons in the dark section */}
                <div className="space-y-3 mb-8">
                  <button
                    onClick={onUpgrade || handleUpgrade}
                    disabled={loading}
                    className="w-full py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                    style={{
                      background: '#FA7A00',
                      border: '1px solid #FFFFFF',
                      boxShadow: '0 4px 0 0 #FFFFFF'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaCrown className="text-white text-xl" />
                      <span>{loading ? 'Redirecting…' : 'Upgrade to Premium'}</span>
                    </div>
                  </button>

                  {error && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-center">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="w-full py-4 rounded-full font-bold text-gray-900 bg-white text-lg transition-all hover:bg-gray-50 disabled:opacity-60"
                    style={{
                      border: '1px solid #FA7A00',
                      boxShadow: '0 4px 0 0 #FA7A00'
                    }}
                  >
                    Skip Ad
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revealed Letters Section */}
        {/* <div 
          className="w-full px-4"
          style={{background: "linear-gradient(350deg, #FFFBF5 0%, #FFF5E9 30%, #FFE8D6 60%, #FFD4B8 100%)"}}
        >
          <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 50%, #1E3A8A 100%)' }}>
           
            <div className="pt-6 pb-4 text-center">
              <p className="text-white text-[11px] font-semibold uppercase tracking-[0.2em]" style={{letterSpacing:"3.3px"}}>
                Revealed Letters
              </p>
            </div>

         
            <div className="px-[50px] py-[10px] flex justify-between">
              <div className="flex flex-wrap justify-center gap-3">
                {['B', 'E', 'A', 'T', 'L', 'E', 'S'].map((letter, index) => (
                  <input
                    key={index}
                    type="text"
                    value={letter}
                    readOnly
                    className="w-14 h-14 rounded-xl text-center outline-none cursor-default"
                    style={{
                      background: 'linear-gradient(180deg, #6B9BD6 0%, #5A8BC7 50%, #4A7BB8 100%)',
                      border: '2px solid #FFFFFF4D',
                      boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.4), inset 0px -1px 0px 0px rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {['M', 'A', 'N', 'I'].map((letter, index) => (
                  <input
                    key={index}
                    type="text"
                    value={letter}
                    readOnly
                    className="w-14 h-14 rounded-xl text-center outline-none cursor-default"
                    style={{
                      background: 'linear-gradient(180deg, #6B9BD6 0%, #5A8BC7 50%, #4A7BB8 100%)',
                      border: '2px solid #FFFFFF4D',
                      boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.4), inset 0px -1px 0px 0px rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  />
                ))}
              </div>
           
            </div>
                <div className="flex justify-center mb-5">
                <input
                  type="text"
                  value="A"
                  readOnly
                  className="w-14 h-14 rounded-xl text-center outline-none cursor-default"
                  style={{
                    background: 'linear-gradient(180deg, #6B9BD6 0%, #5A8BC7 50%, #4A7BB8 100%)',
                    border: '2px solid #FFFFFF4D',
                    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.4), inset 0px -1px 0px 0px rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '24px'
                  }}
                />
              </div>
          </div>

        
          <div className="max-w-4xl mx-auto mt-6 px-4">
            <input
              type="text"
              placeholder="Type your answer..."
              className="w-full px-6 py-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-base shadow-lg bg-white"
            />
            
        
            <div className="flex justify-center mt-6 mb-6">
              <button
                className="px-10 py-2.5 rounded-full font-bold text-white text-base transition-all hover:scale-105 shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, #9810FA 0%, #155DFC 100%)'
                }}
              >
                Submit Answer
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
