import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("storefront", () => {
  it("renders the home page heading", () => {
    render(<h1>Bazaar</h1>);

    expect(screen.getByRole("heading", { name: "Bazaar" })).toBeInTheDocument();
  });
});
