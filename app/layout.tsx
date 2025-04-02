import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Providers } from './providers'
import AuthNav from './components/AuthNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Marketplace App',
    description: 'Browse and shop for various items',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <Providers>
            <nav className="bg-blue-600 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold">Marketplace</Link>
                    <AuthNav />
                </div>
            </nav>
            {children}
            <footer className="bg-gray-100 p-4 mt-8">
                <div className="container mx-auto text-center text-gray-600">
                    © {new Date().getFullYear()} Marketplace App
                </div>
            </footer>
        </Providers>
        </body>
        </html>
    )
}