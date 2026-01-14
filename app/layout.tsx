import './globals.css';

export const metadata = {
  title: 'selah',
  description: 'A brief pause.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-selah-bg text-selah-text min-h-screen antialiased">
        <main className="max-w-md mx-auto px-6 py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
