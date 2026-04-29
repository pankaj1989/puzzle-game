import { IoArrowBack, IoPlaySharp, IoArrowForward } from "react-icons/io5";
import { IoIosShuffle } from "react-icons/io";
import { FaStar } from "react-icons/fa";

export function GameStartScreen({
  isOpen,
  onClose: _onClose,
  onBack,
  onStartPlaying,
  categoryName = "Random Category",
  isPremiumFlow = false,
}) {
  if (!isOpen) return null;

  const introText = isPremiumFlow
    ? `Awesome choice! You picked ${categoryName}.`
    : `We've picked ${categoryName} as your random category.`;
  const detailText = isPremiumFlow
    ? "You're in premium mode, so your selected category will be used for this game."
    : "Free mode starts with a random category. Upgrade to choose your own category anytime.";

  return (
    <>
      <div
        style={{
          background:
            " linear-gradient(140deg, #FFFBF5 0%, #FFF5E9 30%, #FFE8D6 60%, #FFD4B8 100%)",
        }}
        className="fixed inset-0 z-60 overflow-y-auto min-h-screen pb-8"
      >
        <div className="z-50 flex items-center justify-between px-4 sm:px-5 md:px-8 py-4 sm:py-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white hover:bg-gray-50 transition-colors text-navy-dark font-medium text-[13px] sm:text-[15px] shadow-sm"
            aria-label="Go back"
          >
            <IoArrowBack className="size-4 sm:size-5" />
            <span>Back</span>
          </button>

          {/* Random Category Badge */}
        </div>

        {/* Content */}
        <div className="z-40 flex flex-col items-center justify-center px-4 sm:px-6">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 rounded-full bg-[#E9D4FF80] text-purple-700 font-semibold text-[10px] sm:text-[11px] uppercase tracking-[1.1px]">
            <IoIosShuffle className="size-3.5 sm:size-4" />
            <span className="text-[#59168B]">
              {isPremiumFlow
                ? "Your Selected Category"
                : "Your Random Category"}
            </span>
          </div>
          <div className="max-w-[750px] w-full">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6 px-2">
              <h2 className="font-serif text-[28px] sm:text-[40px] md:text-[52px] font-bold text-navy-dark leading-tight mb-2">
                Ready to play?
              </h2>
              <p className="text-gray-600 text-[14px] sm:text-[15px] md:text-[17px] px-4">
                {introText}
              </p>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center">
              <img src="/semistar.png" alt="Star" className="w-20 sm:w-auto" />
            </div>

            {/* Game Preview Card */}
            <div className="relative bg-white rounded-[24px] sm:rounded-[40px] shadow-[0_12px_48px_rgba(0,0,0,0.12)] mb-6">
              {/* Lion Image Container */}
              <div className="relative bg-gradient-to-b from-gray-50 to-white flex flex-col sm:flex-row items-end justify-center rounded-t-[24px] sm:rounded-t-[40px] overflow-hidden p-4 sm:p-0">
                {/* Placeholder for lion image - replace with actual image */}

                <div className="flex items-center justify-center w-full sm:w-[40%] mb-4 sm:mb-0">
                  <div className="relative sm:left-[40px] z-9">
                    {/* Placeholder circle for image */}
                    <img
                      src="./landing/lion.png"
                      alt="Lion"
                      className="h-32 sm:h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                {/* Category Info Card */}
                <div className="flex flex-col items-center sm:items-start justify-center sm:pt-[30px] gap-[10px] sm:gap-[20px] w-full sm:w-auto">
                  <img
                    src="./landing/puzzle.png"
                    alt="Puzzle"
                    className="w-24 sm:w-full h-auto object-cover sm:relative sm:right-[110px] sm:bottom-[30px] sm:top-[0px]"
                  />

                  <div className="bg-[#264DA7] text-white rounded-[20px] sm:rounded-[25px] p-4 sm:p-6 mb-[10px] sm:mb-[20px] sm:relative sm:right-[45px] shadow-[0_4px_0_0_#E17100] w-full sm:flex">
                    <div className="hidden sm:block sm:w-[30%]"></div>
                    <div className="w-full sm:w-[70%]">
                      <h3 className="font-serif text-[24px] sm:text-[32px] font-bold mb-2">
                        {categoryName}
                      </h3>
                      <p className="text-white/90 text-[13px] sm:text-[14px] leading-relaxed">
                        {detailText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section with Start Button - Inside white card */}
              <div className="bg-[#264DA7] relative flex items-center justify-center rounded-b-[20px] sm:rounded-b-[25px] mt-4">
                {/* Start Playing Button */}
                <button
                  onClick={onStartPlaying}
                  className="w-[90%] sm:w-[85%] bg-gradient-to-r from-[#FE9A00] via-[#FF6900] to-[#E17100] hover:bg-orange-600 text-white font-bold text-[16px] sm:text-[20px] py-4 sm:py-5 px-8 sm:px-[100px] rounded-[10px] shadow-[0_8px_33px_-6px_rgba(255,255,255,0.88),0_0_5.9px_-5px_rgba(255,255,255,0.16),0_3px_11px_rgba(255,255,255,0.23)] transition-all hover:shadow-[0_16px_40px_rgba(255,149,0,0.6)] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 mb-3 sm:mb-4"
                >
                  <IoPlaySharp className="size-5 sm:size-6" />
                  <span>Start Playing</span>
                </button>
              </div>
            </div>
          </div>
          <div
            className="relative max-w-[750px] w-full text-white m-auto z-[99] rounded-[20px] sm:rounded-[28px] p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #101828 0%, #101828 50%, #1E2939 100%)",
            }}
          >
            {/* Subtle glow */}
            <div className="size-[150px] sm:size-[200px] absolute -top-16 sm:-top-20 -right-16 sm:-right-20 bg-brand-orange/20 blur-[80px] rounded-full pointer-events-none" />

            {/* Purple/Pink gradient glow */}
            <div
              className="absolute w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] rounded-full pointer-events-none"
              style={{
                top: "-19px",
                left: "-6px",
                background:
                  "linear-gradient(135deg, rgb(173, 70, 255) 10%, rgb(246 51 154 / 38%) 10%)",
                filter: "blur(80px)",
              }}
            />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="w-full sm:w-[80%] sm:px-[25px]">
                <h3 className="font-serif text-[20px] sm:text-[28px] font-semibold mb-2 leading-tight">
                  {isPremiumFlow
                    ? "Premium category selected"
                    : "Want to choose your category?"}
                </h3>
                <p className="text-white/70 text-[14px] sm:text-[16px] leading-relaxed">
                  {isPremiumFlow
                    ? "You can change your pick anytime before starting another game."
                    : "Upgrade to Premium for category selection, exclusive puzzles, no ads, and more."}
                </p>
              </div>
              <div className="flex sm:w-[20%] items-center sm:flex-col sm:items-end gap-3 sm:gap-1 flex-shrink-0">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[#FFB900] text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider">
                    Starting at
                  </span>
                  <span className="text-white font-bold text-[20px] sm:text-[24px]">
                    $9/mo
                  </span>
                </div>
                <img src="/arrow.png" alt="Arrow" className="w-8 sm:w-auto" />
              </div>
            </div>
          </div>

          {/* Premium Upgrade Card */}
        </div>
      </div>
      <div className="bg-white relative">
        <div className="absolute bottom-0 w-full top-[-70px] items-center justify-center h-[70px] bg-white">
          {/* White background covering bottom half */}
        </div>
      </div>
    </>
  );
}
