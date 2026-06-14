import { IoArrowBack, IoPlaySharp } from "react-icons/io5";
import { IoIosShuffle } from "react-icons/io";

export function GameStartScreen({
  isOpen,
  onBack,
  onStartPlaying,
  category = null,
  isPremiumFlow = false,
  isStarting = false,
}) {
  if (!isOpen) return null;

  console.log("categorycategory",category) 

  const categoryName = String(category?.name || "").trim();
  const heroImageSrc = category?.image || null;
  const hasNamedCategory = Boolean(categoryName);
  const introText = isPremiumFlow
    ? `Awesome choice! You picked ${categoryName}.`
    : hasNamedCategory
      ? `We've picked a category for you. Upgrade to Premium to choose your own category.`
      : "We'll pick a random free category when you start.";
  const detailText = isPremiumFlow
    ? "You're in premium mode, so your selected category will be used for this game."
    : hasNamedCategory
      ? "Free mode starts with a random category. Upgrade to choose your own category anytime."
      : "The server will draw one category from the free pool so your game always matches what you play.";

  return (
    <>
      <div
        style={{
          background:
            " linear-gradient(140deg, #FFFBF5 0%, #FFF5E9 30%, #FFE8D6 60%, #FFD4B8 100%)",
        }}
        className="fixed inset-0 z-modal-nested overflow-y-auto min-h-screen p-2 md:p-6 "
      >
        <div className="z-50 flex items-center justify-between md:px-20">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-white border border-gray-200  transition-all duration-300 ease-in-out  text-navy-dark font-medium text-[13px] sm:text-[17px] shadow-[0_10px_10px_0_#0000000D] hover:shadow-[0_4px_10px_0_#0000000D]"
            aria-label="Go back"
          >
            <IoArrowBack className="size-4 sm:size-5" />
            <span>Back</span>
          </button>

          {/* Random Category Badge */}
        </div>

        {/* Content */}
        <div className="z-40 flex flex-col items-center justify-center px-0 sm:px-6 mt-3">
          <div className="flex items-center gap-2 px-3 sm:px-5 py-2 rounded-full bg-[#E9D4FF80] text-purple-700 border-2 border-purple-200 font-semibold text-[10px] sm:text-[13px] uppercase tracking-[1px]">
            <IoIosShuffle className="size-3.5 sm:size-6" />
            <span className="text-[#59168B]">
              {isPremiumFlow
                ? "Your Selected Category"
                : "Your Random Category"}
            </span>
          </div>
          <div className="max-w-[750px] w-full relative">
            {/* Header */}
            <div className="text-center px-2">
              <h2 className="font-serif text-[28px] sm:text-[40px] md:text-[65px] font-bold text-navy-dark leading-tight mb-2">
                Ready to play?
              </h2>
              <p className="text-gray-600 text-[14px] sm:text-[15px] md:text-[17px] px-4">
                {introText}
              </p>
            </div>

            {/* Stars */}

            {/* Game Preview Card */}
            <div className="flex flex-col items-center justify-center ">
              <div className="flex items-center justify-center ">
                <img
                  src="/semistar.png"
                  alt="Star"
                  className="w-[70%] sm:w-[60%]"
                />
              </div>
              <div className="w-full relative bg-white rounded-[24px] sm:rounded-[24px] shadow-[0_12px_48px_rgba(0,0,0,0.12)] mb-6 ">
                <div className="relative bg-gradient-to-b from-gray-50 to-white flex flex-col justify-center rounded-t-[24px] sm:rounded-t-[24px] overflow-hidden p-8 pb-2">
                  <img
                    src="./landing/puzzle.png"
                    alt="Puzzle"
                    className="w-[82%] mx-auto h-auto object-cover"
                  />
                  {/* Category Info Card */}
                  <div className="flex flex-col md:flex-row items-center justify-center pt-10 md:py-[30px] sm:w-auto relative">
                    <div className=" flex items-center justify-center  mb-4 md:mb-0 md:absolute left-0">
                      {/* Top image (outside circle) */}
                      {/* <div className="absolute md:-top-[100px] sm:-top-[70px] -top-[60px] z-20 md:w-[300px] md:h-[300px] w-[200px] h-[200px] aspect-square overflow-hidden">
                        {heroImageSrc ? (
                          <img
                            src={heroImageSrc}
                            alt={categoryName || "Category"}
                            className="md:h-[464px] md:w-[464px] w-full object-contain"
                          />
                        ) : null}
                      </div> */}

                      {/* Circle */}
 <div className="relative md:w-[300px] md:h-[300px] w-[200px] h-[200px] rounded-full border-4 border-blue-500 overflow-hidden bg-white flex items-center justify-center z-10">
  {category?.image ? (
    <img
      src={`${import.meta.env.VITE_MEDIAURL}/${category.image}`}
      alt={categoryName || "Category"}
      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
    />
  ) : (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#dbeafe] to-[#fde68a] text-[#264DA7] text-5xl font-bold">
      ?
    </div>
  )}
</div>
                    </div>
                    <div className="absolute left-0 bg-white h-full w-[80px] hidden md:block z-9"/>

                    <div className="bg-[#264DA7] text-white rounded-[20px] sm:rounded-[25px] p-4 md:p-6  shadow-[0_4px_0_0_#E17100] w-full flex items-center justify-between md:h-[228px] relative">
                      <div className="hidden md:block sm:w-[50%]"></div>
                      <div className=" text-center md:text-left md:max-w-[50%] w-full">
                        <h3 className="font-serif text-[24px] md:text-[46px] font-bold truncate">
                          {categoryName || "Random free category"}
                        </h3>
                        <p className="text-white/90 text-[13px] md:text-[16px] leading-relaxed max-h-[100px] overflow-y-auto custom-scrollbar">
                          {detailText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section with Start Button - Inside white card */}
                <div className="bg-[#264DA7] relative flex items-center justify-center rounded-b-[20px] sm:rounded-b-[25px] mt-2">
                  {/* Start Playing Button */}
                  <button
                    type="button"
                    onClick={onStartPlaying}
                    disabled={isStarting}
                    className="w-[90%] sm:w-[85%] bg-gradient-to-r from-[#FE9A00] via-[#FF6900] to-[#E17100] hover:bg-orange-600 text-white font-bold text-[16px] sm:text-[20px] py-4 sm:py-5 px-8 sm:px-[100px] rounded-[10px] shadow-[0_8px_33px_-6px_rgba(255,255,255,0.88),0_0_5.9px_-5px_rgba(255,255,255,0.16),0_3px_11px_rgba(255,255,255,0.23)] transition-all hover:shadow-[0_16px_40px_rgba(255,149,0,0.6)] active:scale-[0.98] flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 mb-3 sm:mb-4 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <IoPlaySharp className="size-5 sm:size-6" />
                    <span>{isStarting ? "Starting…" : "Start Playing"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {!isPremiumFlow && (
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
                    Want to choose your category?
                  </h3>
                  <p className="text-white/70 text-[14px] sm:text-[16px] leading-relaxed">
                    Upgrade to Premium for category selection, exclusive
                    puzzles, no ads, and more.
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
          )}
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
