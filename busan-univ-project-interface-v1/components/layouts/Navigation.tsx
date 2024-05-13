import React, { Fragment } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const style = {
  selection: {
    selected: "text-foreground",
    cursor: "absolute inset-x-0 w-[8px] h-[40px] rounded-r-[4px] bg-primary",
    unselected: "muted-foreground",
    child: "group-hover:opacity-80",
  },
};

const navigation = [
  {
    name: "",
    menus: [
      {
        id: "000",
        icon: PresentationChartLineIcon,
        name: "Dashboard",
        href: "/dashboard",
        tag: "",
      },
      {
        id: "001",
        icon: PresentationChartLineIcon,
        name: "HRV Data",
        href: "/hrv",
        tag: "",
      },
    ],
    subMenu: [
      // { id: "000", icon: UserIcon, name: "My Page", href: "/myPage", tag: "" },
    ],
  },
];

interface NavigationProps {
  onSelect?: () => void;
}

const Navigation = ({ onSelect }: NavigationProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="grow">
        <nav aria-label="Sidebar">
          {/* Nav */}
          {navigation.map((item: any) => (
            <div key={item.name}>
              {/* Header */}
              {item.name && <p className="text-caption font-bold text-foreground mb-[12px]">{item.name}</p>}

              {/* Navigations */}
              <div className="space-y-[8px]">
                {item.menus.map((menu: any) => {
                  const selected = menu.href === "/" ? router.pathname === menu.href : router.pathname.startsWith(menu.href);

                  return (
                    <div key={menu.name} className="flex flex-col">
                      {/* Main Menu */}
                      <SingleMenu menu={menu} selected={selected} active={!!menu.href} hasSubMenu={!!menu.submenus} />

                      {/* Child Menu */}
                      {menu.submenus && <SubMenus menus={menu.submenus} />}
                    </div>
                  );
                })}
              </div>

              {/* <div className="w-full h-[0px] my-[32px] border border-t-0 border-white border-opacity-20"></div> */}

              {/* Secondary Menu */}
              <div className="space-y-[8px]">
                {item.subMenu.map((subMenu: any) => {
                  const selected = subMenu.href === "/" ? router.pathname === subMenu.href : router.pathname.startsWith(subMenu.href);

                  return (
                    <div key={subMenu.name} className="flex">
                      {!!subMenu.href ? (
                        <Link
                          onClick={() => onSelect?.()}
                          href={subMenu.href}
                          className={cn(
                            selected ? style.selection.selected : style.selection.unselected,
                            style.selection.child,
                            "group w-full h-[48px] flex items-center text-menu-poppins"
                          )}
                        >
                          <subMenu.icon className={cn(style.selection.child, "mr-3 flex-shrink-0 h-6 w-6")} aria-hidden="true" />
                          <p className={cn(style.selection.child, "!font-normal")}>{subMenu.name}</p>
                          <div className={cn(selected ? style.selection.cursor : "")}></div>
                        </Link>
                      ) : (
                        <div className={cn(style.selection.unselected, "group w-full h-[48px] flex items-center")}>
                          <subMenu.icon
                            className={cn(style.selection.unselected, "muted-foreground mr-3 flex-shrink-0 h-6 w-6")}
                            aria-hidden="true"
                          />
                          <p className="muted-foreground">{subMenu.name}</p>
                          <div className="ml-[6px] bg-card border border-white border-opacity-10 rounded-[12px] text-xs px-[6px] py-[2px]">
                            Soon
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

interface SingleMenuProps {
  menu: any;
  selected: boolean;
  active: boolean;
  hasSubMenu: boolean;
  onSelect?: () => void;
}

const SingleMenu = ({ menu, active, onSelect, selected, hasSubMenu }: SingleMenuProps) => {
  if (!active)
    return (
      <div className={cn(style.selection.unselected, "group w-full h-[48px] flex items-center")}>
        <menu.icon className={cn(style.selection.unselected, "muted-foreground mr-3 flex-shrink-0 h-6 w-6")} aria-hidden="true" />
        <p className="muted-foreground">{menu.name}</p>
        <div className="ml-[6px] bg-card border border-white border-opacity-10 rounded-[12px] text-xs px-[6px] py-[2px]">Soon</div>
      </div>
    );

  if (hasSubMenu) {
    return (
      <div className={cn(style.selection.unselected, "group w-full h-[48px] flex items-center")}>
        <menu.icon className={cn(style.selection.unselected, "mr-3 flex-shrink-0 h-6 w-6")} aria-hidden="true" />
        <p>{menu.name}</p>
      </div>
    );
  }

  return (
    <Link
      onClick={() => onSelect?.()}
      href={menu.href}
      className={cn(selected ? style.selection.selected : style.selection.unselected, "group w-full h-[48px] flex items-center")}
    >
      <menu.icon
        className={cn(
          selected ? style.selection.selected : style.selection.unselected,
          style.selection.child,
          "mr-3 flex-shrink-0 h-6 w-6"
        )}
        aria-hidden="true"
      />
      <p className={style.selection.child}>{menu.name}</p>
    </Link>
  );
};

interface SubMenusProps {
  menus: any[];
  onSelect?: () => void;
}

const SubMenus = ({ menus, onSelect }: SubMenusProps) => {
  const router = useRouter();

  return (
    <Fragment>
      {menus.map((menu: any) => {
        const selected = menu.href === "/" ? router.pathname === menu.href : router.pathname.startsWith(menu.href);

        return <SubMenu key={menu.id} menu={menu} onSelect={onSelect} selected={selected} />;
      })}
    </Fragment>
  );
};

interface SubMenuProps {
  menu: any;
  selected: boolean;
  onSelect?: () => void;
}
const SubMenu = ({ menu, selected, onSelect }: SubMenuProps) => {
  return (
    <Link
      onClick={() => onSelect?.()}
      href={menu.href}
      className={cn(
        selected ? style.selection.selected : style.selection.unselected,
        "group w-full h-[48px] flex items-center ml-[48px] text-sm"
      )}
    >
      <p className={style.selection.child}>{menu.name}</p>
    </Link>
  );
};

export default Navigation;
