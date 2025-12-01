import { auth, signOut } from "@/server/auth";
import CentralContainer from "@/layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";
import { UNAUTHORISED_REDIRECT_URL } from "@/lib/constants";

export default async function JobPortal() {
    // Server component (runs on Node runtime) - Block SSR if auth doesn't pass
    const session = await auth();
    if (!session?.user) {
        redirect(UNAUTHORISED_REDIRECT_URL);
    }

    return (
        <CentralContainer>
            <p>Job portal</p>
            <Button href={'/'}>Back to home</Button>
            <form action={logoutAction}>
                <Button type="submit">Logout</Button>
            </form>
        </CentralContainer>
    )
}

async function logoutAction() {
    'use server'

    await signOut({ redirectTo: '/' });
}