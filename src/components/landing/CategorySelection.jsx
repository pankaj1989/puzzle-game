import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import { FaCrown } from "react-icons/fa";
import { IoIosShuffle } from "react-icons/io";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";

const CATEGORY_UI = {
  music: { catname: "Music", description: "Artists, albums & lyrics", image: "/music.png", bgColor: "radial-gradient(52.35% 52.35% at 47.26% 47.65%, #2366AD 0%, #12151C 100%)", watermarkColor: "#007AFF24", watermarkText: "MUSIC" },
  movies: { catname: "Movies & TV", description: "Films, shows & directors", image: "/movies.png", bgColor: "radial-gradient(52.35% 52.35% at 47.26% 47.65%, #6B8659 0%, #243731 100%)", watermarkColor: "#00FF001A" },
  food: { catname: "Food & Drink", description: "Cuisine, flavors & chefs", image: "/food.png", bgColor: "radial-gradient(52.35% 52.35% at 47.26% 47.65%, #BF4EB8 0%, #2A263D 100%)", watermarkColor: "#F100FF24" },
  technology: { catname: "Technology", description: "Gadgets & breakthroughs", image: "/technology.png", bgColor: "radial-gradient(49.2% 52.35% at 47.26% 47.65%, #D93470 0%, #612239 100%)", watermarkColor: "#a02454" },
  animals: { catname: "Animals", description: "Wildlife, pets & species", image: "/animal.png", bgColor: "radial-gradient(49.2% 52.35% at 47.26% 47.65%, #065EAC 0%, #0C3257 100%)", watermarkColor: "#0085FF24" },
};

export function CategorySelection({ isOpen, onClose: _onClose, onBack, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get("/categories");
        if (!active) return;
        setCategories(data.categories || []);
      } catch (err) {
        if (active) setError(err.message || "Could not load categories");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  const viewCategories = useMemo(
    () =>
      categories.map((c, idx) => ({
        id: c._id || c.slug || idx,
        slug: c.slug,
        name: c.name,
        ...CATEGORY_UI[c.slug],
        catname: CATEGORY_UI[c.slug]?.catname || c.name,
        description: CATEGORY_UI[c.slug]?.description || "Solve puzzles from this category.",
        bgColor:
          CATEGORY_UI[c.slug]?.bgColor ||
          "radial-gradient(52.35% 52.35% at 47.26% 47.65%, #2366AD 0%, #12151C 100%)",
        watermarkColor: CATEGORY_UI[c.slug]?.watermarkColor || "#007AFF24",
      })),
    [categories]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-white z-40" />

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-6 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-gray-50 transition-colors text-gray-600 font-medium text-[14px] shadow-sm border border-gray-200"
          aria-label="Go back"
        >
          <IoArrowBack className="size-4" />
          <span>Back</span>
        </button>

        {/* Premium Member Badge */}
        <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-orange-50 text-[#7B3306] font-semibold text-[14px] border border-[#F0C96B]" style={{boxShadow: '0px 0px 6px -4px #FEE6854D, 0px 0px 0px -3px #FEE6854D'}}>
        <img src="/crown.svg"></img>
          <span>Premium Member</span>
        </div>
      </div>

      {/* Content */}
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-start p-6 pt-28 pb-8 overflow-y-auto">
        <div className="max-w-[1100px] w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-bold uppercase tracking-[1.2px] text-white">
                {/* <IoIosShuffle className="size-3" />
                 */}
                 <img src="/star.svg" alt="Shuffle" className="size-3" />
                Premium Access
              </span>
            </div>
            <h2 className="font-serif text-[44px] md:text-[56px] font-bold text-navy-dark leading-tight mb-3">
              Choose Your Category
            </h2>
            <p className="text-gray-600 text-[16px] md:text-[18px] mb-8">
              Pick any category you like. You have full access to all puzzles.
            </p>
            <h3 className="text-navy-dark font-bold text-[15px] uppercase tracking-wide mb-6">
              All categories
            </h3>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[50px]">
            {loading && <p className="col-span-full text-center text-text-muted">Loading categories...</p>}
            {error && <p className="col-span-full text-center text-red-600">{error}</p>}
            {!loading &&
              !error &&
              viewCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => onSelectCategory?.({ slug: category.slug, name: category.catname || category.name })}
                className="group  relative rounded-[35px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Top Section with Image */}
                <div
                  className="relative h-[250px] flex items-center  rounded-t-[35px] justify-center"
                  style={{ background: category.bgColor }}
                >
                  {/* Watermark text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span 
                      className="font-black uppercase tracking-[0px] leading-none text-center"
                      style={{ 
                        fontFamily: 'Inter',
                        color: category.watermarkColor || 'rgba(255, 255, 255, 0.1)',
                        fontSize: category.name.length > 8 ? '50px' : category.name.length === 7 ? '70px' : category.name.length > 4 ? '85px' : category.name.length === 4 ? '110px' : '120px',
                        ...category.watermarkStyle // Merge custom styles
                      }}
                    >
                      {category.watermarkText || category.name.split(' ')[0]}
                    </span>
                  </div>
                  
                  {category.isRandom ? (
                    <div className="text-white text-[120px] font-bold relative z-10">?</div>
                  ) : (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-[280px] w-auto object-contain relative z-0"
                    />
                  )}
                </div>

                {/* Bottom Section */}
                <div className="text-white top-[-25px] p-3 text-center relative rounded-[35px]" style={{background: "radial-gradient(26.43% 50%, rgb(2 15 15 / 93%) 0%, #000 100%)"}}>
                  <h3 className="font-inter text-[26px] font-bold  leading-tight">
                    {category.catname}
                  </h3>
                  <p className="text-white text-[13px] leading-relaxed">
                    {category.description}
                  </p>
<hr className="border-t border-white/50 my-2" />
                  {/* Puzzle count and arrow */}
                  <div className="flex items-center justify-between">
                    <span className="text-white text-[12px] font-medium">
                      {category.puzzles}
                    </span>
                    <div className="size-6 rounded-full border border-white flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <IoArrowForward className="size-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
