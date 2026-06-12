import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import LandingPage from "@/app/page";
import LoginPage from "@/app/login/page";

expect.extend(toHaveNoViolations);

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, profile: null }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Page accessibility", () => {
  it("landing page has no axe violations", async () => {
    const { container } = render(<LandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("login page has no axe violations", async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
