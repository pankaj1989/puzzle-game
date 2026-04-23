import React from "react";
import { IoArrowForwardOutline } from "react-icons/io5";

const CtaButton = ({
  label,
  className = "hidden lg:inline-flex shrink-0",
}) => {
  const baseClassName =
    "items-center justify-center gap-1 whitespace-nowrap rounded-full navy-gradient text-sm text-white shadow-[0_16px_28px_rgba(0,0,0,0.3)] transition-all duration-300 sm:text-[25px] border-2 border-brand-orange-dark leading-0 tracking-[0px] group cursor-pointer px-[28px] py-[23.5px]";
  return (
    <button
      // href={href}
      className={`${baseClassName} ${className}`}
    >
      <span className="mb-0.5">{label}</span>
      <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform duration-300" />
    </button>
  );
};

export default CtaButton;
