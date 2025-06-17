import "./global.css";

console.log = Function.prototype.bind.call(console.log, console);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
