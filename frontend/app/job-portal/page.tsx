import Link from "next/link";

export default function JobPortal() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-5">
            <p>Job portal</p>
            <Link href={'/'}>Back to home</Link>

        </div>
    )
}