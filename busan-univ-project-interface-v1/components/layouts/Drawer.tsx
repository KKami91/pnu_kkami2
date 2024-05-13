import { Fragment, PropsWithChildren, useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import Logo from "./Logo";
import Navigation from "./Navigation";

const Drawer = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button className="mr-[8px]" onClick={() => setDrawerOpen(true)}>
        <Bars3Icon className="flex h-[28px] w-[28px]" aria-hidden="true" />
      </button>
      <DrawerTransition isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex flex-col justify-start h-full py-[24px] px-[20px] text-foreground bg-background ">
          {/* Logo */}
          <div onClick={() => setDrawerOpen(false)}>
            <Logo />
          </div>

          {/* Menu */}
          <Navigation onSelect={() => setDrawerOpen(false)} />
        </div>
      </DrawerTransition>
    </>
  );
};

interface DrawerTransitionProps {
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}
const DrawerTransition = ({ className, isOpen, onClose, children }: PropsWithChildren<DrawerTransitionProps>) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 sm:hidden" onClose={() => onClose?.()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full justify-start text-center items-center h-screen">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="w-[340px] h-full">{children}</Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Drawer;
