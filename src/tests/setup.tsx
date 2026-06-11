/**
 * @module TestSetup
 * @description Global test setup for Vitest.
 * Configures testing-library matchers, mock providers, and Firebase mocks.
 */
import "@testing-library/jest-dom/vitest";

import { vi } from 'vitest';

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
  app: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback: (user: null) => void) => {
      callback(null);
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
  analytics: null,
  performance: null,
  remoteConfig: null,
  messaging: null,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    const imgProps: Record<string, unknown> = { src, alt };
    // Only pass through safe HTML attributes
    if (props.width) imgProps.width = props.width;
    if (props.height) imgProps.height = props.height;
    if (props.className) imgProps.className = props.className;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imgProps} />;
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: "div",
      span: "span",
      button: "button",
      circle: "circle",
      path: "path",
      p: "p",
      h1: "h1",
      h2: "h2",
      h3: "h3",
      section: "section",
      article: "article",
      li: "li",
      ul: "ul",
      a: "a",
      nav: "nav",
      form: "form",
      input: "input",
      img: "img",
      svg: "svg",
      rect: "rect",
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
  };
});

// Suppress console.error for expected test failures
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    if (
      message.includes("Not implemented") ||
      message.includes("Warning: ReactDOM.render")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
