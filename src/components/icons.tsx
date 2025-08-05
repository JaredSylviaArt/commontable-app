import Image from 'next/image';
import type { HTMLAttributes } from "react";

export function Logo(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
        <Image
            src="https://i.postimg.cc/m2kkg3Xf/purple-icon-2x.png"
            alt="CommonTable Logo"
            width={40}
            height={40}
            className="w-full h-full"
        />
    </div>
  );
}
