import { LoginForm } from "./components"
import { Suspense } from "react";
import Button from "../../ui/Button";
import CentralContainer from "../../layout/CentralContainer";

export default async function LoginPage() {
    return (
        <CentralContainer>
            <p>Login</p>
            <Button href={'/'}>Back to home</Button>
            <Button href={'/register'}>No account? Register here</Button>
            {/* Suspense is required for components using useSearchParams, to prevent premature access to params*/}
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </CentralContainer>
    )
}