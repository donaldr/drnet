export default function Section({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div id="work" className="h-full" data-scroll data-scroll-repeat>
      {children}
    </div>
  );
}
