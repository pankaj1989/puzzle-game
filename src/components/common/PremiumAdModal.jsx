import { IoClose } from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';
import { useAuth } from '../../auth/AuthContext';
import { useModalStack } from '../../hooks/useModalStack';

export function PremiumAdModal({ isOpen, onClose, onUpgrade }) {
  const { user, openPremiumPayment } = useAuth();
  useModalStack(isOpen);

  function handleUpgrade() {
    if (!user) return;
    if (user.plan === 'premium') {
      onUpgrade?.();
      onClose?.();
      return;
    }
    openPremiumPayment(() => {
      onUpgrade?.();
      onClose?.();
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-9">
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
              className="absolute right-0 z-99 size-15 rounded-full bg-[rgb(38, 77, 167)] bg-[#264DA7] text-white flex items-center justify-center transition-colors shadow-lg border-[black] border"
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
                    onClick={handleUpgrade}
                    className="w-full py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105"
                    style={{
                      background: '#FA7A00',
                      border: '1px solid #FFFFFF',
                      boxShadow: '0 4px 0 0 #FFFFFF'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaCrown className="text-white text-xl" />
                      <span>Upgrade to Premium</span>
                    </div>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-full font-bold text-gray-900 bg-white text-lg transition-all hover:bg-gray-50"
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
      </div>
    </div>
  );
}