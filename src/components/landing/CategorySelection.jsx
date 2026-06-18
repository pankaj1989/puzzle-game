import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import { IoIosShuffle } from "react-icons/io";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { getUserFriendlyApiMessage } from "../../api/apiErrors";
import { getCategoryUi, normalizeCategoryName, CATEGORY_UI } from "./categoryUiConfig.js";

function buildRandomCategoryCard() {
  const ui = CATEGORY_UI.random;
  return {
    id: "random",
    categoryId: null,
    rawName: "Random",
    catname: ui.catname,
    description: ui.description,
    image: null,
    bgColor: ui.bgColor,
    watermarkText: ui.watermarkText || "RANDOM",
    isRandom: true,
  };
}

function CategoryCard({ category, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !category.isRandom && category.image && !imgFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
    >
      <div className="overflow-hidden rounded-[20px] border border-white/5 shadow-[0_4px_24px_rgba(15,23,42,0.12)] transition-all duration-300 group-hover:shadow-[0_12px_40px_rgba(15,23,42,0.2)] group-hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_16px_rgba(15,23,42,0.1)]">
        {/* Image / Hero area — fixed 220px height, image fills it fully */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ background: category.bgColor, height: "220px" }}
        >
          {/* Watermark text */}
          <span
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center font-black uppercase leading-none text-white/[0.07] max-w-[99%] mx-auto overflow-hidden"
            style={{
              fontSize:
                category.watermarkText.length > 9
                  ? "clamp(20px, 14vw, 45px)"
                  : category.watermarkText.length > 6
                    ? "clamp(72px, 16vw, 70px)"
                    : "clamp(84px, 18vw, 90px)",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
            aria-hidden
          >
            {category.watermarkText}
          </span>

          {/* Category image — fixed 160×160, covers uniformly */}
          {showImage ? (
            <img
              src={`${import.meta.env.VITE_MEDIAURL}/${category.image}`}
              alt=""
              className="relative z-10 drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)] !h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : category.isRandom ? (
            <span
              className="relative z-10 font-black text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              style={{ fontSize: "clamp(72px, 16vw, 100px)", lineHeight: 1 }}
            >
              ?
            </span>
          ) : (
            <IoIosShuffle
              className="relative z-10 size-20 text-white/80 drop-shadow-lg"
              aria-hidden
            />
          )}
        </div>

        {/* Info footer */}
        <div
          className="px-5 py-4"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 0%, #16161a 0%, #0a0a0c 60%, #000 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-sans text-[1.15rem] font-bold leading-snug tracking-tight text-white sm:text-[1.3rem]">
                {category.catname}
              </h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-white/60 line-clamp-2">
                {category.description}
              </p>
            </div>
            <span className="mt-0.5 flex shrink-0 size-8 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all group-hover:border-white/50 group-hover:bg-white/10">
              <IoArrowForward className="size-4 text-white" aria-hidden />
            </span>
          </div>
          <div className="mt-3 border-t border-white/10 pt-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Tap to play
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function CategorySelection({ isOpen, onBack, onSelectCategory }) {
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
        if (active)
          setError(getUserFriendlyApiMessage(err, "Could not load categories"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  const viewCategories = useMemo(() => {
    const items = categories
      .filter((c) => {
        const ui = getCategoryUi(c);
        const normalizedName = normalizeCategoryName(c.name);
        return !(Boolean(ui.isRandom) || normalizedName === "random");
      })
      .map((c, idx) => {
        const ui = getCategoryUi(c);
        const label = ui.catname || c.name;
        return {
          id: c._id || idx,
          categoryId: c._id || null,
          rawName: c.name,
          catname: label,
          description: ui.description || "Solve puzzles from this category.",
          image: c.image || ui.image || null,
          bgColor:
            ui.bgColor ||
            "radial-gradient(52.35% 52.35% at 47.26% 47.65%, #1e3a5f 0%, #0f172a 100%)",
          watermarkText: ui.watermarkText || label.split(/\s+/)[0].toUpperCase(),
          isRandom: false,
        };
      });

    if (items.length >= 4) {
      return [...items, buildRandomCategoryCard()];
    }
    return items;
  }, [categories]);

  if (!isOpen) return null;

  return (
    <>
      {/* Page background */}
      <div
        className="fixed inset-0 z-modal-backdrop"
        style={{
          background:
            "linear-gradient(165deg, #fffdfb 0%, #fff5eb 45%, #ffe8d6 100%)",
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-modal-nested flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-navy-dark shadow-sm transition-colors hover:bg-gray-50"
          aria-label="Go back"
        >
          <IoArrowBack className="size-4 shrink-0" />
          <span>Back</span>
        </button>

        <div
          className="flex items-center gap-2 rounded-full border border-[#f0c86bc7] px-4 py-2.5 text-[13px] font-semibold text-[#7B3306] shadow-sm sm:text-[14px]"
          style={{ boxShadow: "0px 0px 6px -4px #FEE6854D" }}
        >
          <img src="/crown.svg" alt="" className="size-4 shrink-0" />
          <span>Premium Member</span>
        </div>
      </header>

      {/* Main content */}
      <main className="fixed inset-0 z-modal flex flex-col overflow-y-auto px-4 pb-16 pt-[5.25rem] sm:px-6 sm:pt-24">
        <div className="mx-auto w-full max-w-[1100px] flex-1">
          {/* Page heading */}
          <div className="mb-10 text-center sm:mb-12">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-navy-dark px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              <img src="/star.svg" alt="" className="size-3" />
              Premium Access
            </p>
            <h1 className="font-serif text-[clamp(1.75rem,4vw,3.25rem)] font-bold leading-tight text-navy-dark">
              Choose Your Category
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600 sm:text-[17px]">
              Pick any category you like. You have full access to all puzzles.
            </p>

            <div className="mt-10 flex items-center gap-4 sm:mt-12">
              <span className="h-px flex-1 bg-navy-dark/10" />
              <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-navy-dark/50">
                All categories
              </h2>
              <span className="h-px flex-1 bg-navy-dark/10" />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
            {loading && (
              <p className="col-span-full py-16 text-center text-gray-400">
                Loading categories…
              </p>
            )}
            {error && (
              <p className="col-span-full py-16 text-center text-red-600">
                {error}
              </p>
            )}
            {!loading && !error && (
              <>
                {viewCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() =>
                      onSelectCategory?.({
                        id: category.categoryId,
                        name: category.rawName,
                        image: category.isRandom ? null : category.image,
                        isRandom: category.isRandom,
                      })
                    }
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
