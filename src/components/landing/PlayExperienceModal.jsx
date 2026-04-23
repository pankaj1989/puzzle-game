import { IoClose, IoArrowBack } from "react-icons/io5";
import { IoIosArrowForward, IoIosShuffle } from "react-icons/io";
import { FaBolt, FaCrown } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GameStartScreen } from "./GameStartScreen.jsx";
import { CategorySelection } from "./CategorySelection.jsx";

export function PlayExperienceModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [showGameStart, setShowGameStart] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setShowGameStart(false);
      setShowCategorySelection(false);
    }
  }, [isOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (showCategorySelection) {
    return (
      <CategorySelection 
        isOpen={showCategorySelection} 
        onClose={onClose}
        onBack={() => setShowCategorySelection(false)}
      />
    );
  }

  if (showGameStart) {
    return (
      <GameStartScreen 
        isOpen={showGameStart} 
        onClose={onClose}
        onBack={() => setShowGameStart(false)}
        onStartPlaying={() => navigate('/game')}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-5 md:px-8 py-4 sm:py-6 bg-[antiquewhite]/90 backdrop-blur-sm">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white hover:bg-gray-50 transition-colors text-navy-dark font-medium text-[13px] sm:text-[15px] shadow-md"
          aria-label="Go back"
        >
          <IoArrowBack className="size-4 sm:size-5" />
          <span>Back</span>
        </button>

        {/* Random Category Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-[10px] sm:text-[11px] uppercase tracking-[1.1px]">
          <IoIosShuffle className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Your Random Category</span>
          <span className="sm:hidden">Random</span>
        </div>
      </div>

      {/* Modal */}
      <div className="fixed inset-0 z-40 flex top-[70px] items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-[16px] sm:rounded-[32px] max-w-[980px] w-full p-3 sm:p-8 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.2)] my-[72px] sm:my-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-8 sm:top-8 size-7 sm:size-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <IoClose className="size-4 sm:size-6 text-gray-600" />
          </button>

          {/* Header */}
          <div className="text-center mb-2.5 sm:mb-8">
            <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-[#FEF3C6CC] px-2.5 sm:px-4 py-0.5 sm:py-2 text-[9px] sm:text-[11px] font-semibold uppercase tracking-[1.1px] text-[#7B3306] mb-1.5 sm:mb-4">
              {/* <FaBolt className="size-2.5 sm:size-3" /> */}
              <img src="/zigzag.svg" alt="Zigzag" className="w-3 h-3 sm:w-5 sm:h-5" />
              Choose Your Experience
            </span>
            <h2 className="font-serif text-[18px] sm:text-[40px] md:text-[52px] font-bold text-navy-dark leading-tight">
       Ready to start?
            </h2>
            <p className="mt-0.5 sm:mt-3 text-[#4A5565] text-[11px] sm:text-[17px] md:text-[19px] px-2">
              Pick how you'd like to play your first puzzle
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-2 gap-2.5 sm:gap-6">
            {/* Random Category Card */}
            <div className="flex flex-col rounded-[14px] sm:rounded-[24px] border-2 border-gray-200 p-3 sm:p-8 hover:border-gray-300 transition-all" style={{background: 'linear-gradient(135deg, #F9FAFB 0%, rgba(243, 244, 246, 0.5) 100%)'}}>
              <div className="size-8 sm:size-12 rounded-[25px] bg-gray-200 flex items-center justify-center mb-2 sm:mb-6">
                <IoIosShuffle className="size-3.5 sm:size-6 text-gray-700" />
              </div>
              <h3 className="font-serif text-[15px] sm:text-[28px] font-semibold text-navy-dark mb-1 sm:mb-3">
                Random Category
              </h3>
              <p className="text-gray-600 text-[11px] sm:text-[15px] leading-relaxed mb-3 sm:mb-8 flex-1">
                Jump right in! We'll pick a surprise category for you. Perfect for casual play.
              </p>
              <button 
                onClick={() => window.open('/game-start', '_blank')}
                className="flex items-center justify-between w-full rounded-[12px] bg-white border border-gray-300 px-3 sm:px-6 py-2 sm:py-4 text-[12px] sm:text-[15px] font-medium text-navy-dark hover:bg-gray-50 transition-all group"
              >
                <span>Free Forever</span>
                <IoIosArrowForward className="size-4 sm:size-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Choose Category Card */}
            <div className="relative flex flex-col rounded-[14px] sm:rounded-[24px] navy-gradient2 p-3 sm:p-8 text-white shadow-[0_16px_48px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Glow effect */}
              <div className="size-[250px] sm:size-[300px] absolute -top-20 -right-20 orange-glow2 blur-[100px] rounded-full pointer-events-none"/>
              
              {/* Icons */}
              <div className="relative flex items-center justify-between mb-2 sm:mb-6">
                {/* <div className="size-10 sm:size-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(to right, #FE9A00, #FFB900, #FE9A00)'}}>
                  <FaBolt className="size-4 sm:size-5 text-navy-dark" />
                </div> */}
                <img src="/Container.svg" alt="Container" className=" ml-[-10px]" />
                <img src="/mu.svg" alt="mu" className="" />

                {/* <div className="size-8 sm:size-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(to right, #FE9A00, #FFB900, #FE9A00)'}}>
                  <FaCrown className="size-4 sm:size-5 text-[#FE9A00]" />
                </div> */}
              </div>

              <h3 className="font-serif text-[15px] sm:text-[28px] font-semibold mb-1 sm:mb-3 relative z-10">
                Choose Category
              </h3>
              <p className="text-white/80 text-[11px] sm:text-[15px] leading-relaxed mb-3 sm:mb-8 flex-1 relative z-10">
                Pick any category you want. Plus exclusive puzzles, no ads, and leaderboards.
              </p>
              <button 
                onClick={() => setShowCategorySelection(true)}
                className="relative z-10 flex items-center justify-between w-full rounded-[12px] px-3 sm:px-6 py-2 sm:py-4 text-[12px] sm:text-[15px] font-semibold text-navy-dark transition-all group"
                style={{
                  background: 'linear-gradient(to right, #FE9A00, #FFB900, #FE9A00)',
                  boxShadow: 'rgb(254 154 0 / 37%) 0px 0px 0px, rgb(254 154 0 / 43%) 0px 20px 25px -5px'
                }}
              >
                <span>$9/month</span>
                <img src="/arrow.svg" alt="Arrow" className="w-5 sm:w-auto" />
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-gray-500 text-[9px] sm:text-sm mt-2 sm:mt-6 px-2">
            You can upgrade to Premium anytime from your account
          </p>
        </div>
      </div>
    </>
  );
}
