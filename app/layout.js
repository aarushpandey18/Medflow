import "./globals.css";

export const metadata = {
  title: "MedFlow Dashboard",
  description: "Doctor prescription management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
