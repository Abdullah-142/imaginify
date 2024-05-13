"use client";

import {
   Sheet,
   SheetClose,
   SheetContent,
   SheetTrigger,
} from "@/components/ui/sheet";
import { navLinks } from "@/constants";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

const MobileNav = () => {
   const pathname = usePathname();

   return (
      <header className="header">
         <Link href="/" className="flex items-center gap-2 md:py-2">
            <Image
               src="/assets/images/logo-text.svg"
               alt="logo"
               width={180}
               height={28}
            />
         </Link>

         <nav className="flex gap-2">
            <SignedIn>
               <UserButton afterSignOutUrl="/" />

               <Sheet>
                  <SheetTrigger>
                     <Image
                        src="/assets/icons/menu.svg"
                        alt="menu"
                        width={32}
                        height={32}
                        className="cursor-pointer"
                     />
                  </SheetTrigger>
                  <SheetContent className="sheet-content sm:w-64 max-w-56">
                     <div className="flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto">
                        <SheetClose asChild>
                           <section className="flex h-full flex-col gap-6 pt-3 text-white">
                              <Image
                                 src="/assets/images/logo-text.svg"
                                 alt="logo"
                                 width={152}
                                 height={23}
                              />
                              <ul className="flex flex-col gap-6">
                                 {navLinks.map((link) => {
                                    const isActive = link.route === pathname;

                                    return (
                                       <li
                                          className={`${
                                             isActive && "gradient-text"
                                          } p-18 flex whitespace-nowrap text-dark-700`}
                                          key={link.route}
                                       >
                                          <SheetClose asChild key={link.route}>
                                             <Link
                                                className="sidebar-link cursor-pointer"
                                                href={link.route}
                                             >
                                                <Image
                                                   src={link.icon}
                                                   alt="logo"
                                                   className="sm:block hidden"
                                                   width={24}
                                                   height={24}
                                                />
                                                {link.label}
                                             </Link>
                                          </SheetClose>
                                       </li>
                                    );
                                 })}
                              </ul>
                           </section>
                        </SheetClose>
                     </div>
                  </SheetContent>
               </Sheet>
            </SignedIn>

            <SignedOut>
               <Button asChild className="button bg-purple-gradient bg-cover">
                  <Link href="/sign-in">Login</Link>
               </Button>
            </SignedOut>
         </nav>
      </header>
   );
};

export default MobileNav;
