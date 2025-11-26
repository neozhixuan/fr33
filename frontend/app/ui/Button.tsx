"use client";

import { type ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button className="p-2 bg-gray-500 rounded-md" {...props}>
            {props.children}
        </button>
    )
}