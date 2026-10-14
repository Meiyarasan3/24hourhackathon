import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Live Dashboard" },
  { href: "/teams", label: "Teams" },
  { href: "/problems", label: "Problem Statements" },
  { href: "/schedule", label: "Schedule" },
  { href: "/announcements", label: "Announcements" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em]">SYNAPSE 24</p>
          <p className="mt-2 text-sm text-muted-foreground">24-hour hackathon</p>
          <p className="mt-4 text-sm text-muted-foreground">Organized by the Coding Club and AI Frontier Club.</p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-medium">Navigate</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-medium">Contact</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Contact details have not been published. This footer will list them when the organizers provide a verified address.
          </p>
        </div>
      </div>
    </footer>
  );
}
