import { ReactElement } from "react";
import { Poppins } from "next/font/google";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SideMenu from "./SideMenu";
import Drawer from "./Drawer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export default function DefaultLayout({ children }: { children: ReactElement }) {
  return (
    <main className={`${poppins.variable} font-sans relative bg-background text-foreground`}>
      <div className="flex h-screen overflow-hidden">
        {/* Tablet / PC */}
        <div className="hidden sm:flex">
          <SideMenu />
        </div>

        {/* Body */}
        <div className="flex grow overflow-y-auto">
          <div className="flex flex-grow bg-background mx-[36px] my-[24px]">
            <div className="flex flex-col w-full h-full gap-[24px] pb-[20px]">
              {/* Header */}
              <Header />

              <section className="flex h-full border border-1 rounded-[12px]">{children}</section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const Header = () => {
  return (
    <div className="flex w-full h-[48px] justify-between items-center  border border-1 rounded-[12px]">
      {/* Mobile */}
      <div className="flex sm:hidden pl-[8px]">
        <Drawer />
      </div>

      {/* Left */}
      <div></div>

      {/* Right */}
      <div className="pr-[12px]">
        <Avatar className="w-[28px] h-[28px]">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
