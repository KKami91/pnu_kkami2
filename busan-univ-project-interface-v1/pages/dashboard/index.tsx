import { NextPage } from "next";
import Link from "next/link";


const DashboardPage: NextPage = () => {
  return (
    <div className="px-[18px] py-[8px] md:px-[24px] md:py-[12px]">
      <h1 className="flex font-bold text-[28px]">
        <Link href="/hrv" legacyBehavior>
          <a>HRV Data Page</a>
        </Link>
      </h1>
    </div>
  );
};

export default DashboardPage;
