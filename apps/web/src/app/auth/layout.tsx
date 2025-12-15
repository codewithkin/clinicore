import type { ReactNode } from "react"

function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <main className="p-4 md:p-8 h-screen">
            {children}
        </main>
    )
}

export default AuthLayout
