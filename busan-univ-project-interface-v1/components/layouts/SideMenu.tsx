import React from "react";
import Logo from "./Logo";
import Navigation from "./Navigation";

function SideMenu() {
  return (
    <div className="min-w-[240px] px-[40px] py-[40px] bg-background_side rounded-[12px]">
      <div className="flex flex-col h-full ">
        <Logo />
        <Navigation />
      </div>
    </div>
  );
}

export default SideMenu;
