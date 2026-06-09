import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import { IoIosShuffle } from "react-icons/io";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { getUserFriendlyApiMessage } from "../../api/apiErrors";
import { getCategoryUi, normalizeCategoryName } from "./categoryUiConfig.js";

function CategoryHeroArt({ category }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (category.isRandom) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center relative z-10">
        <span
          className="font-black text-white leading-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          style={{ fontSize: "clamp(72px, 18vw, 120px)" }}
        >
          ?
        </span>
      </div>
    );
  }

  if (!category.image || imgFailed) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center relative z-10">
        <IoIosShuffle
          className="size-[88px] text-white/90 drop-shadow-lg"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <img
      src={category.image}
      alt=""
      className="relative z-[1] max-h-[260px] w-auto max-w-[92%] object-contain object-bottom"
      onError={() => setImgFailed(true)}
    />
  );
}

export function CategorySelection({
  isOpen,
  onClose: _onClose,
  onBack,
  onSelectCategory,
}) {
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
    const items = categories.map((c, idx) => {
      const ui = getCategoryUi(c);
      const normalizedName = normalizeCategoryName(c.name);
      const isRandom = Boolean(ui.isRandom) || normalizedName === "random";
      const rawImage = isRandom ? null : c.image || ui.image || null;
      const label = ui.catname || c.name;
      return {
        id: c._id || idx,
        categoryId: c._id || null,
        name: c.name,
        catname: label,
        description: ui.description || "Solve puzzles from this category.",
        image: rawImage,
        bgColor:
          ui.bgColor ||
          "radial-gradient(52.35% 52.35% at 47.26% 47.65%, #1e3a5f 0%, #0f172a 100%)",
        watermarkColor: ui.watermarkColor || "rgba(255, 255, 255, 0.14)",
        watermarkText: ui.watermarkText || label.split(/\s+/)[0].toUpperCase(),
        isRandom,
      };
    });
    return items.sort((a, b) => {
      if (a.isRandom === b.isRandom) return 0;
      return a.isRandom ? 1 : -1;
    });
  }, [categories]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-modal-backdrop"
        style={{
          background:
            "linear-gradient(165deg, #fffdfb 0%, #fff5eb 45%, #ffe8d6 100%)",
        }}
      />

      <header className="fixed top-0 left-0 right-0 z-modal-nested flex items-center justify-between  px-4 py-4 sm:px-8 sm:py-5">
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
          className="flex items-center gap-2 rounded-full border border-[#f0c86bc7]  px-4 py-2.5 text-[13px] font-semibold text-[#7B3306] shadow-sm sm:text-[14px]"
          style={{ boxShadow: "0px 0px 6px -4px #FEE6854D" }}
        >
          <img src="/crown.svg" alt="" className="size-4 shrink-0" />
          <span>Premium Member</span>
        </div>
      </header>

      <main className="fixed inset-0 z-modal flex flex-col overflow-y-auto px-4 pb-12 pt-[5.25rem] sm:px-6 sm:pt-24">
        <div className="mx-auto w-full max-w-[1200px] flex-1">
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
            <h2 className="mt-10 text-[13px] font-bold uppercase tracking-[0.2em] text-navy-dark/70 sm:mt-12">
              All categories
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 xl:grid-cols-3">
            {loading && (
              <p className="col-span-full py-12 text-center text-text-muted">
                Loading categories…
              </p>
            )}
            {error && (
              <p className="col-span-full py-12 text-center text-red-600">
                {error}
              </p>
            )}
            {!loading &&
              !error &&
              viewCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    onSelectCategory?.({
                      id: category.categoryId,
                      name: category.catname,
                      image: category.isRandom ? null : category.image,
                      description: category.description,
                      isRandom: category.isRandom,
                    })
                  }
                  className="group w-full text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 relative h-[320px] flex flex-col justify-end"
                >
                  <div className="absolute top-0 w-full flex justify-center ">
                    <CategoryHeroArt category={category} />
                  </div>

                  <div
                    className="overflow-hidden rounded-t-[28px]  bg-white shadow-[0_12px_40px_rgba(15,23,42,0.1)] transition-shadow duration-200 group-hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)]  min-h-[200px] -z-10 absolute bottom-22 w-full"
                    style={{ background: category.bgColor }}
                  />
                  {/* <div
                    className="overflow-hidden rounded-[28px] border border-gray-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.1)] transition-shadow duration-200 group-hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)] "
                    style={{ background: category.bgColor }}
                  > */}
                  <div
                    className="relative flex min-h-[220px]  justify-center px-2 pt-10 pb-2 sm:min-h-[180px] sm:px-4"
                    // style={{ background: category.bgColor }}
                  >
                    {/* <div className="pointer-events-none absolute inset-0 flex items-center justify-center"> */}
                    <span
                      className="pointer-events-none select-none text-center font-black uppercase leading-none text-white/[0.09]"
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize:
                          category.watermarkText.length > 9
                            ? "clamp(36px, 9vw, 48px)"
                            : category.watermarkText.length > 6
                              ? "clamp(44px, 11vw, 72px)"
                              : "clamp(52px, 13vw, 76px)",
                      }}
                    >
                      {category.watermarkText}
                    </span>
                    {/* </div> */}
                  </div>

                  <div
                    className="border-t border-white/10 px-4 py-1 text-white text-center rounded-[28px] z-100"
                    style={{
                      background:
                        "radial-gradient(120% 120% at 50% 0%, #1a1a1f 0%, #0a0a0c 55%, #000 100%)",
                    }}
                  >
                    <div className="text-center pt-3">
                      <h3 className="font-sans text-[1.35rem] font-bold leading-snug tracking-tight sm:text-[1.8rem]">
                        {category.catname}
                      </h3>
                      <p className="text-[13px] leading-relaxed text-white/75 sm:text-[14px]">
                        {category.description}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-white/50 pt-2 pb-1">
                      <span className="text-[12px] font-medium text-white">
                        Tap to play
                      </span>
                      <span className="flex size-6 items-center justify-center rounded-full border border-white/35 bg-white/5 transition-colors group-hover:border-white/60 group-hover:bg-white/10">
                        <IoArrowForward
                          className="size-4 text-white"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </div>
                  {/* </div> */}
                </button>
              ))}
          </div>
        </div>
      </main>
    </>
  );
}
