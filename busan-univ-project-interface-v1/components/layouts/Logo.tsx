import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback } from "react";

const Logo = () => {
  const router = useRouter();
  const handleLogoClick = useCallback(() => {
    router.push(`/dashboard`);
  }, [router]);

  return (
    <div className="flex gap-[10px] pb-[24px]" onClick={handleLogoClick}>
      {/* TODO: Add image icon in the path */}
      {/* <Image src={"/icons/ic_icon.svg"} alt="icon" height={24} width={24} /> */}
      <p className="font-bold">Project X</p>
    </div>
  );
};

export default Logo;
