import { ReactNode } from "react";

export default function CentralContainer(props: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-auto py-5 gap-5">
      {props.children}
    </div>
  );
}
