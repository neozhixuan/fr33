"use client";

import Link from "next/link";
import { type ButtonHTMLAttributes } from "react";

type customButtonProps = {
    href?: string;
}

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & customButtonProps) {
    return (
        props.href ? (
            <Link href={props.href}><BaseButton {...props}>{props.children}</BaseButton></Link>
        ) : (
            <BaseButton {...props}>{props.children}</BaseButton>
        )
    )
}

function BaseButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button className="p-2 bg-gray-500 text-white rounded-md" {...props}>
            {props.children}
        </button>
    )
}